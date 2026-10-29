package com.ams.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class SubjectClassDTO {

    public record SubjectClassResponse(
            Long id,
            Long subjectId,
            String subjectCode,
            String subjectName,
            Long expertId,
            String expertName,
            Long teacherId,
            String teacherName,
            String classCode,
            String className,
            String term
    ) {}

    public record CreateSubjectClassRequest(
            @NotNull Long subjectId,
            Long expertId,
            Long teacherId,
            @NotBlank String classCode,
            @NotBlank String className,
            @NotBlank String term
    ) {}
}
