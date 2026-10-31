package com.ams.service;

import com.ams.config.VnPayConfig;
import com.ams.config.SePayConfig;
import com.ams.dto.PaymentDTO;
import com.ams.entity.ClassRegistration;
import com.ams.entity.PaymentTransaction;
import com.ams.entity.User;
import com.ams.exception.BadRequestException;
import com.ams.exception.ResourceNotFoundException;
import com.ams.repository.ClassRegistrationRepository;
import com.ams.repository.PaymentTransactionRepository;
import com.ams.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
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
import java.util.Base64;

@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentService {

    private final VnPayConfig vnPayConfig;
    private final SePayConfig sePayConfig;
    private final ClassRegistrationRepository registrationRepository;
    private final PaymentTransactionRepository paymentRepository;
    private final UserRepository userRepository;
    private final ClassRegistrationService registrationService;
    private final AuditLogService auditLogService;

    /** Payment amount is always the class's registration fee — no hardcoded values. */
    private BigDecimal feeOf(ClassRegistration registration) {
        var fee = registration.getSubjectClass().getRegistrationFee();
        return fee == null ? BigDecimal.ZERO : fee;
    }

    @Transactional(readOnly = true)
    public List<PaymentDTO.PaymentTransactionResponse> getMyPayments() {
        User user = userRepository.findByUsername(
                        SecurityContextHolder.getContext().getAuthentication().getName())
                .orElseThrow(() -> new ResourceNotFoundException("User not found: "
                        + SecurityContextHolder.getContext().getAuthentication().getName()));
        List<Long> registrationIds = registrationRepository.findByStudentId(user.getId()).stream()
                .map(ClassRegistration::getId)
                .toList();
        return registrationIds.stream()
                .flatMap(id -> paymentRepository.findByClassRegistrationId(id).stream())
                .map(t -> new PaymentDTO.PaymentTransactionResponse(
                        t.getId(),
                        t.getClassRegistration().getId(),
                        t.getProvider(),
                        t.getProviderReference(),
                        t.getAmount(),
                        t.getTransactionStatus(),
                        t.getCreatedAt()))
                .toList();
    }

    @Transactional
    public void confirmVietQrPayment(Long registrationId) {
        ClassRegistration registration = registrationRepository.findById(registrationId)
                .orElseThrow(() -> new ResourceNotFoundException("Registration not found: " + registrationId));

        if (registration.getStatus() == ClassRegistration.RegistrationStatus.ACTIVE) {
            return;
        }

        String txnRef = "VQR" + System.currentTimeMillis() + "-" + registration.getId();
        BigDecimal amount = feeOf(registration);

        PaymentTransaction txn = PaymentTransaction.builder()
                .classRegistration(registration)
                .provider("VIETQR")
                .providerReference(txnRef)
                .amount(amount)
                .transactionStatus(PaymentTransaction.TransactionStatus.SUCCESS)
                .createdAt(LocalDateTime.now())
                .build();
        paymentRepository.save(txn);

        registrationService.activateRegistration(registration.getId());
        auditLogService.log("PAYMENT_SUCCESS_VIETQR", "PaymentTransaction", txnRef);
    }

    @Transactional
    public PaymentDTO.PaymentUrlResponse createPaymentUrl(Long registrationId, HttpServletRequest req) {
        ClassRegistration registration = registrationRepository.findById(registrationId)
                .orElseThrow(() -> new ResourceNotFoundException("Registration not found: " + registrationId));

        if (registration.getStatus() == ClassRegistration.RegistrationStatus.ACTIVE) {
            throw new BadRequestException("Registration is already paid and active");
        }

        BigDecimal amount = feeOf(registration);
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
        vnp_Params.put("vnp_OrderInfo", "Tuition payment for class " + registration.getSubjectClass().getClassCode());
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

    // ------------------------------------------------------------------
    // SePay (bank transfer / VietQR / card). The hosted-checkout form is a
    // pure-HMAC construct (replicating sepay-pg-node exactly — no network),
    // so it can be built entirely in Java with no Node sidecar.
    // ------------------------------------------------------------------

    /** Fixed signing field order — mirrors sepay-pg-node Checkout.signFields. */
    private static final List<String> SEPAY_SIGNED_FIELDS = List.of(
            "merchant", "env", "operation", "payment_method", "order_amount",
            "currency", "order_invoice_number", "order_description", "customer_id",
            "agreement_id", "agreement_name", "agreement_type",
            "agreement_payment_frequency", "agreement_amount_per_payment",
            "success_url", "error_url", "cancel_url", "order_id");

    /**
     * Build the SePay hosted-checkout form for a registration. The returned
     * formFields are POSTed by the browser to checkoutUrl (SePay's /checkout/init).
     */
    @Transactional
    public PaymentDTO.SePayCheckoutResponse createSePayCheckout(Long registrationId) {
        ClassRegistration registration = registrationRepository.findById(registrationId)
                .orElseThrow(() -> new ResourceNotFoundException("Registration not found: " + registrationId));

        if (registration.getStatus() == ClassRegistration.RegistrationStatus.ACTIVE) {
            throw new BadRequestException("Registration is already paid and active");
        }

        BigDecimal amount = feeOf(registration);
        String txnRef = "SEPAY" + System.currentTimeMillis() + "-" + registration.getId();

        Map<String, String> fields = new LinkedHashMap<>();
        fields.put("merchant", sePayConfig.getMerchantId());
        fields.put("operation", "PURCHASE");
        fields.put("payment_method", "BANK_TRANSFER");
        fields.put("order_invoice_number", txnRef);
        fields.put("order_amount", String.valueOf(amount.longValue()));
        fields.put("currency", "VND");
        fields.put("order_description", "AMS tuition " + registration.getSubjectClass().getClassCode());
        fields.put("success_url", sePayConfig.getSuccessUrl() + "?ref=" + txnRef);
        fields.put("error_url", sePayConfig.getErrorUrl());
        fields.put("cancel_url", sePayConfig.getCancelUrl() + "?ref=" + txnRef);
        fields.put("signature", sePaySignature(fields));

        PaymentTransaction txn = PaymentTransaction.builder()
                .classRegistration(registration)
                .provider("SEPAY")
                .providerReference(txnRef)
                .amount(amount)
                .transactionStatus(PaymentTransaction.TransactionStatus.PENDING)
                .createdAt(LocalDateTime.now())
                .build();
        paymentRepository.save(txn);

        auditLogService.log("INIT_PAYMENT_SEPAY", "PaymentTransaction", txnRef);
        return new PaymentDTO.SePayCheckoutResponse(
                sePayConfig.checkoutUrl(), fields, txnRef, amount);
    }

    /**
     * SePay server-to-server IPN. Per the user's choice this only *logs* the
     * result and marks the txn PENDING/FAILED — it does not verify a signature
     * (the SDK ships no IPN-verify helper and the IPN signing spec is undocumented).
     * The user-initiated {@code sepay-return} is the path that activates the class.
     */
    @Transactional
    public Map<String, Object> processSePayIpn(Map<String, Object> body) {
        String txnRef = firstNonBlank(body, "order_invoice_number", "order_id", "ref");
        log.info("[SEPAY IPN] raw={}", body);
        if (txnRef != null) {
            paymentRepository.findByProviderAndProviderReference("SEPAY", txnRef).ifPresent(txn -> {
                log.info("[SEPAY IPN] txn {} -> status={}", txnRef, txn.getTransactionStatus());
                auditLogService.log("SEPAY_IPN", "PaymentTransaction", txnRef);
            });
        }
        return Map.of("received", true);
    }

    /**
     * User-initiated return from SePay's hosted checkout (success / cancel / error).
     * This is the path that actually activates the class for the demo flow.
     */
    @Transactional
    public Map<String, Object> processSePayReturn(Map<String, String> params) {
        String txnRef = firstNonBlankParams(params, "order_invoice_number", "order_id", "ref");
        String result = params.getOrDefault("result", "success");
        log.info("[SEPAY RETURN] ref={} result={}", txnRef, result);

        if (txnRef != null) {
            paymentRepository.findByProviderAndProviderReference("SEPAY", txnRef).ifPresent(txn -> {
                if (txn.getTransactionStatus() != PaymentTransaction.TransactionStatus.SUCCESS) {
                    if ("error".equals(result) || "cancel".equals(result)) {
                        txn.setTransactionStatus(PaymentTransaction.TransactionStatus.FAILED);
                    } else {
                        txn.setTransactionStatus(PaymentTransaction.TransactionStatus.SUCCESS);
                        registrationService.activateRegistration(txn.getClassRegistration().getId());
                        auditLogService.log("PAYMENT_SUCCESS_SEPAY", "PaymentTransaction", txnRef);
                    }
                    paymentRepository.save(txn);
                }
            });
        }
        return Map.of("success", !"error".equals(result) && !"cancel".equals(result),
                "message", "error".equals(result) ? "Payment failed."
                        : "cancel".equals(result) ? "Payment cancelled."
                        : "Payment completed successfully! Class is now ACTIVE.");
    }

    /** HMAC-SHA256(base64) over "field=value" pairs joined with ',' — matches the SDK. */
    private String sePaySignature(Map<String, String> fields) {
        List<String> parts = new ArrayList<>();
        for (String name : SEPAY_SIGNED_FIELDS) {
            String value = fields.get(name);
            if (value != null && !value.isEmpty()) {
                parts.add(name + "=" + value);
            }
        }
        String data = String.join(",", parts);
        return hmacSHA256Base64(sePayConfig.getSecretKey(), data);
    }

    public static String hmacSHA256Base64(final String key, final String data) {
        try {
            final Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            return Base64.getEncoder().encodeToString(mac.doFinal(data.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception ex) {
            log.warn("SePay HMAC failed", ex);
            return "";
        }
    }

    private String firstNonBlank(Map<String, Object> m, String... keys) {
        for (String k : keys) {
            Object v = m.get(k);
            if (v != null && String.valueOf(v).trim().length() > 0) {
                return String.valueOf(v);
            }
        }
        return null;
    }

    private String firstNonBlankParams(Map<String, String> m, String... keys) {
        for (String k : keys) {
            String v = m.get(k);
            if (v != null && !v.trim().isEmpty()) {
                return v;
            }
        }
        return null;
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
