package com.ams.dto;

import com.ams.entity.Subject;
import jakarta.validation.constraints.NotBlank;

public class SubjectDTO {

    public record SubjectResponse(
            Long id,
            String subjectCode,
            String subjectName,
            String description,
            Subject.SubjectStatus status
    ) {}

    public record CreateSubjectRequest(
            @NotBlank String subjectCode,
            @NotBlank String subjectName,
            String description,
            Subject.SubjectStatus status
    ) {}
}
