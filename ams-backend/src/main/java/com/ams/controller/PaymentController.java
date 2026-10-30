package com.ams.controller;

import com.ams.dto.PaymentDTO;
import com.ams.service.PaymentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/payment")
@RequiredArgsConstructor
@Tag(name = "Payments", description = "VNPay & VietQR Payment Integration APIs")
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping("/create/{registrationId}")
    @PreAuthorize("hasRole('STUDENT')")
    @Operation(summary = "Generate VNPay payment URL for a class registration")
    public ResponseEntity<PaymentDTO.PaymentUrlResponse> createPaymentUrl(
            @PathVariable Long registrationId,
            HttpServletRequest request
    ) {
        return ResponseEntity.ok(paymentService.createPaymentUrl(registrationId, request));
    }

    @PostMapping("/confirm-vietqr/{registrationId}")
    @PreAuthorize("hasRole('STUDENT')")
    @Operation(summary = "Confirm manual VietQR bank transfer payment")
    public ResponseEntity<Map<String, Object>> confirmVietQrPayment(@PathVariable Long registrationId) {
        paymentService.confirmVietQrPayment(registrationId);
        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "VietQR transfer confirmed successfully! Class enrollment is now ACTIVE."
        ));
    }

    @GetMapping("/my")
    @PreAuthorize("hasRole('STUDENT')")
    @Operation(summary = "Payment history for the current student (Payment History screen)")
    public ResponseEntity<List<PaymentDTO.PaymentTransactionResponse>> getMyPayments() {
        return ResponseEntity.ok(paymentService.getMyPayments());
    }

    @GetMapping("/vnpay-return")
    @Operation(summary = "Handle VNPay return callback (validate secure hash)")
    public ResponseEntity<Map<String, Object>> vnpayReturn(@RequestParam Map<String, String> allParams) {
        boolean success = paymentService.processReturn(allParams);
        return ResponseEntity.ok(Map.of(
                "success", success,
                "message", success ? "Payment completed successfully! Class is now ACTIVE." : "Payment failed or cancelled."
        ));
    }

    @GetMapping("/vnpay-ipn")
    @Operation(summary = "Handle VNPay server-to-server IPN webhook")
    public ResponseEntity<PaymentDTO.VnPayIpnResponse> vnpayIpn(@RequestParam Map<String, String> allParams) {
        return ResponseEntity.ok(paymentService.processIpn(allParams));
    }
}
