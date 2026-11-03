package com.ams.controller;

import com.ams.dto.CourseContentDTO;
import com.ams.service.CourseContentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
@Tag(name = "Course Content", description = "Modules, lessons and curriculum reordering")
public class CourseContentController {

    private final CourseContentService contentService;

    @GetMapping("/api/courses/{courseId}/content")
    @Operation(summary = "Get the module/lesson curriculum tree")
    public ResponseEntity<CourseContentDTO.ContentResponse> getContent(@PathVariable Long courseId) {
        return ResponseEntity.ok(contentService.getContent(courseId));
    }

    @PostMapping("/api/courses/{courseId}/modules")
    @Operation(summary = "Append a module to the course")
    public ResponseEntity<CourseContentDTO.ModuleResponse> addModule(
            @PathVariable Long courseId,
            @Valid @RequestBody CourseContentDTO.ModuleRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(contentService.addModule(courseId, request));
    }

    @PutMapping("/api/modules/{moduleId}")
    @Operation(summary = "Rename a module")
    public ResponseEntity<CourseContentDTO.ModuleResponse> updateModule(
            @PathVariable Long moduleId,
            @Valid @RequestBody CourseContentDTO.ModuleRequest request) {
        return ResponseEntity.ok(contentService.updateModule(moduleId, request));
    }

    @DeleteMapping("/api/modules/{moduleId}")
    @Operation(summary = "Delete a module and all of its lessons")
    public ResponseEntity<Void> deleteModule(@PathVariable Long moduleId) {
        contentService.deleteModule(moduleId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/api/modules/{moduleId}/lessons")
    @Operation(summary = "Append a lesson to a module")
    public ResponseEntity<CourseContentDTO.LessonResponse> addLesson(
            @PathVariable Long moduleId,
            @Valid @RequestBody CourseContentDTO.LessonRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(contentService.addLesson(moduleId, request));
    }

    @PutMapping("/api/lessons/{lessonId}")
    @Operation(summary = "Edit a lesson")
    public ResponseEntity<CourseContentDTO.LessonResponse> updateLesson(
            @PathVariable Long lessonId,
            @Valid @RequestBody CourseContentDTO.LessonRequest request) {
        return ResponseEntity.ok(contentService.updateLesson(lessonId, request));
    }

    @DeleteMapping("/api/lessons/{lessonId}")
    @Operation(summary = "Delete a lesson")
    public ResponseEntity<Void> deleteLesson(@PathVariable Long lessonId) {
        contentService.deleteLesson(lessonId);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/api/courses/{courseId}/content/reorder")
    @Operation(summary = "Persist the new module/lesson order")
    public ResponseEntity<CourseContentDTO.ContentResponse> reorder(
            @PathVariable Long courseId,
            @Valid @RequestBody CourseContentDTO.ReorderRequest request) {
        return ResponseEntity.ok(contentService.reorder(courseId, request));
    }
}
