package com.ams.controller;

import com.ams.dto.AiGradingDTO;
import com.ams.service.AiGradingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ai-grading")
@RequiredArgsConstructor
public class AiGradingController {
    private final AiGradingService aiGradingService;

    @PostMapping("/submissions/{submissionId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
    public ResponseEntity<AiGradingDTO.AiGradeResponse> grade(@PathVariable Long submissionId) {
        return ResponseEntity.ok(aiGradingService.grade(submissionId));
    }

    @PostMapping("/batch")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
    public ResponseEntity<AiGradingDTO.BatchResponse> batch(@Valid @RequestBody AiGradingDTO.BatchRequest request) {
        return ResponseEntity.ok(aiGradingService.gradeBatch(request.submissionIds()));
    }
}
