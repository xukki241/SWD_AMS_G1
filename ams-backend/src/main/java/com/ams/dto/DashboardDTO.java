package com.ams.dto;

import java.math.BigDecimal;

public class DashboardDTO {

    public record AdminDashboardResponse(
            long totalUsers,
            long totalStudents,
            long totalTeachers,
            long totalSubjects,
            long totalCourses,
            long totalEnrollments
    ) {}

    public record TeacherDashboardResponse(
            long totalAssignments,
            long totalCourses,
            long pendingEvaluations,
            long completedEvaluations
    ) {}

    public record StudentDashboardResponse(
            long totalEnrollments,
            long activeCourses,
            long submittedAssignments,
            long gradedAssignments,
            BigDecimal averageScore
    ) {}
}
