package com.ams.dto;

import com.ams.entity.Course;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public class CourseDTO {

    public record CourseSummaryResponse(
            Long id,
            String title,
            String code,
            Long categoryId,
            String categoryName,
            String thumbnailUrl,
            BigDecimal price,
            boolean isFree,
            Course.Status status,
            Course.DifficultyLevel difficultyLevel,
            Long instructorId,
            String instructorName,
            LocalDateTime createdAt,
            LocalDateTime updatedAt
    ) {
    }

    public record CourseMetricsResponse(
            int moduleCount,
            int lessonCount,
            int totalDurationMinutes
    ) {
    }

    public record CurriculumModuleResponse(
            Long id,
            String title,
            int orderIndex,
            int lessonCount
    ) {
    }

    public record CourseDetailResponse(
            Long id,
            String title,
            String code,
            Long categoryId,
            String categoryName,
            String description,
            String thumbnailUrl,
            BigDecimal price,
            boolean isFree,
            Course.Status status,
            Course.DifficultyLevel difficultyLevel,
            String about,
            String whatStudentsWillLearn,
            String prerequisites,
            Long instructorId,
            String instructorName,
            LocalDateTime createdAt,
            LocalDateTime updatedAt,
            CourseMetricsResponse metrics,
            List<CurriculumModuleResponse> curriculum
    ) {
    }

    public record CourseRequest(
            @NotBlank(message = "Course title is required")
            @Size(max = 255, message = "Course title must be 255 characters or fewer")
            String title,

            @NotBlank(message = "Course code is required")
            @Size(max = 50, message = "Course code must be 50 characters or fewer")
            @Pattern(regexp = "^[A-Za-z0-9_-]+$", message = "Course code may contain only letters, numbers, hyphens and underscores")
            String code,

            @NotNull(message = "Category is required")
            Long categoryId,

            @NotBlank(message = "Description is required")
            String description,

            @Size(max = 1000, message = "Thumbnail URL is too long")
            String thumbnailUrl,

            @NotNull(message = "Price is required")
            @DecimalMin(value = "0.00", message = "Price must be greater than or equal to 0")
            @Digits(integer = 13, fraction = 2, message = "Price supports up to 2 decimal places")
            BigDecimal price,

            Boolean isFree,
            Course.Status status,
            Course.DifficultyLevel difficultyLevel,
            String about,
            String whatStudentsWillLearn,
            String prerequisites
    ) {
    }
}
