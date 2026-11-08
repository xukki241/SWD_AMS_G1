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
@Tag(name = "Payments", description = "Course tuition payment APIs (VNPay / SePay / PayOS / VietQR)")
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping("/course/create/{enrollmentId}")
    @PreAuthorize("hasRole('STUDENT')")
    @Operation(summary = "Generate VNPay payment URL for a course enrollment")
    public ResponseEntity<PaymentDTO.PaymentUrlResponse> createPaymentUrl(
            @PathVariable Long enrollmentId,
            HttpServletRequest request
    ) {
        return ResponseEntity.ok(paymentService.createPaymentUrl(enrollmentId, request));
    }

    @PostMapping("/course/confirm-vietqr/{enrollmentId}")
    @PreAuthorize("hasRole('STUDENT')")
    @Operation(summary = "Confirm manual VietQR bank transfer payment")
    public ResponseEntity<Map<String, Object>> confirmVietQrPayment(@PathVariable Long enrollmentId) {
        paymentService.confirmVietQrPayment(enrollmentId);
        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "VietQR transfer confirmed successfully! Course enrollment is now ACTIVE."
        ));
    }

    @PostMapping("/course/create-sepay/{enrollmentId}")
    @PreAuthorize("hasRole('STUDENT')")
    @Operation(summary = "Generate SePay hosted-checkout form fields for a course enrollment")
    public ResponseEntity<PaymentDTO.SePayCheckoutResponse> createSePayCheckout(
            @PathVariable Long enrollmentId
    ) {
        return ResponseEntity.ok(paymentService.createSePayCheckout(enrollmentId));
    }

    @PostMapping("/course/create-payos/{enrollmentId}")
    @PreAuthorize("hasRole('STUDENT')")
    @Operation(summary = "Create a PayOS payment link for a course enrollment")
    public ResponseEntity<PaymentDTO.PayOSCheckoutResponse> createPayOSCheckout(
            @PathVariable Long enrollmentId
    ) {
        return ResponseEntity.ok(paymentService.createPayOSCheckout(enrollmentId));
    }

    @PostMapping("/payos-webhook")
    @Operation(summary = "PayOS webhook (verified PAID → SUCCESS + activate)")
    public ResponseEntity<Map<String, Object>> payosWebhook(@RequestBody Map<String, Object> body) {
        return paymentService.processPayOSWebhook(body);
    }

    @GetMapping("/payos-return")
    @Operation(summary = "PayOS browser return (re-checks order status with PayOS)")
    public ResponseEntity<Map<String, Object>> payosReturn(@RequestParam Map<String, String> params) {
        return ResponseEntity.ok(paymentService.processPayOSReturn(params));
    }

    @PostMapping("/sepay-ipn")
    @Operation(summary = "SePay server-to-server IPN webhook (ORDER_PAID → SUCCESS + activate)")
    public ResponseEntity<Map<String, Object>> sepayIpn(
            @RequestHeader(value = "X-Secret-Key", required = false) String secretKey,
            @RequestBody Map<String, Object> body
    ) {
        return paymentService.processSePayIpn(secretKey, body);
    }

    @GetMapping("/sepay-return")
    @Operation(summary = "SePay browser return (secondary/idempotent activate; IPN is primary)")
    public ResponseEntity<Map<String, Object>> sepayReturn(@RequestParam Map<String, String> params) {
        return ResponseEntity.ok(paymentService.processSePayReturn(params));
    }

    @GetMapping("/my")
    @PreAuthorize("hasRole('STUDENT')")
    @Operation(summary = "Payment history for the current student")
    public ResponseEntity<List<PaymentDTO.PaymentTransactionResponse>> getMyPayments() {
        return ResponseEntity.ok(paymentService.getMyPayments());
    }

    @GetMapping("/teacher")
    @PreAuthorize("hasRole('TEACHER')")
    @Operation(summary = "Tuition received / refunded on courses taught by the current teacher")
    public ResponseEntity<List<PaymentDTO.TeacherPaymentResponse>> getTeacherPayments() {
        return ResponseEntity.ok(paymentService.getTeacherPayments());
    }

    @GetMapping("/vnpay-return")
    @Operation(summary = "Handle VNPay return callback (validate secure hash)")
    public ResponseEntity<Map<String, Object>> vnpayReturn(@RequestParam Map<String, String> allParams) {
        boolean success = paymentService.processReturn(allParams);
        return ResponseEntity.ok(Map.of(
                "success", success,
                "message", success ? "Payment completed successfully! Course enrollment is now ACTIVE." : "Payment failed or cancelled."
        ));
    }

    @GetMapping("/vnpay-ipn")
    @Operation(summary = "Handle VNPay server-to-server IPN webhook")
    public ResponseEntity<PaymentDTO.VnPayIpnResponse> vnpayIpn(@RequestParam Map<String, String> allParams) {
        return ResponseEntity.ok(paymentService.processIpn(allParams));
    }
}
