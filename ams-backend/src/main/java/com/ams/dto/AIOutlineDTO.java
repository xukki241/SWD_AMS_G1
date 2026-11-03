package com.ams.dto;

import com.ams.entity.Lesson;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;

import java.util.List;

public class AIOutlineDTO {

    public record OutlineRequest(
            @Size(max = 4000, message = "Topic is too long")
            String topic,

            @Size(max = 100, message = "Level is too long")
            String level,

            @Min(value = 1, message = "Module count must be at least 1")
            @Max(value = 12, message = "Module count must be 12 or fewer")
            Integer moduleCount
    ) {
    }

    public record OutlineLesson(
            @NotBlank(message = "Lesson title is required")
            String title,
            Lesson.Type type,
            Integer duration
    ) {
    }

    public record OutlineModule(
            @NotBlank(message = "Module title is required")
            String title,

            @NotNull(message = "Module lessons are required")
            @Valid
            List<OutlineLesson> lessons
    ) {
    }

    public record OutlineResponse(
            String topic,
            String level,
            int moduleCount,
            List<OutlineModule> modules
    ) {
    }

    public record AcceptOutlineRequest(
            @NotNull(message = "Modules are required")
            @Size(min = 1, message = "At least one module is required")
            @Valid
            List<OutlineModule> modules
    ) {
    }
}
