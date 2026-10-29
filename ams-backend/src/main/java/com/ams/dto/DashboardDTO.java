package com.ams.dto;

import java.math.BigDecimal;

public class DashboardDTO {

    public record AdminDashboardResponse(
            long totalUsers,
            long totalStudents,
            long totalTeachers,
            long totalExperts,
            long totalSubjects,
            long totalClasses,
            long totalRegistrations
    ) {}

    public record TeacherDashboardResponse(
            long totalAssignments,
            long totalClasses,
            long pendingEvaluations,
            long completedEvaluations
    ) {}

    public record StudentDashboardResponse(
            long totalRegistrations,
            long activeClasses,
            long submittedAssignments,
            long gradedAssignments,
            BigDecimal averageScore
    ) {}

    public record ExpertDashboardResponse(
            long totalTemplates,
            long managedClasses
    ) {}
}
