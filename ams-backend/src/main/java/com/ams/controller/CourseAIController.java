package com.ams.controller;

import com.ams.dto.AIOutlineDTO;
import com.ams.dto.CourseContentDTO;
import com.ams.service.AIService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/courses/{courseId}/ai")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
@Tag(name = "AI Course Outline", description = "Gemini-powered outline drafts and acceptance")
public class CourseAIController {

    private final AIService aiService;

    @PostMapping("/outline")
    @Operation(summary = "Generate an outline draft (not saved)")
    public ResponseEntity<AIOutlineDTO.OutlineResponse> generateOutline(
            @PathVariable Long courseId,
            @Valid @RequestBody AIOutlineDTO.OutlineRequest request) {
        return ResponseEntity.ok(aiService.generateOutline(courseId, request));
    }

    @PostMapping("/outline/accept")
    @Operation(summary = "Save an accepted/edited outline draft")
    public ResponseEntity<CourseContentDTO.ContentResponse> acceptOutline(
            @PathVariable Long courseId,
            @Valid @RequestBody AIOutlineDTO.AcceptOutlineRequest request) {
        return ResponseEntity.ok(aiService.acceptOutline(courseId, request));
    }
}
