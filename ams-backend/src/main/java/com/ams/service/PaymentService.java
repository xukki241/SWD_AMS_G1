package com.ams.service;

import com.ams.config.VnPayConfig;
import com.ams.dto.PaymentDTO;
import com.ams.entity.ClassRegistration;
import com.ams.entity.PaymentTransaction;
import com.ams.exception.BadRequestException;
import com.ams.exception.ResourceNotFoundException;
import com.ams.repository.ClassRegistrationRepository;
import com.ams.repository.PaymentTransactionRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.time.LocalDateTime;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentService {

    private final VnPayConfig vnPayConfig;
    private final ClassRegistrationRepository registrationRepository;
    private final PaymentTransactionRepository paymentRepository;
    private final ClassRegistrationService registrationService;
    private final AuditLogService auditLogService;

    @Transactional
    public PaymentDTO.PaymentUrlResponse createPaymentUrl(Long registrationId, HttpServletRequest req) {
        ClassRegistration registration = registrationRepository.findById(registrationId)
                .orElseThrow(() -> new ResourceNotFoundException("Registration not found: " + registrationId));

        if (registration.getStatus() == ClassRegistration.RegistrationStatus.ACTIVE) {
            throw new BadRequestException("Registration is already paid and active");
        }

        BigDecimal amount = BigDecimal.valueOf(5000000); // 5,000,000 VND
        String txnRef = "TXN" + System.currentTimeMillis() + "-" + registration.getId();

        PaymentTransaction txn = PaymentTransaction.builder()
                .classRegistration(registration)
                .provider("VNPAY")
                .providerReference(txnRef)
                .amount(amount)
                .transactionStatus(PaymentTransaction.TransactionStatus.PENDING)
                .createdAt(LocalDateTime.now())
                .build();
        paymentRepository.save(txn);

        Map<String, String> vnp_Params = new HashMap<>();
        vnp_Params.put("vnp_Version", "2.1.0");
        vnp_Params.put("vnp_Command", "pay");
        vnp_Params.put("vnp_TmnCode", vnPayConfig.getTmnCode());
        vnp_Params.put("vnp_Amount", String.valueOf(amount.multiply(BigDecimal.valueOf(100)).longValue()));
        vnp_Params.put("vnp_CurrCode", "VND");
        vnp_Params.put("vnp_TxnRef", txnRef);
        vnp_Params.put("vnp_OrderInfo", "Thanh toan hoc phi lop " + registration.getSubjectClass().getClassCode());
        vnp_Params.put("vnp_OrderType", "other");
        vnp_Params.put("vnp_Locale", "vn");
        vnp_Params.put("vnp_ReturnUrl", vnPayConfig.getReturnUrl());
        vnp_Params.put("vnp_IpAddr", getClientIp(req));

        Calendar cld = Calendar.getInstance(TimeZone.getTimeZone("Etc/GMT+7"));
        SimpleDateFormat formatter = new SimpleDateFormat("yyyyMMddHHmmss");
        String vnp_CreateDate = formatter.format(cld.getTime());
        vnp_Params.put("vnp_CreateDate", vnp_CreateDate);

        cld.add(Calendar.MINUTE, 15);
        String vnp_ExpireDate = formatter.format(cld.getTime());
        vnp_Params.put("vnp_ExpireDate", vnp_ExpireDate);

        List<String> fieldNames = new ArrayList<>(vnp_Params.keySet());
        Collections.sort(fieldNames);
        StringBuilder hashData = new StringBuilder();
        StringBuilder query = new StringBuilder();

        Iterator<String> itr = fieldNames.iterator();
        while (itr.hasNext()) {
            String fieldName = itr.next();
            String fieldValue = vnp_Params.get(fieldName);
            if ((fieldValue != null) && (fieldValue.length() > 0)) {
                hashData.append(fieldName);
                hashData.append('=');
                hashData.append(URLEncoder.encode(fieldValue, StandardCharsets.US_ASCII));
                query.append(URLEncoder.encode(fieldName, StandardCharsets.US_ASCII));
                query.append('=');
                query.append(URLEncoder.encode(fieldValue, StandardCharsets.US_ASCII));
                if (itr.hasNext()) {
                    query.append('&');
                    hashData.append('&');
                }
            }
        }

        String queryUrl = query.toString();
        String vnp_SecureHash = hmacSHA512(vnPayConfig.getHashSecret(), hashData.toString());
        queryUrl += "&vnp_SecureHash=" + vnp_SecureHash;
        String paymentUrl = vnPayConfig.getPaymentUrl() + "?" + queryUrl;

        auditLogService.log("INIT_PAYMENT", "PaymentTransaction", txnRef);
        return new PaymentDTO.PaymentUrlResponse(paymentUrl, txnRef, amount);
    }

    @Transactional
    public boolean processReturn(Map<String, String> fields) {
        String vnp_SecureHash = fields.get("vnp_SecureHash");
        fields.remove("vnp_SecureHashType");
        fields.remove("vnp_SecureHash");

        String signValue = hashAllFields(fields);
        if (signValue.equalsIgnoreCase(vnp_SecureHash)) {
            String txnRef = fields.get("vnp_TxnRef");
            String responseCode = fields.get("vnp_ResponseCode");

            PaymentTransaction txn = paymentRepository.findByProviderAndProviderReference("VNPAY", txnRef)
                    .orElse(null);

            if (txn != null) {
                if ("00".equals(responseCode)) {
                    txn.setTransactionStatus(PaymentTransaction.TransactionStatus.SUCCESS);
                    paymentRepository.save(txn);
                    registrationService.activateRegistration(txn.getClassRegistration().getId());
                    auditLogService.log("PAYMENT_SUCCESS", "PaymentTransaction", txnRef);
                    return true;
                } else {
                    txn.setTransactionStatus(PaymentTransaction.TransactionStatus.FAILED);
                    paymentRepository.save(txn);
                    auditLogService.log("PAYMENT_FAILED", "PaymentTransaction", txnRef);
                    return false;
                }
            }
        }
        return false;
    }

    @Transactional
    public PaymentDTO.VnPayIpnResponse processIpn(Map<String, String> fields) {
        String vnp_SecureHash = fields.get("vnp_SecureHash");
        fields.remove("vnp_SecureHashType");
        fields.remove("vnp_SecureHash");

        String signValue = hashAllFields(fields);
        if (!signValue.equalsIgnoreCase(vnp_SecureHash)) {
            return new PaymentDTO.VnPayIpnResponse("97", "Invalid Checksum");
        }

        String txnRef = fields.get("vnp_TxnRef");
        PaymentTransaction txn = paymentRepository.findByProviderAndProviderReference("VNPAY", txnRef)
                .orElse(null);

        if (txn == null) {
            return new PaymentDTO.VnPayIpnResponse("01", "Order not Found");
        }

        if (txn.getTransactionStatus() != PaymentTransaction.TransactionStatus.PENDING) {
            return new PaymentDTO.VnPayIpnResponse("02", "Order already confirmed");
        }

        String responseCode = fields.get("vnp_ResponseCode");
        if ("00".equals(responseCode)) {
            txn.setTransactionStatus(PaymentTransaction.TransactionStatus.SUCCESS);
            paymentRepository.save(txn);
            registrationService.activateRegistration(txn.getClassRegistration().getId());
        } else {
            txn.setTransactionStatus(PaymentTransaction.TransactionStatus.FAILED);
            paymentRepository.save(txn);
        }

        return new PaymentDTO.VnPayIpnResponse("00", "Confirm Success");
    }

    private String hashAllFields(Map<String, String> fields) {
        List<String> fieldNames = new ArrayList<>(fields.keySet());
        Collections.sort(fieldNames);
        StringBuilder sb = new StringBuilder();
        Iterator<String> itr = fieldNames.iterator();
        while (itr.hasNext()) {
            String fieldName = itr.next();
            String fieldValue = fields.get(fieldName);
            if ((fieldValue != null) && (fieldValue.length() > 0)) {
                sb.append(fieldName);
                sb.append("=");
                sb.append(URLEncoder.encode(fieldValue, StandardCharsets.US_ASCII));
            }
            if (itr.hasNext()) {
                sb.append("&");
            }
        }
        return hmacSHA512(vnPayConfig.getHashSecret(), sb.toString());
    }

    public static String hmacSHA512(final String key, final String data) {
        try {
            if (key == null || data == null) {
                throw new NullPointerException();
            }
            final Mac hmac512 = Mac.getInstance("HmacSHA512");
            byte[] hmacKeyBytes = key.getBytes();
            final SecretKeySpec secretKey = new SecretKeySpec(hmacKeyBytes, "HmacSHA512");
            hmac512.init(secretKey);
            byte[] dataBytes = data.getBytes(StandardCharsets.UTF_8);
            byte[] result = hmac512.doFinal(dataBytes);
            StringBuilder sb = new StringBuilder(2 * result.length);
            for (byte b : result) {
                sb.append(String.format("%02x", b & 0xff));
            }
            return sb.toString();
        } catch (Exception ex) {
            return "";
        }
    }

    private String getClientIp(HttpServletRequest request) {
        String ipAddress = request.getHeader("X-FORWARDED-FOR");
        if (ipAddress == null) {
            ipAddress = request.getRemoteAddr();
        }
        return (ipAddress != null && !ipAddress.isBlank()) ? ipAddress.split(",")[0] : "127.0.0.1";
    }
}
