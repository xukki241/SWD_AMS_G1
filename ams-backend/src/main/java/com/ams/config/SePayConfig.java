package com.ams.config;

import lombok.Getter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

@Configuration
@Getter
public class SePayConfig {

    @Value("${sepay.env}")
    private String env;

    @Value("${sepay.merchant-id}")
    private String merchantId;

    @Value("${sepay.secret-key}")
    private String secretKey;

    @Value("${sepay.success-url}")
    private String successUrl;

    @Value("${sepay.error-url}")
    private String errorUrl;

    @Value("${sepay.cancel-url}")
    private String cancelUrl;

    @Value("${sepay.ipn-url}")
    private String ipnUrl;

    /** Hosted checkout form target (production: https://pay.sepay.vn/v1/checkout/init). */
    public String checkoutUrl() {
        return "production".equals(env)
                ? "https://pay.sepay.vn/v1/checkout/init"
                : "https://pay-sandbox.sepay.vn/v1/checkout/init";
    }
}
