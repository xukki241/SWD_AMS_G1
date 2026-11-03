package com.ams.service;

import com.ams.config.VnPayConfig;
import com.ams.config.SePayConfig;
import com.ams.dto.PaymentDTO;
import com.ams.entity.CourseEnrollment;
import com.ams.entity.PaymentTransaction;
import com.ams.entity.User;
import com.ams.exception.BadRequestException;
import com.ams.exception.ResourceNotFoundException;
import com.ams.repository.CourseEnrollmentRepository;
import com.ams.repository.PaymentTransactionRepository;
import com.ams.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
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
    private final CourseEnrollmentRepository enrollmentRepository;
    private final PaymentTransactionRepository paymentRepository;
    private final UserRepository userRepository;
    private final CourseEnrollmentService enrollmentService;
    private final AuditLogService auditLogService;

    @Transactional(readOnly = true)
    public List<PaymentDTO.PaymentTransactionResponse> getMyPayments() {
        User user = userRepository.findByUsername(
                        SecurityContextHolder.getContext().getAuthentication().getName())
                .orElseThrow(() -> new ResourceNotFoundException("User not found: "
                        + SecurityContextHolder.getContext().getAuthentication().getName()));
        List<Long> enrollmentIds = enrollmentRepository.findByStudentId(user.getId()).stream()
                .map(CourseEnrollment::getId)
                .toList();
        return enrollmentIds.stream()
                .flatMap(id -> paymentRepository.findByCourseEnrollmentId(id).stream())
                .map(t -> new PaymentDTO.PaymentTransactionResponse(
                        t.getId(),
                        t.getCourseEnrollment().getId(),
                        t.getProvider(),
                        t.getProviderReference(),
                        t.getAmount(),
                        t.getTransactionStatus(),
                        t.getCreatedAt()))
                .toList();
    }

    @Transactional
    public void confirmVietQrPayment(Long enrollmentId) {
        CourseEnrollment enrollment = enrollmentRepository.findById(enrollmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Enrollment not found: " + enrollmentId));

        if (enrollment.getStatus() == CourseEnrollment.EnrollmentStatus.ACTIVE) {
            return;
        }

        String txnRef = "VQR" + System.currentTimeMillis() + "-" + enrollment.getId();
        BigDecimal amount = enrollment.getAmount();

        PaymentTransaction txn = PaymentTransaction.builder()
                .courseEnrollment(enrollment)
                .provider("VIETQR")
                .providerReference(txnRef)
                .amount(amount)
                .transactionStatus(PaymentTransaction.TransactionStatus.SUCCESS)
                .createdAt(LocalDateTime.now())
                .build();
        paymentRepository.save(txn);

        enrollmentService.activateEnrollment(enrollment.getId());
        auditLogService.log("PAYMENT_SUCCESS_VIETQR", "PaymentTransaction", txnRef);
    }

    @Transactional
    public PaymentDTO.PaymentUrlResponse createPaymentUrl(Long enrollmentId, HttpServletRequest req) {
        CourseEnrollment enrollment = enrollmentRepository.findById(enrollmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Enrollment not found: " + enrollmentId));

        if (enrollment.getStatus() == CourseEnrollment.EnrollmentStatus.ACTIVE) {
            throw new BadRequestException("Enrollment is already paid and active");
        }

        BigDecimal amount = enrollment.getAmount();
        String txnRef = "TXN" + System.currentTimeMillis() + "-" + enrollment.getId();

        PaymentTransaction txn = PaymentTransaction.builder()
                .courseEnrollment(enrollment)
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
        vnp_Params.put("vnp_OrderInfo", "Course tuition for " + enrollment.getCourse().getCode());
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
                    enrollmentService.activateEnrollment(txn.getCourseEnrollment().getId());
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
            enrollmentService.activateEnrollment(txn.getCourseEnrollment().getId());
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

    /**
     * Allow-list used by sepay-pg-node Checkout.signFields.
     * Signature string MUST follow LinkedHashMap insertion order (Object.keys).
     */
    private static final Set<String> SEPAY_SIGN_ALLOW = Set.of(
            "merchant", "env", "operation", "payment_method",
            "order_amount", "currency", "order_invoice_number", "order_description",
            "customer_id", "agreement_id", "agreement_name", "agreement_type",
            "agreement_payment_frequency", "agreement_amount_per_payment",
            "success_url", "error_url", "cancel_url", "order_id");

    /**
     * Build the SePay hosted-checkout form for an enrollment. The returned
     * formFields are POSTed by the browser to checkoutUrl (SePay's /checkout/init).
     */
    @Transactional
    public PaymentDTO.SePayCheckoutResponse createSePayCheckout(Long enrollmentId) {
        CourseEnrollment enrollment = enrollmentRepository.findById(enrollmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Enrollment not found: " + enrollmentId));

        if (enrollment.getStatus() == CourseEnrollment.EnrollmentStatus.ACTIVE) {
            throw new BadRequestException("Enrollment is already paid and active");
        }
        if (sePayConfig.getMerchantId() == null || sePayConfig.getMerchantId().isBlank()
                || sePayConfig.getSecretKey() == null || sePayConfig.getSecretKey().isBlank()) {
            throw new BadRequestException("SePay is not configured (merchant or secret key).");
        }

        BigDecimal amount = enrollment.getAmount();
        String txnRef = "SEPAY" + System.currentTimeMillis() + "-" + enrollment.getId();
        String customerId = enrollment.getStudent() != null
                ? String.valueOf(enrollment.getStudent().getId())
                : "guest";

        // Insertion order = sepay-pg-node Object.keys sign order.
        LinkedHashMap<String, String> fields = new LinkedHashMap<>();
        fields.put("merchant", sePayConfig.getMerchantId());
        fields.put("operation", "PURCHASE");
        String method = sePayConfig.getPaymentMethod();
        if (method != null && !method.isBlank()) {
            fields.put("payment_method", method.trim());
        }
        fields.put("order_invoice_number", txnRef);
        fields.put("order_amount", String.valueOf(amount.longValue()));
        fields.put("currency", "VND");
        String description = "AMS course tuition " + enrollment.getCourse().getCode();
        if (description.length() > 120) {
            description = description.substring(0, 120);
        }
        fields.put("order_description", description);
        fields.put("success_url", appendRef(sePayConfig.getSuccessUrl(), txnRef));
        fields.put("error_url", appendRef(sePayConfig.getErrorUrl(), txnRef));
        fields.put("cancel_url", appendRef(sePayConfig.getCancelUrl(), txnRef));
        fields.put("customer_id", customerId);
        fields.put("signature", sePaySignature(fields));

        PaymentTransaction txn = PaymentTransaction.builder()
                .courseEnrollment(enrollment)
                .provider("SEPAY")
                .providerReference(txnRef)
                .amount(amount)
                .transactionStatus(PaymentTransaction.TransactionStatus.PENDING)
                .createdAt(LocalDateTime.now())
                .build();
        paymentRepository.save(txn);

        auditLogService.log("INIT_PAYMENT_SEPAY", "PaymentTransaction", txnRef);
        log.info("[SEPAY_INIT] txn={} amount={} method={} merchant={}",
                txnRef, amount,
                method == null || method.isBlank() ? "(omit)" : method,
                sePayConfig.getMerchantId());
        return new PaymentDTO.SePayCheckoutResponse(
                sePayConfig.checkoutUrl(), fields, txnRef, amount);
    }

    /**
     * SePay server-to-server IPN (primary activation path).
     * Verifies {@code X-Secret-Key}, handles {@code ORDER_PAID} via nested
     * {@code order.order_invoice_number}, marks txn SUCCESS and activates enrollment
     * (idempotent). Always returns HTTP 200 {@code {"success": true}} on accepted receipt
     * per SePay docs; mismatch → 401.
     */
    @Transactional
    public ResponseEntity<Map<String, Object>> processSePayIpn(String secretKey, Map<String, Object> body) {
        if (secretKey == null || !secretKey.equals(sePayConfig.getSecretKey())) {
            log.warn("[SEPAY_IPN] unauthorized: X-Secret-Key missing or mismatch");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Unauthorized"));
        }

        log.info("[SEPAY_IPN] raw={}", body);

        String notificationType = body.get("notification_type") != null
                ? String.valueOf(body.get("notification_type"))
                : "";

        @SuppressWarnings("unchecked")
        Map<String, Object> order = body.get("order") instanceof Map
                ? (Map<String, Object>) body.get("order")
                : Collections.emptyMap();

        String txnRef = firstNonBlank(order, "order_invoice_number");
        if (txnRef == null) {
            // fallback for atypical payloads
            txnRef = firstNonBlank(body, "order_invoice_number", "order_id", "ref");
        }

        if ("ORDER_PAID".equals(notificationType) && txnRef != null) {
            final String ref = txnRef;
            paymentRepository.findByProviderAndProviderReference("SEPAY", ref).ifPresentOrElse(txn -> {
                if (txn.getTransactionStatus() != PaymentTransaction.TransactionStatus.SUCCESS) {
                    txn.setTransactionStatus(PaymentTransaction.TransactionStatus.SUCCESS);
                    paymentRepository.save(txn);
                    enrollmentService.activateEnrollment(txn.getCourseEnrollment().getId());
                    auditLogService.log("PAYMENT_SUCCESS_SEPAY_IPN", "PaymentTransaction", ref);
                    log.info("[SEPAY_IPN] ORDER_PAID → SUCCESS + activate enrollmentId={} txn={}",
                            txn.getCourseEnrollment().getId(), ref);
                } else {
                    // Already SUCCESS (retry / duplicate IPN) — ensure ACTIVE anyway
                    enrollmentService.activateEnrollment(txn.getCourseEnrollment().getId());
                    log.info("[SEPAY_IPN] ORDER_PAID idempotent skip (already SUCCESS) txn={}", ref);
                }
                auditLogService.log("SEPAY_IPN", "PaymentTransaction", ref);
            }, () -> log.warn("[SEPAY_IPN] ORDER_PAID but no SEPAY txn for order_invoice_number={}", ref));
        } else {
            log.info("[SEPAY_IPN] ignored notification_type={} txnRef={}", notificationType, txnRef);
            if (txnRef != null) {
                auditLogService.log("SEPAY_IPN", "PaymentTransaction", txnRef);
            }
        }

        // SePay requires HTTP 200 to acknowledge successful receipt
        return ResponseEntity.ok(Map.of("success", true));
    }

    /**
     * Browser return from SePay hosted checkout (secondary / DX fallback).
     * Production should rely on IPN; this path still activates idempotently when
     * {@code result} indicates success so local demos work without a public tunnel.
     */
    @Transactional
    public Map<String, Object> processSePayReturn(Map<String, String> params) {
        String txnRef = firstNonBlankParams(params, "order_invoice_number", "order_id", "ref");
        String result = params.getOrDefault("result", "success");
        log.info("[SEPAY_RETURN] ref={} result={} (secondary path; production should rely on IPN)",
                txnRef, result);

        if (txnRef != null) {
            paymentRepository.findByProviderAndProviderReference("SEPAY", txnRef).ifPresent(txn -> {
                if ("error".equals(result) || "cancel".equals(result)) {
                    if (txn.getTransactionStatus() != PaymentTransaction.TransactionStatus.SUCCESS) {
                        txn.setTransactionStatus(PaymentTransaction.TransactionStatus.FAILED);
                        paymentRepository.save(txn);
                        log.info("[SEPAY_RETURN] marked FAILED txn={}", txnRef);
                    }
                    return;
                }

                // success (or default): idempotent activate for local demo / IPN lag
                if (txn.getTransactionStatus() == PaymentTransaction.TransactionStatus.SUCCESS) {
                    enrollmentService.activateEnrollment(txn.getCourseEnrollment().getId());
                    log.info("[SEPAY_RETURN] txn already SUCCESS (likely via IPN); ensured ACTIVE txn={}", txnRef);
                } else {
                    log.warn("[SEPAY_RETURN] activating via return fallback — IPN may be unreachable locally; txn={}",
                            txnRef);
                    txn.setTransactionStatus(PaymentTransaction.TransactionStatus.SUCCESS);
                    paymentRepository.save(txn);
                    enrollmentService.activateEnrollment(txn.getCourseEnrollment().getId());
                    auditLogService.log("PAYMENT_SUCCESS_SEPAY_RETURN", "PaymentTransaction", txnRef);
                }
            });
        }
        return Map.of("success", !"error".equals(result) && !"cancel".equals(result),
                "message", "error".equals(result)
                        ? "Payment failed on SePay (method unavailable, cancelled, or unpaid). Try again or use VietQR."
                        : "cancel".equals(result) ? "Payment cancelled."
                        : "Payment completed successfully! Course enrollment is now ACTIVE.");
    }

    private String appendRef(String url, String ref) {
        if (url == null || url.isEmpty()) return url;
        String separator = url.contains("?") ? "&" : "?";
        return url + separator + "ref=" + ref;
    }

    /** HMAC over allow-listed fields in map insertion order (parity with sepay-pg-node). */
    private String sePaySignature(Map<String, String> fields) {
        List<String> parts = new ArrayList<>();
        for (String name : fields.keySet()) {
            if (!SEPAY_SIGN_ALLOW.contains(name)) {
                continue;
            }
            String value = fields.get(name);
            if (value == null) {
                continue;
            }
            parts.add(name + "=" + value);
        }
        return hmacSHA256Base64(sePayConfig.getSecretKey(), String.join(",", parts));
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
