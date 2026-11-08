package com.ams.dto;

import com.ams.entity.CourseEnrollment;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class EnrollmentDTO {

    public record EnrollmentResponse(
            Long id,
            Long courseId,
            String courseTitle,
            String courseCode,
            String courseThumbnailUrl,
            Long studentId,
            String studentName,
            String registrationReference,
            CourseEnrollment.EnrollmentStatus status,
            BigDecimal amount,
            LocalDateTime registeredAt,
            LocalDateTime activatedAt
    ) {}

    /** Enroll request: path carries courseId; body is intentionally empty. */
    public record EnrollRequest(
            @NotNull Long courseId
    ) {}
}
