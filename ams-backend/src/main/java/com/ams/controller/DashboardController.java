package com.ams.controller;

import com.ams.dto.DashboardDTO;
import com.ams.service.DashboardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
@Tag(name = "Dashboard", description = "Role-based Dashboard Statistics APIs")
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get admin dashboard statistics")
    public ResponseEntity<DashboardDTO.AdminDashboardResponse> getAdminDashboard() {
        return ResponseEntity.ok(dashboardService.getAdminDashboard());
    }

    @GetMapping("/teacher")
    @PreAuthorize("hasRole('TEACHER')")
    @Operation(summary = "Get teacher dashboard statistics")
    public ResponseEntity<DashboardDTO.TeacherDashboardResponse> getTeacherDashboard() {
        return ResponseEntity.ok(dashboardService.getTeacherDashboard());
    }

    @GetMapping("/student")
    @PreAuthorize("hasRole('STUDENT')")
    @Operation(summary = "Get student dashboard statistics")
    public ResponseEntity<DashboardDTO.StudentDashboardResponse> getStudentDashboard() {
        return ResponseEntity.ok(dashboardService.getStudentDashboard());
    }

    @GetMapping("/expert")
    @PreAuthorize("hasRole('EXPERT')")
    @Operation(summary = "Get expert dashboard statistics")
    public ResponseEntity<DashboardDTO.ExpertDashboardResponse> getExpertDashboard() {
        return ResponseEntity.ok(dashboardService.getExpertDashboard());
    }
}
