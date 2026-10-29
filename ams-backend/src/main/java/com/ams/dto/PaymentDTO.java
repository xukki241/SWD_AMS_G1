package com.ams.dto;

import com.ams.entity.PaymentTransaction;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class PaymentDTO {

    public record PaymentUrlResponse(
            String paymentUrl,
            String transactionRef,
            BigDecimal amount
    ) {}

    public record PaymentTransactionResponse(
            Long id,
            Long classRegistrationId,
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
