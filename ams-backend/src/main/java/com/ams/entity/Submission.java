package com.ams.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "submissions", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"course_enrollment_id", "assignment_id"})
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Submission {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_enrollment_id", nullable = false)
    private CourseEnrollment courseEnrollment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assignment_id", nullable = false)
    private Assignment assignment;

    @Column(name = "submitted_at", nullable = false)
    @Builder.Default
    private LocalDateTime submittedAt = LocalDateTime.now();

    @Column(name = "secure_file_reference", length = 1000)
    private String secureFileReference;

    @Column(name = "file_metadata", columnDefinition = "TEXT")
    private String fileMetadata;

    @Column(name = "answer_text", columnDefinition = "TEXT")
    private String answerText;

    @Column(name = "grading_claim_owner")
    private Long gradingClaimOwner;

    @Column(name = "grading_claim_expires_at")
    private LocalDateTime gradingClaimExpiresAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "submission_status", nullable = false, length = 20)
    @Builder.Default
    private SubmissionStatus submissionStatus = SubmissionStatus.DRAFT;

    public enum SubmissionStatus {
        DRAFT, SUBMITTED, LATE, GRADED
    }
}
