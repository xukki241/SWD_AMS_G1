package com.ams.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "payment_transactions", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"provider", "provider_reference"})
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "class_registration_id", nullable = false)
    private ClassRegistration classRegistration;

    @Column(nullable = false, length = 20)
    @Builder.Default
    private String provider = "VNPAY";

    @Column(name = "provider_reference", length = 255)
    private String providerReference;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal amount;

    @Enumerated(EnumType.STRING)
    @Column(name = "transaction_status", nullable = false, length = 20)
    @Builder.Default
    private TransactionStatus transactionStatus = TransactionStatus.PENDING;

    @Column(name = "created_at", nullable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    public enum TransactionStatus {
        PENDING, SUCCESS, FAILED, REFUNDED
    }
}
