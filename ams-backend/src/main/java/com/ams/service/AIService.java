package com.ams.service;

import com.ams.dto.AIOutlineDTO;
import com.ams.dto.CourseContentDTO;
import com.ams.entity.Course;
import com.ams.entity.Lesson;
import com.ams.exception.AiGenerationException;
import com.ams.service.ai.AiClient;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class AIService {

    private static final int MAX_MODULES = 20;
    private static final int MAX_PROMPT_TEXT = 2000;

    private final AiClient aiClient;
    private final ObjectMapper objectMapper;
    private final CourseService courseService;
    private final CourseContentService contentService;

    /**
     * Generates an outline draft. Nothing is written to the database.
     */
    public AIOutlineDTO.OutlineResponse generateOutline(Long courseId, AIOutlineDTO.OutlineRequest request) {
        Course course = courseService.getAccessibleCourse(courseId);

        String topic = request.topic() == null || request.topic().isBlank()
                ? course.getTitle() + " - " + course.getDescription()
                : request.topic().trim();
        String level = request.level() == null || request.level().isBlank()
                ? course.getDifficultyLevel().name()
                : request.level().trim();
        int moduleCount = request.moduleCount() == null ? 5 : request.moduleCount();

        String rawResponse;
        try {
            rawResponse = aiClient.generate(buildPrompt(course, topic, level, moduleCount));
        } catch (AiGenerationException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new AiGenerationException("The AI service is unavailable. Please try again.", ex);
        }

        List<AIOutlineDTO.OutlineModule> modules = parseOutline(rawResponse);
        return new AIOutlineDTO.OutlineResponse(topic, level, moduleCount, modules);
    }

    /**
     * Saves the (possibly teacher-edited) draft. Delegates to a transactional
     * content service so a failure leaves the existing curriculum untouched.
     */
    public CourseContentDTO.ContentResponse acceptOutline(Long courseId, AIOutlineDTO.AcceptOutlineRequest request) {
        return contentService.appendOutline(courseId, request.modules());
    }

    /** Parses Gemini JSON safely: strips fences, validates shape, coerces lesson types. */
    public List<AIOutlineDTO.OutlineModule> parseOutline(String rawResponse) {
        if (rawResponse == null || rawResponse.isBlank()) {
            throw new AiGenerationException("The AI returned an empty outline. Please try again.");
        }

        String json = stripCodeFences(rawResponse);
        int firstBrace = json.indexOf('{');
        int lastBrace = json.lastIndexOf('}');
        if (firstBrace < 0 || lastBrace <= firstBrace) {
            throw new AiGenerationException("The AI response was not valid JSON. Please regenerate the outline.");
        }
        json = json.substring(firstBrace, lastBrace + 1);

        JsonNode root;
        try {
            root = objectMapper.readTree(json);
        } catch (JsonProcessingException ex) {
            throw new AiGenerationException("The AI response could not be understood. Please regenerate the outline.", ex);
        }

        JsonNode modulesNode = root.path("modules");
        if (!modulesNode.isArray() || modulesNode.isEmpty()) {
            throw new AiGenerationException("The AI did not return any modules. Please regenerate the outline.");
        }

        List<AIOutlineDTO.OutlineModule> modules = new ArrayList<>();
        int limit = Math.min(modulesNode.size(), MAX_MODULES);
        for (int i = 0; i < limit; i++) {
            JsonNode moduleNode = modulesNode.get(i);
            String title = textValue(moduleNode, "title");
            if (title == null) {
                throw new AiGenerationException("The AI outline contains a module without a title. Please regenerate.");
            }

            List<AIOutlineDTO.OutlineLesson> lessons = new ArrayList<>();
            JsonNode lessonsNode = moduleNode.path("lessons");
            if (lessonsNode.isArray()) {
                for (JsonNode lessonNode : lessonsNode) {
                    String lessonTitle = textValue(lessonNode, "title");
                    if (lessonTitle == null) {
                        throw new AiGenerationException("The AI outline contains a lesson without a title. Please regenerate.");
                    }
                    lessons.add(new AIOutlineDTO.OutlineLesson(
                            lessonTitle,
                            parseType(lessonNode.path("type").asText(null)),
                            parseDuration(lessonNode.path("duration"))
                    ));
                }
            }
            modules.add(new AIOutlineDTO.OutlineModule(title, lessons));
        }

        return modules;
    }

    private String buildPrompt(Course course, String topic, String level, int moduleCount) {
        return """
                You are an experienced curriculum designer. Create a course outline as strict JSON.
                Course title: %s
                Course description: %s
                Topic / teacher instructions: %s
                Difficulty level: %s
                Number of modules: %d

                Return ONLY a JSON object with this exact shape:
                {
                  "modules": [
                    {
                      "title": "Module title",
                      "lessons": [
                        { "title": "Lesson title", "type": "VIDEO", "duration": 15 }
                      ]
                    }
                  ]
                }

                Rules:
                - Produce exactly %d modules.
                - Each module has between 3 and 6 lessons.
                - "type" is exactly one of VIDEO, READING, ASSIGNMENT.
                - "duration" is an integer number of minutes between 1 and 180.
                - Do not include markdown fences, explanations, or any text outside the JSON object.
                """.formatted(
                truncate(course.getTitle(), MAX_PROMPT_TEXT),
                truncate(course.getDescription(), MAX_PROMPT_TEXT),
                truncate(topic, MAX_PROMPT_TEXT),
                truncate(level, 100),
                moduleCount,
                moduleCount
        );
    }

    private String stripCodeFences(String raw) {
        String value = raw.trim();
        if (value.startsWith("```")) {
            int firstNewline = value.indexOf('\n');
            if (firstNewline >= 0) {
                value = value.substring(firstNewline + 1);
            }
            int closingFence = value.lastIndexOf("```");
            if (closingFence >= 0) {
                value = value.substring(0, closingFence);
            }
        }
        return value.trim();
    }

    private String textValue(JsonNode node, String field) {
        JsonNode value = node.path(field);
        if (!value.isTextual() || value.asText().isBlank()) {
            return null;
        }
        return value.asText().trim();
    }

    private Lesson.Type parseType(String rawType) {
        if (rawType == null || rawType.isBlank()) {
            return Lesson.Type.READING;
        }
        try {
            return Lesson.Type.valueOf(rawType.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException ex) {
            return Lesson.Type.READING;
        }
    }

    private int parseDuration(JsonNode durationNode) {
        int duration = durationNode.isNumber()
                ? durationNode.asInt()
                : parseIntOrDefault(durationNode.asText(null));
        if (duration <= 0) {
            return 10;
        }
        return Math.min(duration, 600);
    }

    private int parseIntOrDefault(String raw) {
        if (raw == null || raw.isBlank()) {
            return 10;
        }
        try {
            return Integer.parseInt(raw.trim());
        } catch (NumberFormatException ex) {
            return 10;
        }
    }

    private String truncate(String value, int maxLength) {
        if (value == null) {
            return "";
        }
        String trimmed = value.trim();
        return trimmed.length() <= maxLength ? trimmed : trimmed.substring(0, maxLength);
    }
}
