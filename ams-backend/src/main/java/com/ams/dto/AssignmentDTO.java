package com.ams.dto;

import com.ams.entity.Assignment;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class AssignmentDTO {

    public record AssignmentTemplateResponse(
            Long id,
            Long subjectId,
            String subjectName,
            Long createdById,
            String createdByName,
            String title,
            String instructions,
            String defaultDueRule
    ) {}

    public record CreateTemplateRequest(
            @NotNull Long subjectId,
            @NotBlank String title,
            String instructions,
            String defaultDueRule
    ) {}

    public record AssignmentResponse(
            Long id,
            Long courseId,
            String courseCode,
            String courseTitle,
            Long teacherId,
            String teacherName,
            Long templateId,
            String title,
            String instructions,
            String rubric,
            String topic,
            LocalDateTime dueAt,
            BigDecimal maxScore,
            Assignment.Status status,
            String attachmentUrl,
            String attachmentMetadata
    ) {}

    public record CreateAssignmentRequest(
            Long templateId,
            @NotBlank String title,
            String instructions,
            String rubric,
            String topic,
            @NotNull LocalDateTime dueAt,
            BigDecimal maxScore,
            Assignment.Status status
    ) {}

    public record UpdateAssignmentRequest(
            String title,
            String instructions,
            String rubric,
            String topic,
            LocalDateTime dueAt,
            BigDecimal maxScore,
            Assignment.Status status
    ) {}

    /** Student's view of one course assignment with their own work state. */
    public record AssignmentOverviewItem(
            Long courseId,
            String courseCode,
            String courseTitle,
            Long enrollmentId,
            Long assignmentId,
            String title,
            String instructions,
            String topic,
            LocalDateTime dueAt,
            BigDecimal maxScore,
            String workState, // NOT_STARTED, DRAFT, SUBMITTED, LATE, GRADED
            Long submissionId,
            BigDecimal score
    ) {}
}
