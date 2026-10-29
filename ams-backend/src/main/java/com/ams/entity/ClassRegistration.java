package com.ams.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "class_registrations", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"student_id", "subject_class_id"})
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClassRegistration {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private User student;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subject_class_id", nullable = false)
    private SubjectClass subjectClass;

    @Column(name = "registered_at", nullable = false)
    @Builder.Default
    private LocalDateTime registeredAt = LocalDateTime.now();

    @Column(name = "registration_reference", nullable = false, unique = true, length = 100)
    private String registrationReference;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    @Builder.Default
    private RegistrationStatus status = RegistrationStatus.PENDING_PAYMENT;

    @Column(name = "activated_at")
    private LocalDateTime activatedAt;

    public enum RegistrationStatus {
        PENDING_PAYMENT, ACTIVE, CANCELLED
    }
}
