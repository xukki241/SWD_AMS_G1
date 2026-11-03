package com.ams.controller;

import com.ams.dto.AssignmentDTO;
import com.ams.service.AssignmentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/assignments")
@RequiredArgsConstructor
@Tag(name = "Assignments", description = "Course Assignment Management APIs")
public class AssignmentController {

    private final AssignmentService assignmentService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER', 'EXPERT', 'STUDENT')")
    @Operation(summary = "Get all assignments")
    public ResponseEntity<List<AssignmentDTO.AssignmentResponse>> getAllAssignments() {
        return ResponseEntity.ok(assignmentService.getAllAssignments());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER', 'EXPERT', 'STUDENT')")
    @Operation(summary = "Get assignment by ID")
    public ResponseEntity<AssignmentDTO.AssignmentResponse> getAssignmentById(@PathVariable Long id) {
        return ResponseEntity.ok(assignmentService.getAssignmentById(id));
    }

    @GetMapping("/course/{courseId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER', 'EXPERT', 'STUDENT')")
    @Operation(summary = "Get assignments of a course")
    public ResponseEntity<List<AssignmentDTO.AssignmentResponse>> getAssignmentsByCourse(@PathVariable Long courseId) {
        return ResponseEntity.ok(assignmentService.getAssignmentsByCourse(courseId));
    }

    @GetMapping("/overview")
    @PreAuthorize("hasRole('STUDENT')")
    @Operation(summary = "Student's pending-work overview: own course assignments with work state")
    public ResponseEntity<List<AssignmentDTO.AssignmentOverviewItem>> getOverview() {
        return ResponseEntity.ok(assignmentService.getMyAssignmentsOverview());
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
    @Operation(summary = "Create an assignment (courseId in body)")
    public ResponseEntity<AssignmentDTO.AssignmentResponse> createAssignment(
            @Valid @RequestBody CreateWithCourseRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(assignmentService.createAssignment(request.courseId(), request.toCreateRequest()));
    }

    @PostMapping("/course/{courseId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
    @Operation(summary = "Create an assignment for a course")
    public ResponseEntity<AssignmentDTO.AssignmentResponse> createForCourse(
            @PathVariable Long courseId,
            @Valid @RequestBody AssignmentDTO.CreateAssignmentRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(assignmentService.createAssignment(courseId, request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('TEACHER')")
    @Operation(summary = "Update an assignment; owning teacher only")
    public ResponseEntity<AssignmentDTO.AssignmentResponse> updateAssignment(
            @PathVariable Long id,
            @RequestBody AssignmentDTO.UpdateAssignmentRequest request
    ) {
        return ResponseEntity.ok(assignmentService.updateAssignment(id, request));
    }

    @PatchMapping("/{id}")
    @PreAuthorize("hasRole('TEACHER')")
    @Operation(summary = "Partial update assignment; owning teacher only")
    public ResponseEntity<AssignmentDTO.AssignmentResponse> patchAssignment(
            @PathVariable Long id,
            @RequestBody AssignmentDTO.UpdateAssignmentRequest request
    ) {
        return ResponseEntity.ok(assignmentService.updateAssignment(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('TEACHER')")
    @Operation(summary = "Delete an assignment; owning teacher only")
    public ResponseEntity<Void> deleteAssignment(@PathVariable Long id) {
        assignmentService.deleteAssignment(id);
        return ResponseEntity.noContent().build();
    }

    /** Body variant that carries courseId explicitly. */
    public record CreateWithCourseRequest(
            Long templateId,
            @jakarta.validation.constraints.NotBlank String title,
            String instructions,
            String topic,
            @jakarta.validation.constraints.NotNull java.time.LocalDateTime dueAt,
            java.math.BigDecimal maxScore,
            @jakarta.validation.constraints.NotNull Long courseId
    ) {
        public AssignmentDTO.CreateAssignmentRequest toCreateRequest() {
            return new AssignmentDTO.CreateAssignmentRequest(
                    templateId, title, instructions, topic, dueAt, maxScore);
        }
    }
}
