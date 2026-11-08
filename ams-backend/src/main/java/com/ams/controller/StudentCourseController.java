package com.ams.controller;

import com.ams.dto.CourseContentDTO;
import com.ams.service.CourseContentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class StudentCourseController {
    private final CourseContentService contentService;

    @GetMapping("/api/student/courses/{courseId}/content")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<CourseContentDTO.ContentResponse> getMyCourseContent(@PathVariable Long courseId) {
        return ResponseEntity.ok(contentService.getStudentContent(courseId));
    }
}
