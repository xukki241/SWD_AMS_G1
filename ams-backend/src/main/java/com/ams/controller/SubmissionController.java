package com.ams.controller;

import com.ams.dto.SubmissionDTO;
import com.ams.service.SubmissionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/submissions")
@RequiredArgsConstructor
@Tag(name = "Submissions", description = "Student Assignment Submissions & Cloudinary Upload APIs")
public class SubmissionController {

    private final SubmissionService submissionService;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('STUDENT')")
    @Operation(summary = "Submit assignment file for a course enrollment (uploaded to Cloudinary)")
    public ResponseEntity<SubmissionDTO.SubmissionResponse> submitAssignment(
            @RequestParam("courseEnrollmentId") Long courseEnrollmentId,
            @RequestParam("assignmentId") Long assignmentId,
            @RequestParam(value = "file", required = false) MultipartFile file,
            @RequestParam(value = "answerText", required = false) String answerText
    ) throws IOException {
        return ResponseEntity.ok(submissionService.submitAssignment(courseEnrollmentId, assignmentId, file, answerText));
    }

    @GetMapping("/assignment/{assignmentId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
    @Operation(summary = "Get all student submissions for an assignment")
    public ResponseEntity<List<SubmissionDTO.SubmissionResponse>> getSubmissionsByAssignment(@PathVariable Long assignmentId) {
        return ResponseEntity.ok(submissionService.getSubmissionsByAssignment(assignmentId));
    }

    @GetMapping("/my")
    @PreAuthorize("hasRole('STUDENT')")
    @Operation(summary = "Get current student's submissions")
    public ResponseEntity<List<SubmissionDTO.SubmissionResponse>> getMySubmissions() {
        return ResponseEntity.ok(submissionService.getMySubmissions());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('STUDENT')")
    @Operation(summary = "Unsubmit (withdraw) own non-graded submission")
    public ResponseEntity<Void> unsubmit(@PathVariable Long id) {
        submissionService.unsubmit(id);
        return ResponseEntity.noContent().build();
    }
}
