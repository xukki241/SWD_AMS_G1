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

    /** SePay hosted-checkout form: the browser POSTs formFields to checkoutUrl. */
    public record SePayCheckoutResponse(
            String checkoutUrl,
            Map<String, String> formFields,
            String transactionRef,
            BigDecimal amount
    ) {}

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

    public record VnPayIpnResponse(
            String RspCode,
            String Message
    ) {}
}
