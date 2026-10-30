package com.ams.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class AssignmentDTO {

    public record AssignmentTemplateResponse(
            Long id,
            Long subjectId,
            String subjectName,
            Long expertId,
            String expertName,
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
            Long teacherId,
            String teacherName,
            Long templateId,
            String title,
            String instructions,
            LocalDateTime dueAt,
            BigDecimal maxScore
    ) {}

    public record CreateAssignmentRequest(
            Long templateId,
            @NotBlank String title,
            String instructions,
            @NotNull LocalDateTime dueAt,
            BigDecimal maxScore,
            Long subjectClassId
    ) {}

    public record AllocateClassRequest(
            @NotNull Long assignmentId,
            @NotNull Long subjectClassId,
            String classNote
    ) {}

    /** Student's view of one class assignment with their own work state. */
    public record AssignmentOverviewItem(
            Long classId,
            String classCode,
            String className,
            Long assignmentId,
            String title,
            String instructions,
            LocalDateTime dueAt,
            BigDecimal maxScore,
            String workState, // NOT_STARTED, DRAFT, SUBMITTED, LATE, GRADED
            Long submissionId,
            BigDecimal score
    ) {}
}
