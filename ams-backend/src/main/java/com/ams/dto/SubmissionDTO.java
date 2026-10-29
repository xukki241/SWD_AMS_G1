package com.ams.dto;

import com.ams.entity.Submission;

import java.time.LocalDateTime;

public class SubmissionDTO {

    public record SubmissionResponse(
            Long id,
            Long classRegistrationId,
            Long studentId,
            String studentName,
            Long assignmentId,
            String assignmentTitle,
            LocalDateTime submittedAt,
            String secureFileReference,
            String fileMetadata,
            Submission.SubmissionStatus submissionStatus,
            EvaluationDTO.EvaluationResponse evaluation
    ) {}
}
