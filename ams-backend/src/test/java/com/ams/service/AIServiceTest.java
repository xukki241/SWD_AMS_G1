package com.ams.service;

import com.ams.dto.AIOutlineDTO;
import com.ams.dto.CourseContentDTO;
import com.ams.entity.Course;
import com.ams.entity.Lesson;
import com.ams.entity.User;
import com.ams.exception.AiGenerationException;
import com.ams.service.ai.AiClient;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

class AIServiceTest {

    private AiClient aiClient;
    private CourseService courseService;
    private CourseContentService contentService;
    private AIService aiService;
    private Course course;

    @BeforeEach
    void setUp() {
        aiClient = mock(AiClient.class);
        courseService = mock(CourseService.class);
        contentService = mock(CourseContentService.class);
        aiService = new AIService(aiClient, new ObjectMapper(), courseService, contentService);

        User teacher = User.builder().id(2L).username("teacher1").fullName("Teacher One").build();
        course = Course.builder()
                .id(5L)
                .title("Spring Boot")
                .code("SWD101")
                .description("A practical course")
                .difficultyLevel(Course.DifficultyLevel.INTERMEDIATE)
                .price(BigDecimal.ZERO)
                .instructor(teacher)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
    }

    @Test
    void parseOutlineStripsCodeFencesAndCoercesValues() {
        String raw = """
                ```json
                {
                  "modules": [
                    {
                      "title": " Getting Started ",
                      "lessons": [
                        { "title": "Setup", "type": "video", "duration": 15 },
                        { "title": "Reading", "type": "QUIZ", "duration": "not-a-number" }
                      ]
                    }
                  ]
                }
                ```
                """;

        List<AIOutlineDTO.OutlineModule> modules = aiService.parseOutline(raw);

        assertEquals(1, modules.size());
        assertEquals("Getting Started", modules.get(0).title());
        assertEquals(2, modules.get(0).lessons().size());
        assertEquals(Lesson.Type.VIDEO, modules.get(0).lessons().get(0).type());
        assertEquals(15, modules.get(0).lessons().get(0).duration());
        assertEquals(Lesson.Type.READING, modules.get(0).lessons().get(1).type());
        assertEquals(10, modules.get(0).lessons().get(1).duration());
    }

    @Test
    void parseOutlineAcceptsJsonSurroundedByText() {
        String raw = "Here is the outline:\n{\"modules\":[{\"title\":\"M1\",\"lessons\":[]}]}\nThanks!";

        List<AIOutlineDTO.OutlineModule> modules = aiService.parseOutline(raw);

        assertEquals(1, modules.size());
        assertEquals("M1", modules.get(0).title());
        assertTrue(modules.get(0).lessons().isEmpty());
    }

    @Test
    void parseOutlineRejectsInvalidJson() {
        AiGenerationException ex = assertThrows(AiGenerationException.class,
                () -> aiService.parseOutline("not json at all"));
        assertTrue(ex.getMessage().contains("not valid JSON"));
    }

    @Test
    void parseOutlineRejectsEmptyModules() {
        AiGenerationException ex = assertThrows(AiGenerationException.class,
                () -> aiService.parseOutline("{\"modules\":[]}"));
        assertTrue(ex.getMessage().contains("did not return any modules"));
    }

    @Test
    void generateOutlineUsesCoursePrefillAndMockedClient() {
        when(courseService.getAccessibleCourse(5L)).thenReturn(course);
        when(aiClient.generate(anyString())).thenReturn(
                "{\"modules\":[{\"title\":\"Intro\",\"lessons\":[{\"title\":\"Welcome\",\"type\":\"READING\",\"duration\":5}]}]}");

        AIOutlineDTO.OutlineResponse response = aiService.generateOutline(
                5L, new AIOutlineDTO.OutlineRequest(null, null, 3));

        assertEquals(3, response.moduleCount());
        assertEquals("INTERMEDIATE", response.level());
        assertTrue(response.topic().contains("Spring Boot"));
        assertEquals(1, response.modules().size());
        verify(aiClient).generate(contains("exactly 3 modules"));
    }

    @Test
    void acceptOutlineDelegatesToTransactionalContentService() {
        CourseContentDTO.ContentResponse content = new CourseContentDTO.ContentResponse(
                5L, "Spring Boot", List.of(), 0, 0, 0);
        AIOutlineDTO.AcceptOutlineRequest request = new AIOutlineDTO.AcceptOutlineRequest(List.of(
                new AIOutlineDTO.OutlineModule("Intro", List.of())
        ));
        when(contentService.appendOutline(5L, request.modules())).thenReturn(content);

        CourseContentDTO.ContentResponse response = aiService.acceptOutline(5L, request);

        assertSame(content, response);
        verify(contentService).appendOutline(5L, request.modules());
    }
}
