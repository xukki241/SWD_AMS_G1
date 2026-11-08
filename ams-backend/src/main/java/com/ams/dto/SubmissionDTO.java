package com.ams.dto;

import com.ams.entity.Submission;

import java.time.LocalDateTime;

public class SubmissionDTO {

    public record SubmissionResponse(
            Long id,
            Long courseEnrollmentId,
            Long studentId,
            String studentName,
            Long assignmentId,
            String assignmentTitle,
            LocalDateTime submittedAt,
            String secureFileReference,
            String fileMetadata,
            String answerText,
            Submission.SubmissionStatus submissionStatus,
            EvaluationDTO.EvaluationResponse evaluation
    ) {}

    public record GradingClaimResponse(Long submissionId, Long ownerId, java.time.LocalDateTime expiresAt) {}
}
