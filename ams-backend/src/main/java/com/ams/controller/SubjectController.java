package com.ams.controller;

import com.ams.dto.SubjectDTO;
import com.ams.service.SubjectService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/subjects")
@RequiredArgsConstructor
@Tag(name = "Subjects", description = "Subject Management APIs")
public class SubjectController {

    private final SubjectService subjectService;

    @GetMapping
    @Operation(summary = "Get all subjects")
    public ResponseEntity<List<SubjectDTO.SubjectResponse>> getAllSubjects() {
        return ResponseEntity.ok(subjectService.getAllSubjects());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get subject by ID")
    public ResponseEntity<SubjectDTO.SubjectResponse> getSubjectById(@PathVariable Long id) {
        return ResponseEntity.ok(subjectService.getSubjectById(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'EXPERT')")
    @Operation(summary = "Create new subject")
    public ResponseEntity<SubjectDTO.SubjectResponse> createSubject(@Valid @RequestBody SubjectDTO.CreateSubjectRequest request) {
        return ResponseEntity.ok(subjectService.createSubject(request));
    }
}
