package com.ams.service;

import com.ams.dto.AIOutlineDTO;
import com.ams.dto.CourseContentDTO;
import com.ams.entity.Course;
import com.ams.entity.Lesson;
import com.ams.entity.Module;
import com.ams.entity.User;
import com.ams.exception.BadRequestException;
import com.ams.repository.LessonRepository;
import com.ams.repository.ModuleRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CourseContentServiceTest {

    @Mock private CourseService courseService;
    @Mock private ModuleRepository moduleRepository;
    @Mock private LessonRepository lessonRepository;
    @Mock private AuditLogService auditLogService;

    @InjectMocks private CourseContentService contentService;

    private Course course;
    private Module moduleA;
    private Module moduleB;
    private Lesson lesson1;
    private Lesson lesson2;
    private Lesson lesson3;

    @BeforeEach
    void setUp() {
        User teacher = User.builder().id(2L).username("teacher1").fullName("Teacher One").build();
        course = Course.builder()
                .id(1L)
                .title("Spring Boot")
                .code("SWD101")
                .description("Learn")
                .price(BigDecimal.ZERO)
                .instructor(teacher)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        moduleA = Module.builder().id(10L).course(course).title("Module A").orderIndex(0).build();
        moduleB = Module.builder().id(20L).course(course).title("Module B").orderIndex(1).build();

        lesson1 = Lesson.builder().id(100L).module(moduleA).title("Lesson 1").orderIndex(0).build();
        lesson2 = Lesson.builder().id(101L).module(moduleA).title("Lesson 2").orderIndex(1).build();
        lesson3 = Lesson.builder().id(102L).module(moduleB).title("Lesson 3").orderIndex(0).build();
    }

    @Test
    void reorderMovesModulesAndLessonsAndNormalizesIndexes() {
        when(courseService.getAccessibleCourse(1L)).thenReturn(course);
        when(moduleRepository.findByCourseIdOrderByOrderIndexAsc(1L))
                .thenReturn(List.of(moduleA, moduleB));
        when(lessonRepository.findAllByCourseId(1L))
                .thenReturn(List.of(lesson1, lesson2, lesson3));
        when(lessonRepository.findByModuleIdOrderByOrderIndexAsc(anyLong())).thenReturn(List.of());

        CourseContentDTO.ReorderRequest request = new CourseContentDTO.ReorderRequest(List.of(
                new CourseContentDTO.ModuleOrder(20L, List.of(102L)),
                new CourseContentDTO.ModuleOrder(10L, List.of(101L, 100L))
        ));

        contentService.reorder(1L, request);

        assertEquals(0, moduleB.getOrderIndex());
        assertEquals(1, moduleA.getOrderIndex());
        assertEquals(moduleB, lesson3.getModule());
        assertEquals(0, lesson3.getOrderIndex());
        assertEquals(moduleA, lesson2.getModule());
        assertEquals(0, lesson2.getOrderIndex());
        assertEquals(1, lesson1.getOrderIndex());
        verify(moduleRepository).saveAll(List.of(moduleA, moduleB));
        verify(lessonRepository).saveAll(List.of(lesson1, lesson2, lesson3));
        verify(auditLogService).log("COURSE_CONTENT_REORDERED", "Course", "1");
    }

    @Test
    void reorderRejectsPayloadThatOmitsALesson() {
        when(courseService.getAccessibleCourse(1L)).thenReturn(course);
        when(moduleRepository.findByCourseIdOrderByOrderIndexAsc(1L)).thenReturn(List.of(moduleA, moduleB));
        when(lessonRepository.findAllByCourseId(1L)).thenReturn(List.of(lesson1, lesson2, lesson3));

        CourseContentDTO.ReorderRequest request = new CourseContentDTO.ReorderRequest(List.of(
                new CourseContentDTO.ModuleOrder(10L, List.of(100L, 101L)),
                new CourseContentDTO.ModuleOrder(20L, List.of())
        ));

        assertThrows(BadRequestException.class, () -> contentService.reorder(1L, request));
        verify(lessonRepository, never()).saveAll(any());
    }

    @Test
    void reorderRejectsUnknownModule() {
        when(courseService.getAccessibleCourse(1L)).thenReturn(course);
        when(moduleRepository.findByCourseIdOrderByOrderIndexAsc(1L)).thenReturn(List.of(moduleA, moduleB));
        when(lessonRepository.findAllByCourseId(1L)).thenReturn(List.of(lesson1, lesson2, lesson3));

        CourseContentDTO.ReorderRequest request = new CourseContentDTO.ReorderRequest(List.of(
                new CourseContentDTO.ModuleOrder(999L, List.of(100L, 101L, 102L)),
                new CourseContentDTO.ModuleOrder(20L, List.of())
        ));

        assertThrows(BadRequestException.class, () -> contentService.reorder(1L, request));
    }

    @Test
    void deleteModuleNormalizesRemainingOrder() {
        when(moduleRepository.findById(10L)).thenReturn(java.util.Optional.of(moduleA));
        when(courseService.getAccessibleCourse(1L)).thenReturn(course);
        when(moduleRepository.findByCourseIdOrderByOrderIndexAsc(1L)).thenReturn(List.of(moduleB));

        contentService.deleteModule(10L);

        assertEquals(0, moduleB.getOrderIndex());
        verify(moduleRepository).delete(moduleA);
        verify(auditLogService).log("MODULE_DELETED", "Module", "10");
    }

    @Test
    void appendOutlineAppendsModulesAfterExistingOnes() {
        when(courseService.getAccessibleCourse(1L)).thenReturn(course);
        when(moduleRepository.findMaxOrderIndex(1L)).thenReturn(1);
        when(moduleRepository.save(any(Module.class))).thenAnswer(invocation -> {
            Module module = invocation.getArgument(0);
            module.setId(30L);
            return module;
        });
        when(lessonRepository.save(any(Lesson.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(moduleRepository.findByCourseIdOrderByOrderIndexAsc(1L)).thenReturn(List.of());

        contentService.appendOutline(1L, List.of(
                new AIOutlineDTO.OutlineModule("AI Module", List.of(
                        new AIOutlineDTO.OutlineLesson("AI Lesson", Lesson.Type.VIDEO, 30)
                ))
        ));

        verify(moduleRepository).save(argThat(module ->
                module.getTitle().equals("AI Module") && module.getOrderIndex() == 2));
        verify(lessonRepository).save(argThat(lesson ->
                lesson.getTitle().equals("AI Lesson")
                        && lesson.getType() == Lesson.Type.VIDEO
                        && lesson.getOrderIndex() == 0));
        verify(auditLogService).log("AI_OUTLINE_ACCEPTED", "Course", "1");
    }
}
