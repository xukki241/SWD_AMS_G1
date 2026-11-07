package com.ams.controller;

import com.ams.dto.EvaluationDTO;
import com.ams.service.EvaluationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/evaluations")
@RequiredArgsConstructor
@Tag(name = "Evaluations", description = "Teacher Grading & Feedback APIs")
public class EvaluationController {

    private final EvaluationService evaluationService;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
    @Operation(summary = "Grade and evaluate a student submission")
    public ResponseEntity<EvaluationDTO.EvaluationResponse> evaluate(@Valid @RequestBody EvaluationDTO.CreateEvaluationRequest request) {
        return ResponseEntity.ok(evaluationService.evaluateSubmission(request));
    }

    @PostMapping("/submission/{submissionId}/publish")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
    @Operation(summary = "Publish a teacher-reviewed grade to the student")
    public ResponseEntity<EvaluationDTO.EvaluationResponse> publish(@PathVariable Long submissionId) {
        return ResponseEntity.ok(evaluationService.publishEvaluation(submissionId));
    }

    @GetMapping("/submission/{submissionId}")
    @Operation(summary = "Get evaluation by submission ID")
    public ResponseEntity<EvaluationDTO.EvaluationResponse> getBySubmission(@PathVariable Long submissionId) {
        return ResponseEntity.ok(evaluationService.getEvaluationBySubmission(submissionId));
    }
}
