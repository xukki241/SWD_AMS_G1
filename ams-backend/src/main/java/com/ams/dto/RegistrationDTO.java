package com.ams.dto;

import com.ams.entity.ClassRegistration;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;

public class RegistrationDTO {

    public record RegistrationResponse(
            Long id,
            Long studentId,
            String studentName,
            Long subjectClassId,
            String classCode,
            String className,
            String subjectCode,
            String subjectName,
            String registrationReference,
            ClassRegistration.RegistrationStatus status,
            LocalDateTime registeredAt,
            LocalDateTime activatedAt
    ) {}

    public record CreateRegistrationRequest(
            @NotNull Long subjectClassId
    ) {}
}
