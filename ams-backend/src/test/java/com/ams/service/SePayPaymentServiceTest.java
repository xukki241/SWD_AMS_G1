package com.ams.service;

import com.ams.config.PayOSConfig;
import com.ams.config.SePayConfig;
import com.ams.config.VnPayConfig;
import com.ams.entity.CourseEnrollment;
import com.ams.entity.PaymentTransaction;
import com.ams.repository.CourseEnrollmentRepository;
import com.ams.repository.PaymentTransactionRepository;
import com.ams.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SePayPaymentServiceTest {

    @Mock private VnPayConfig vnPayConfig;
    @Mock private SePayConfig sePayConfig;
    @Mock private PayOSConfig payOSConfig;
    @Mock private CourseEnrollmentRepository enrollmentRepository;
    @Mock private PaymentTransactionRepository paymentRepository;
    @Mock private UserRepository userRepository;
    @Mock private CourseEnrollmentService enrollmentService;
    @Mock private AuditLogService auditLogService;
    @Mock private ObjectMapper objectMapper;

    @InjectMocks private PaymentService paymentService;

    @Test
    void ipnRequiresItsOwnConfiguredSecretKey() {
        when(sePayConfig.getIpnSecretKey()).thenReturn("ipn-secret");

        var response = paymentService.processSePayIpn("merchant-secret", Map.of());

        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
        verifyNoInteractions(paymentRepository, enrollmentService);
    }

    @Test
    void bankTransferWebhookActivatesMatchingEnrollment() {
        when(sePayConfig.getIpnSecretKey()).thenReturn("secret");
        CourseEnrollment enrollment = CourseEnrollment.builder().id(99L).build();
        PaymentTransaction transaction = PaymentTransaction.builder()
                .courseEnrollment(enrollment)
                .provider("SEPAY")
                .providerReference("AMS99T123")
                .transactionStatus(PaymentTransaction.TransactionStatus.PENDING)
                .build();
        when(paymentRepository.findByProviderAndTransactionStatus("SEPAY", PaymentTransaction.TransactionStatus.PENDING))
                .thenReturn(java.util.List.of(transaction));

        var response = paymentService.processSePayIpn("secret", Map.of(
                "transferType", "in",
                "content", "Chuyen tien AMS99T123 thanh toan hoc phi"
        ));

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(PaymentTransaction.TransactionStatus.SUCCESS, transaction.getTransactionStatus());
        verify(enrollmentService).activateEnrollment(99L);
        verify(paymentRepository).save(transaction);
    }

    @Test
    void browserReturnCannotConfirmPendingPayment() {
        CourseEnrollment enrollment = new CourseEnrollment();
        PaymentTransaction transaction = PaymentTransaction.builder()
                .courseEnrollment(enrollment)
                .provider("SEPAY")
                .providerReference("SEPAY-123")
                .transactionStatus(PaymentTransaction.TransactionStatus.PENDING)
                .build();
        when(paymentRepository.findByProviderAndProviderReference("SEPAY", "SEPAY-123"))
                .thenReturn(Optional.of(transaction));

        Map<String, Object> response = paymentService.processSePayReturn(
                Map.of("ref", "SEPAY-123", "result", "success"));

        assertFalse((Boolean) response.get("success"));
        assertEquals(PaymentTransaction.TransactionStatus.PENDING, transaction.getTransactionStatus());
        verify(paymentRepository, never()).save(any());
        verifyNoInteractions(enrollmentService);
    }
}
