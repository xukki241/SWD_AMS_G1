package com.ams.controller;

import com.ams.dto.CourseDTO;
import com.ams.entity.Course;
import com.ams.exception.BadRequestException;
import com.ams.service.CourseService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/courses")
@RequiredArgsConstructor
@Tag(name = "Courses", description = "Course management (any user can create; owner/admin manage)")
public class CourseController {

    private final CourseService courseService;

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "List courses owned by the current user (admin sees all)")
    public ResponseEntity<Page<CourseDTO.CourseSummaryResponse>> listCourses(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        return ResponseEntity.ok(courseService.listCourses(keyword, categoryId, parseStatus(status), page, size));
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get course details")
    public ResponseEntity<CourseDTO.CourseDetailResponse> getCourse(@PathVariable Long id) {
        return ResponseEntity.ok(courseService.getCourse(id));
    }

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Create a course (JSON, thumbnailUrl optional). Grants TEACHER if needed.")
    public ResponseEntity<CourseDTO.CourseDetailResponse> createCourse(
            @Valid @RequestBody CourseDTO.CourseRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(courseService.createCourse(request, null));
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Create a course with an optional thumbnail upload. Grants TEACHER if needed.")
    public ResponseEntity<CourseDTO.CourseDetailResponse> createCourseMultipart(
            @RequestPart("data") @Valid CourseDTO.CourseRequest request,
            @RequestPart(value = "thumbnail", required = false) MultipartFile thumbnail) {
        return ResponseEntity.status(HttpStatus.CREATED).body(courseService.createCourse(request, thumbnail));
    }

    @PutMapping(value = "/{id}", consumes = MediaType.APPLICATION_JSON_VALUE)
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
    @Operation(summary = "Update a course (JSON)")
    public ResponseEntity<CourseDTO.CourseDetailResponse> updateCourse(
            @PathVariable Long id,
            @Valid @RequestBody CourseDTO.CourseRequest request) {
        return ResponseEntity.ok(courseService.updateCourse(id, request, null));
    }

    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
    @Operation(summary = "Update a course with an optional thumbnail upload")
    public ResponseEntity<CourseDTO.CourseDetailResponse> updateCourseMultipart(
            @PathVariable Long id,
            @RequestPart("data") @Valid CourseDTO.CourseRequest request,
            @RequestPart(value = "thumbnail", required = false) MultipartFile thumbnail) {
        return ResponseEntity.ok(courseService.updateCourse(id, request, thumbnail));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
    @Operation(summary = "Soft-delete a course (blocked when it has enrollments)")
    public ResponseEntity<Void> deleteCourse(@PathVariable Long id) {
        courseService.deleteCourse(id);
        return ResponseEntity.noContent().build();
    }

    private Course.Status parseStatus(String status) {
        if (status == null || status.isBlank()) return null;
        try {
            return Course.Status.valueOf(status.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new BadRequestException("Invalid course status: " + status);
        }
    }
}
