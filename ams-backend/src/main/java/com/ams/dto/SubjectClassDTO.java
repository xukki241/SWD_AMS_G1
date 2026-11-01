package com.ams.dto;

import com.ams.entity.ClassRegistration;
import jakarta.validation.constraints.NotBlank;

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
            String room,
            String joinCode,
            Integer capacity,
            BigDecimal registrationFee,
            Integer enrolledCount
    ) {}

    /** Google Classroom-shaped create payload. Server sets teacher, codes, fee, capacity. */
    public record CreateSubjectClassRequest(
            @NotBlank String className,
            String section,
            @NotBlank String subjectName,
            String room
    ) {}

    public record MyClassResponse(
            Long classId,
            String classCode,
            String className,
            String joinCode,
            String term,
            String room,
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
