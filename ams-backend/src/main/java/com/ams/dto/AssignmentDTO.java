package com.ams.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

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
            LocalDateTime dueAt
    ) {}

    public record CreateAssignmentRequest(
            Long templateId,
            @NotBlank String title,
            String instructions,
            @NotNull LocalDateTime dueAt,
            Long subjectClassId
    ) {}

    public record AllocateClassRequest(
            @NotNull Long assignmentId,
            @NotNull Long subjectClassId,
            String classNote
    ) {}
}
