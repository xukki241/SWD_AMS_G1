package com.ams.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "subject_classes")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SubjectClass {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subject_id", nullable = false)
    private Subject subject;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "expert_id")
    private User expert;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "teacher_id")
    private User teacher;

    @Column(name = "class_code", nullable = false, unique = true, length = 20)
    private String classCode;

    @Column(name = "class_name", nullable = false, length = 255)
    private String className;

    @Column(nullable = false, length = 20)
    private String term;

    @Column(name = "join_code", length = 6)
    private String joinCode;

    @Column(nullable = false)
    @Builder.Default
    private Integer capacity = 0;

    @Column(name = "registration_fee", nullable = false, precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal registrationFee = BigDecimal.ZERO;
}
