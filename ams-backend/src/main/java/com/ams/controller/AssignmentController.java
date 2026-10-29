package com.ams.controller;

import com.ams.dto.AssignmentDTO;
import com.ams.service.AssignmentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/assignments")
@RequiredArgsConstructor
@Tag(name = "Assignments", description = "Teacher Assignment Management APIs")
public class AssignmentController {

    private final AssignmentService assignmentService;

    @GetMapping
    @Operation(summary = "Get all assignments")
    public ResponseEntity<List<AssignmentDTO.AssignmentResponse>> getAllAssignments() {
        return ResponseEntity.ok(assignmentService.getAllAssignments());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get assignment by ID")
    public ResponseEntity<AssignmentDTO.AssignmentResponse> getAssignmentById(@PathVariable Long id) {
        return ResponseEntity.ok(assignmentService.getAssignmentById(id));
    }

    @GetMapping("/class/{subjectClassId}")
    @Operation(summary = "Get assignments allocated to a subject class")
    public ResponseEntity<List<AssignmentDTO.AssignmentResponse>> getAssignmentsByClass(@PathVariable Long subjectClassId) {
        return ResponseEntity.ok(assignmentService.getAssignmentsByClass(subjectClassId));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
    @Operation(summary = "Create an assignment")
    public ResponseEntity<AssignmentDTO.AssignmentResponse> createAssignment(@Valid @RequestBody AssignmentDTO.CreateAssignmentRequest request) {
        return ResponseEntity.ok(assignmentService.createAssignment(request));
    }

    @PostMapping("/allocate")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
    @Operation(summary = "Allocate assignment to a class")
    public ResponseEntity<Void> allocateToClass(@Valid @RequestBody AssignmentDTO.AllocateClassRequest request) {
        assignmentService.allocateToClass(request);
        return ResponseEntity.ok().build();
    }
}
