package com.ams.dto;

import com.ams.entity.ClassRegistration;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

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
            String term,
            String joinCode,
            Integer capacity,
            BigDecimal registrationFee,
            Integer enrolledCount
    ) {}

    public record CreateSubjectClassRequest(
            @NotNull Long subjectId,
            Long expertId,
            Long teacherId,
            @NotBlank String classCode,
            @NotBlank String className,
            @NotBlank String term,
            @NotNull @Min(0) Integer capacity,
            @NotNull @Min(0) BigDecimal registrationFee,
            String joinCode
    ) {}

    public record MyClassResponse(
            Long classId,
            String classCode,
            String className,
            String joinCode,
            String term,
            String subjectCode,
            String subjectName,
            Long teacherId,
            String teacherName,
            Long expertId,
            String expertName,
            BigDecimal registrationFee,
            Integer capacity,
            Integer enrolledCount,
            Integer assignmentCount,
            Integer ungradedCount,
            ClassRegistration.RegistrationStatus myRegistrationStatus
    ) {}
}
