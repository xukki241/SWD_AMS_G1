package com.ams.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "assignment_evaluations")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AssignmentEvaluation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "submission_id", nullable = false, unique = true)
    private Submission submission;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "evaluator_id")
    private User evaluator;

    @Column(name = "ai_draft_score", precision = 5, scale = 2)
    private BigDecimal aiDraftScore;

    @Column(name = "ai_draft_feedback", columnDefinition = "TEXT")
    private String aiDraftFeedback;

    @Column(name = "is_published", nullable = false)
    @Builder.Default
    private boolean published = false;

    @Column(name = "viewed_at")
    private java.time.LocalDateTime viewedAt;

    @Column(precision = 5, scale = 2)
    private BigDecimal score;

    @Column(columnDefinition = "TEXT")
    private String feedback;

    @Enumerated(EnumType.STRING)
    @Column(name = "evaluation_status", nullable = false, length = 20)
    @Builder.Default
    private EvaluationStatus evaluationStatus = EvaluationStatus.PENDING;

    public enum EvaluationStatus {
        PENDING, COMPLETED, APPEALED
    }
}
