package com.ams.dto;

import com.ams.entity.PaymentTransaction;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Map;

public class PaymentDTO {

    public record PaymentUrlResponse(
            String paymentUrl,
            String transactionRef,
            BigDecimal amount
    ) {}

    /** SePay checkout: supports both direct VietQR transfer and hosted-checkout. */
    public record SePayCheckoutResponse(
            String checkoutUrl,
            Map<String, String> formFields,
            String transactionRef,
            BigDecimal amount,
            String qrUrl,
            String bankName,
            String accountNumber,
            String accountName
    ) {
        public SePayCheckoutResponse(String checkoutUrl, Map<String, String> formFields, String transactionRef, BigDecimal amount) {
            this(checkoutUrl, formFields, transactionRef, amount, null, null, null, null);
        }
    }

    /** PayOS payment link: the browser is redirected to {@code checkoutUrl}. */
    public record PayOSCheckoutResponse(
            String checkoutUrl,
            String qrCode,
            String paymentLinkId,
            String transactionRef,
            BigDecimal amount
    ) {}

    public record PaymentTransactionResponse(
            Long id,
            Long courseEnrollmentId,
            String provider,
            String providerReference,
            BigDecimal amount,
            PaymentTransaction.TransactionStatus transactionStatus,
            LocalDateTime createdAt
    ) {}

    /** Teacher view: tuition received on their courses (and refunds as outgoing). */
    public record TeacherPaymentResponse(
            Long id,
            Long courseEnrollmentId,
            String courseCode,
            String courseTitle,
            String studentName,
            String studentUsername,
            String provider,
            String providerReference,
            BigDecimal amount,
            PaymentTransaction.TransactionStatus transactionStatus,
            /** RECEIVED = student paid teacher course; OUTGOING = refunded */
            String direction,
            LocalDateTime createdAt
    ) {}

    public record VnPayIpnResponse(
            String RspCode,
            String Message
    ) {}
}
