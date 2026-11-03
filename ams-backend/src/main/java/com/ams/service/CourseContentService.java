package com.ams.service;

import com.ams.dto.AIOutlineDTO;
import com.ams.dto.CourseContentDTO;
import com.ams.entity.Course;
import com.ams.entity.Lesson;
import com.ams.entity.Module;
import com.ams.exception.BadRequestException;
import com.ams.exception.ResourceNotFoundException;
import com.ams.repository.LessonRepository;
import com.ams.repository.ModuleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class CourseContentService {

    private final CourseService courseService;
    private final ModuleRepository moduleRepository;
    private final LessonRepository lessonRepository;
    private final AuditLogService auditLogService;

    @Transactional(readOnly = true)
    public CourseContentDTO.ContentResponse getContent(Long courseId) {
        Course course = courseService.getAccessibleCourse(courseId);
        return buildContent(course);
    }

    @Transactional
    public CourseContentDTO.ModuleResponse addModule(Long courseId, CourseContentDTO.ModuleRequest request) {
        Course course = courseService.getAccessibleCourse(courseId);
        int nextIndex = moduleRepository.findMaxOrderIndex(courseId) + 1;

        Module module = Module.builder()
                .course(course)
                .title(request.title().trim())
                .orderIndex(nextIndex)
                .build();
        module = moduleRepository.save(module);
        auditLogService.log("MODULE_CREATED", "Module", course.getId() + ":" + module.getId());
        return mapModule(module, List.of());
    }

    @Transactional
    public CourseContentDTO.ModuleResponse updateModule(Long moduleId, CourseContentDTO.ModuleRequest request) {
        Module module = moduleRepository.findById(moduleId)
                .orElseThrow(() -> new ResourceNotFoundException("Module not found with id: " + moduleId));
        courseService.getAccessibleCourse(module.getCourse().getId());

        module.setTitle(request.title().trim());
        module = moduleRepository.save(module);
        auditLogService.log("MODULE_UPDATED", "Module", String.valueOf(module.getId()));

        List<Lesson> lessons = lessonRepository.findByModuleIdOrderByOrderIndexAsc(module.getId());
        return mapModule(module, lessons);
    }

    @Transactional
    public void deleteModule(Long moduleId) {
        Module module = moduleRepository.findById(moduleId)
                .orElseThrow(() -> new ResourceNotFoundException("Module not found with id: " + moduleId));
        Long courseId = module.getCourse().getId();
        courseService.getAccessibleCourse(courseId);

        moduleRepository.delete(module);
        moduleRepository.flush();
        normalizeModuleOrder(courseId);
        auditLogService.log("MODULE_DELETED", "Module", String.valueOf(moduleId));
    }

    @Transactional
    public CourseContentDTO.LessonResponse addLesson(Long moduleId, CourseContentDTO.LessonRequest request) {
        Module module = moduleRepository.findById(moduleId)
                .orElseThrow(() -> new ResourceNotFoundException("Module not found with id: " + moduleId));
        courseService.getAccessibleCourse(module.getCourse().getId());

        int nextIndex = lessonRepository.findMaxOrderIndex(moduleId) + 1;
        Lesson lesson = Lesson.builder()
                .module(module)
                .title(request.title().trim())
                .type(request.type())
                .duration(request.duration())
                .status(request.status() == null ? Lesson.Status.DRAFT : request.status())
                .orderIndex(nextIndex)
                .build();
        lesson = lessonRepository.save(lesson);
        auditLogService.log("LESSON_CREATED", "Lesson", moduleId + ":" + lesson.getId());
        return mapLesson(lesson);
    }

    @Transactional
    public CourseContentDTO.LessonResponse updateLesson(Long lessonId, CourseContentDTO.LessonRequest request) {
        Lesson lesson = lessonRepository.findById(lessonId)
                .orElseThrow(() -> new ResourceNotFoundException("Lesson not found with id: " + lessonId));
        courseService.getAccessibleCourse(lesson.getModule().getCourse().getId());

        lesson.setTitle(request.title().trim());
        lesson.setType(request.type());
        lesson.setDuration(request.duration());
        if (request.status() != null) {
            lesson.setStatus(request.status());
        }
        lesson = lessonRepository.save(lesson);
        auditLogService.log("LESSON_UPDATED", "Lesson", String.valueOf(lesson.getId()));
        return mapLesson(lesson);
    }

    @Transactional
    public void deleteLesson(Long lessonId) {
        Lesson lesson = lessonRepository.findById(lessonId)
                .orElseThrow(() -> new ResourceNotFoundException("Lesson not found with id: " + lessonId));
        Long moduleId = lesson.getModule().getId();
        courseService.getAccessibleCourse(lesson.getModule().getCourse().getId());

        lessonRepository.delete(lesson);
        lessonRepository.flush();
        normalizeLessonOrder(moduleId);
        auditLogService.log("LESSON_DELETED", "Lesson", String.valueOf(lessonId));
    }

    @Transactional
    public CourseContentDTO.ContentResponse reorder(Long courseId, CourseContentDTO.ReorderRequest request) {
        Course course = courseService.getAccessibleCourse(courseId);

        List<Module> modules = moduleRepository.findByCourseIdOrderByOrderIndexAsc(courseId);
        List<Lesson> lessons = lessonRepository.findAllByCourseId(courseId);

        Map<Long, Module> moduleById = new HashMap<>();
        modules.forEach(module -> moduleById.put(module.getId(), module));
        Map<Long, Lesson> lessonById = new HashMap<>();
        lessons.forEach(lesson -> lessonById.put(lesson.getId(), lesson));

        if (request.modules() == null || request.modules().size() != modules.size()) {
            throw new BadRequestException("Reorder payload must include every module");
        }

        Set<Long> seenModules = new HashSet<>();
        Set<Long> seenLessons = new HashSet<>();
        for (CourseContentDTO.ModuleOrder moduleOrder : request.modules()) {
            if (moduleOrder == null || moduleOrder.id() == null
                    || !moduleById.containsKey(moduleOrder.id())
                    || !seenModules.add(moduleOrder.id())) {
                throw new BadRequestException("Reorder payload contains an unknown or duplicate module");
            }
            if (moduleOrder.lessonIds() == null) {
                throw new BadRequestException("Reorder payload is missing lesson ids");
            }
            for (Long lessonId : moduleOrder.lessonIds()) {
                if (lessonId == null || !lessonById.containsKey(lessonId) || !seenLessons.add(lessonId)) {
                    throw new BadRequestException("Reorder payload contains an unknown or duplicate lesson");
                }
            }
        }
        if (seenLessons.size() != lessons.size()) {
            throw new BadRequestException("Reorder payload must include every lesson exactly once");
        }

        int moduleIndex = 0;
        for (CourseContentDTO.ModuleOrder moduleOrder : request.modules()) {
            Module module = moduleById.get(moduleOrder.id());
            module.setOrderIndex(moduleIndex++);

            int lessonIndex = 0;
            for (Long lessonId : moduleOrder.lessonIds()) {
                Lesson lesson = lessonById.get(lessonId);
                lesson.setModule(module);
                lesson.setOrderIndex(lessonIndex++);
            }
        }

        moduleRepository.saveAll(modules);
        lessonRepository.saveAll(lessons);
        auditLogService.log("COURSE_CONTENT_REORDERED", "Course", String.valueOf(courseId));
        return buildContent(course);
    }

    /** Appends an accepted AI draft to the existing curriculum (transactional). */
    @Transactional
    public CourseContentDTO.ContentResponse appendOutline(Long courseId, List<AIOutlineDTO.OutlineModule> outlineModules) {
        Course course = courseService.getAccessibleCourse(courseId);
        if (outlineModules == null || outlineModules.isEmpty()) {
            throw new BadRequestException("The outline has no modules to save");
        }

        int moduleIndex = moduleRepository.findMaxOrderIndex(courseId) + 1;
        for (AIOutlineDTO.OutlineModule outlineModule : outlineModules) {
            if (outlineModule == null || outlineModule.title() == null || outlineModule.title().isBlank()) {
                throw new BadRequestException("Every AI module needs a title");
            }
            Module module = moduleRepository.save(Module.builder()
                    .course(course)
                    .title(outlineModule.title().trim())
                    .orderIndex(moduleIndex++)
                    .build());

            List<AIOutlineDTO.OutlineLesson> outlineLessons = outlineModule.lessons();
            if (outlineLessons == null) {
                continue;
            }
            int lessonIndex = 0;
            for (AIOutlineDTO.OutlineLesson outlineLesson : outlineLessons) {
                if (outlineLesson == null || outlineLesson.title() == null || outlineLesson.title().isBlank()) {
                    throw new BadRequestException("Every AI lesson needs a title");
                }
                int duration = outlineLesson.duration() == null ? 10 : Math.max(outlineLesson.duration(), 0);
                lessonRepository.save(Lesson.builder()
                        .module(module)
                        .title(outlineLesson.title().trim())
                        .type(outlineLesson.type() == null ? Lesson.Type.READING : outlineLesson.type())
                        .duration(duration)
                        .status(Lesson.Status.DRAFT)
                        .orderIndex(lessonIndex++)
                        .build());
            }
        }

        auditLogService.log("AI_OUTLINE_ACCEPTED", "Course", String.valueOf(courseId));
        return buildContent(course);
    }

    private void normalizeModuleOrder(Long courseId) {
        List<Module> remaining = moduleRepository.findByCourseIdOrderByOrderIndexAsc(courseId);
        for (int i = 0; i < remaining.size(); i++) {
            remaining.get(i).setOrderIndex(i);
        }
        moduleRepository.saveAll(remaining);
    }

    private void normalizeLessonOrder(Long moduleId) {
        List<Lesson> remaining = lessonRepository.findByModuleIdOrderByOrderIndexAsc(moduleId);
        for (int i = 0; i < remaining.size(); i++) {
            remaining.get(i).setOrderIndex(i);
        }
        lessonRepository.saveAll(remaining);
    }

    private CourseContentDTO.ContentResponse buildContent(Course course) {
        List<Module> modules = moduleRepository.findByCourseIdOrderByOrderIndexAsc(course.getId());

        List<CourseContentDTO.ModuleResponse> moduleResponses = modules.stream()
                .map(module -> mapModule(module,
                        lessonRepository.findByModuleIdOrderByOrderIndexAsc(module.getId())))
                .toList();

        int lessonCount = moduleResponses.stream()
                .mapToInt(module -> module.lessons().size())
                .sum();
        int totalDuration = moduleResponses.stream()
                .flatMap(module -> module.lessons().stream())
                .mapToInt(CourseContentDTO.LessonResponse::duration)
                .sum();

        return new CourseContentDTO.ContentResponse(
                course.getId(),
                course.getTitle(),
                moduleResponses,
                moduleResponses.size(),
                lessonCount,
                totalDuration
        );
    }

    private CourseContentDTO.ModuleResponse mapModule(Module module, List<Lesson> lessons) {
        List<CourseContentDTO.LessonResponse> lessonResponses = lessons.stream()
                .map(this::mapLesson)
                .toList();
        return new CourseContentDTO.ModuleResponse(
                module.getId(),
                module.getCourse().getId(),
                module.getTitle(),
                module.getOrderIndex(),
                lessonResponses
        );
    }

    private CourseContentDTO.LessonResponse mapLesson(Lesson lesson) {
        return new CourseContentDTO.LessonResponse(
                lesson.getId(),
                lesson.getModule().getId(),
                lesson.getTitle(),
                lesson.getType(),
                lesson.getDuration(),
                lesson.getStatus(),
                lesson.getOrderIndex()
        );
    }
}
