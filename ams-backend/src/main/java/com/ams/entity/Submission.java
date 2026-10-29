package com.ams.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "submissions", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"class_registration_id", "assignment_id"})
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
    @JoinColumn(name = "class_registration_id", nullable = false)
    private ClassRegistration classRegistration;

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

    @Enumerated(EnumType.STRING)
    @Column(name = "submission_status", nullable = false, length = 20)
    @Builder.Default
    private SubmissionStatus submissionStatus = SubmissionStatus.DRAFT;

    public enum SubmissionStatus {
        DRAFT, SUBMITTED, LATE, GRADED
    }
}
