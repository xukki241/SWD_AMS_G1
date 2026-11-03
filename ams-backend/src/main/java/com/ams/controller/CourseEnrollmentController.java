package com.ams.controller;

import com.ams.dto.EnrollmentDTO;
import com.ams.service.CourseEnrollmentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@Tag(name = "Course Enrollments", description = "Enroll Course with Payment APIs")
public class CourseEnrollmentController {

    private final CourseEnrollmentService enrollmentService;

    @PostMapping("/api/courses/{courseId}/enroll")
    @PreAuthorize("hasRole('STUDENT')")
    @Operation(summary = "Enroll the current student in a course (free -> ACTIVE, paid -> PENDING_PAYMENT)")
    public ResponseEntity<EnrollmentDTO.EnrollmentResponse> enroll(@PathVariable Long courseId) {
        return ResponseEntity.status(HttpStatus.CREATED).body(enrollmentService.enroll(courseId));
    }

    @GetMapping("/api/enrollments/my")
    @PreAuthorize("hasRole('STUDENT')")
    @Operation(summary = "List the current student's course enrollments")
    public ResponseEntity<List<EnrollmentDTO.EnrollmentResponse>> myEnrollments() {
        return ResponseEntity.ok(enrollmentService.getMyEnrollments());
    }

    @GetMapping("/api/courses/{courseId}/enrollments/me")
    @PreAuthorize("hasRole('STUDENT')")
    @Operation(summary = "Get the current student's enrollment in one course")
    public ResponseEntity<EnrollmentDTO.EnrollmentResponse> myEnrollmentInCourse(@PathVariable Long courseId) {
        return ResponseEntity.ok(enrollmentService.getMyEnrollmentInCourse(courseId));
    }

    @GetMapping("/api/courses/{courseId}/enrollments")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
    @Operation(summary = "Course roster (course owner or admin)")
    public ResponseEntity<List<EnrollmentDTO.EnrollmentResponse>> courseRoster(@PathVariable Long courseId) {
        return ResponseEntity.ok(enrollmentService.getCourseRoster(courseId));
    }

    @DeleteMapping("/api/enrollments/{id}")
    @PreAuthorize("hasRole('STUDENT')")
    @Operation(summary = "Cancel own enrollment")
    public ResponseEntity<Void> cancel(@PathVariable Long id) {
        enrollmentService.cancelEnrollment(id);
        return ResponseEntity.noContent().build();
    }
}
