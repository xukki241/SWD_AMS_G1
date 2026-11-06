package com.ams.controller;

import com.ams.dto.CourseDTO;
import com.ams.service.CourseService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Read-only catalog endpoints for anonymous visitors and students.
 * These only expose PUBLISHED, non-deleted courses.
 */
@RestController
@RequestMapping("/api/public/courses")
@RequiredArgsConstructor
@Tag(name = "Public Courses", description = "Published course catalog (read-only)")
public class PublicCourseController {

    private final CourseService courseService;

    @GetMapping
    @Operation(summary = "List published courses with keyword, category and pagination")
    public ResponseEntity<Page<CourseDTO.CourseSummaryResponse>> listPublishedCourses(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        return ResponseEntity.ok(courseService.listPublishedCourses(keyword, categoryId, page, size));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get a published course's details")
    public ResponseEntity<CourseDTO.CourseDetailResponse> getPublishedCourse(@PathVariable Long id) {
        return ResponseEntity.ok(courseService.getPublishedCourse(id));
    }
}
