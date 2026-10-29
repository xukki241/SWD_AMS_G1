package com.ams.controller;

import com.ams.dto.AssignmentDTO;
import com.ams.service.AssignmentTemplateService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/assignment-templates")
@RequiredArgsConstructor
@Tag(name = "Assignment Templates", description = "Expert Assignment Blueprint APIs")
public class AssignmentTemplateController {

    private final AssignmentTemplateService templateService;

    @GetMapping
    @Operation(summary = "Get all assignment templates")
    public ResponseEntity<List<AssignmentDTO.AssignmentTemplateResponse>> getAllTemplates() {
        return ResponseEntity.ok(templateService.getAllTemplates());
    }

    @GetMapping("/subject/{subjectId}")
    @Operation(summary = "Get templates by subject ID")
    public ResponseEntity<List<AssignmentDTO.AssignmentTemplateResponse>> getTemplatesBySubject(@PathVariable Long subjectId) {
        return ResponseEntity.ok(templateService.getTemplatesBySubject(subjectId));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'EXPERT')")
    @Operation(summary = "Create assignment template")
    public ResponseEntity<AssignmentDTO.AssignmentTemplateResponse> createTemplate(@Valid @RequestBody AssignmentDTO.CreateTemplateRequest request) {
        return ResponseEntity.ok(templateService.createTemplate(request));
    }
}
