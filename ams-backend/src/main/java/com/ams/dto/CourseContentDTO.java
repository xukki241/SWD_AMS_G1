package com.ams.dto;

import com.ams.entity.Lesson;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;

import java.util.List;

public class CourseContentDTO {

    public record LessonResponse(
            Long id,
            Long moduleId,
            String title,
            Lesson.Type type,
            Integer duration,
            Lesson.Status status,
            int orderIndex
    ) {
    }

    public record ModuleResponse(
            Long id,
            Long courseId,
            String title,
            int orderIndex,
            List<LessonResponse> lessons
    ) {
    }

    public record ContentResponse(
            Long courseId,
            String courseTitle,
            List<ModuleResponse> modules,
            int moduleCount,
            int lessonCount,
            int totalDurationMinutes
    ) {
    }

    public record ModuleRequest(
            @NotBlank(message = "Module title is required")
            @Size(max = 255, message = "Module title must be 255 characters or fewer")
            String title
    ) {
    }

    public record LessonRequest(
            @NotBlank(message = "Lesson title is required")
            @Size(max = 255, message = "Lesson title must be 255 characters or fewer")
            String title,

            @NotNull(message = "Lesson type is required")
            Lesson.Type type,

            @NotNull(message = "Duration is required")
            @Min(value = 0, message = "Duration must be 0 or greater")
            @Max(value = 6000, message = "Duration is too large")
            Integer duration,

            Lesson.Status status
    ) {
    }

    public record ModuleOrder(
            @NotNull(message = "Module id is required")
            Long id,

            @NotNull(message = "Lesson ids are required")
            @Valid
            List<Long> lessonIds
    ) {
    }

    public record ReorderRequest(
            @NotNull(message = "Modules are required")
            @Size(min = 1, message = "At least one module is required")
            @Valid
            List<ModuleOrder> modules
    ) {
    }
}
