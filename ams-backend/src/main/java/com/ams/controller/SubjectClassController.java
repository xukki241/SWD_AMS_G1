package com.ams.controller;

import com.ams.dto.SubjectClassDTO;
import com.ams.service.SubjectClassService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/subject-classes")
@RequiredArgsConstructor
@Tag(name = "Subject Classes", description = "Class Offering Management APIs")
public class SubjectClassController {

    private final SubjectClassService classService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER', 'EXPERT', 'STUDENT')")
    @Operation(summary = "Get all subject classes")
    public ResponseEntity<List<SubjectClassDTO.SubjectClassResponse>> getAllClasses() {
        return ResponseEntity.ok(classService.getAllClasses());
    }

    @GetMapping("/public")
    @Operation(summary = "Public class catalog for the guest landing page (no auth)")
    public ResponseEntity<List<SubjectClassDTO.SubjectClassResponse>> getPublicCatalog() {
        return ResponseEntity.ok(classService.getPublicCatalog());
    }

    @GetMapping("/my")
    @Operation(summary = "Classes the current user belongs to (staff FK or own registration)")
    public ResponseEntity<List<SubjectClassDTO.MyClassResponse>> getMyClasses() {
        return ResponseEntity.ok(classService.getMyClasses());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get class by ID")
    public ResponseEntity<SubjectClassDTO.SubjectClassResponse> getClassById(@PathVariable Long id) {
        return ResponseEntity.ok(classService.getClassById(id));
    }

    @GetMapping("/teacher/{teacherId}")
    @Operation(summary = "Get classes by teacher ID")
    public ResponseEntity<List<SubjectClassDTO.SubjectClassResponse>> getClassesByTeacher(@PathVariable Long teacherId) {
        return ResponseEntity.ok(classService.getClassesByTeacher(teacherId));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'EXPERT', 'TEACHER')")
    @Operation(summary = "Create subject class (join code auto-generated when not supplied)")
    public ResponseEntity<SubjectClassDTO.SubjectClassResponse> createClass(@Valid @RequestBody SubjectClassDTO.CreateSubjectClassRequest request) {
        return ResponseEntity.ok(classService.createClass(request));
    }
}
