package com.ams.config;

import lombok.Getter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

@Configuration
@Getter
public class SePayConfig {

    @Value("${sepay.env:production}")
    private String env;

    @Value("${sepay.merchant-id:}")
    private String merchantId;

    @Value("${sepay.secret-key:}")
    private String secretKey;

    @Value("${sepay.ipn-secret-key:}")
    private String ipnSecretKey;

    @Value("${sepay.bank-account:VQRQANNCD2590}")
    private String bankAccount;

    @Value("${sepay.bank-name:MBBank}")
    private String bankName;

    @Value("${sepay.account-name:DOAN KHANH DUONG}")
    private String accountName;

    @Value("${sepay.success-url:http://localhost:3000/payment/sepay-return}")
    private String successUrl;

    @Value("${sepay.error-url:http://localhost:3000/payment/sepay-return?result=error}")
    private String errorUrl;

    @Value("${sepay.cancel-url:http://localhost:3000/payment/sepay-return?result=cancel}")
    private String cancelUrl;

    @Value("${sepay.ipn-url:http://localhost:8080/api/payment/sepay-ipn}")
    private String ipnUrl;

    /**
     * Optional. Empty = omit so SePay uses merchant-enabled method(s).
     * Hardcoding BANK_TRANSFER fails when that method is not enabled.
     */
    @Value("${sepay.payment-method:}")
    private String paymentMethod;

    /** Hosted checkout form target (production: https://pay.sepay.vn/v1/checkout/init). */
    public String checkoutUrl() {
        return "production".equals(env)
                ? "https://pay.sepay.vn/v1/checkout/init"
                : "https://pay-sandbox.sepay.vn/v1/checkout/init";
    }

    public String buildQrUrl(java.math.BigDecimal amount, String txnRef) {
        long amt = amount != null ? amount.longValue() : 0L;
        String acc = bankAccount != null ? bankAccount.trim() : "VQRQANNCD2590";
        String bank = bankName != null ? bankName.trim() : "MBBank";
        return "https://qr.sepay.vn/img?acc=" + acc
                + "&bank=" + bank
                + "&amount=" + amt
                + "&des=" + (txnRef != null ? txnRef.trim() : "");
    }
}
