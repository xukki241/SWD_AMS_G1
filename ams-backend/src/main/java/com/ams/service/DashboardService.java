package com.ams.service;

import com.ams.dto.DashboardDTO;
import com.ams.entity.CourseEnrollment;
import com.ams.entity.Role;
import com.ams.entity.Submission;
import com.ams.entity.User;
import com.ams.exception.ResourceNotFoundException;
import com.ams.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final UserRoleRepository userRoleRepository;
    private final SubjectRepository subjectRepository;
    private final CourseRepository courseRepository;
    private final CourseEnrollmentRepository enrollmentRepository;
    private final AssignmentRepository assignmentRepository;
    private final AssignmentTemplateRepository templateRepository;
    private final SubmissionRepository submissionRepository;
    private final AssignmentEvaluationRepository evaluationRepository;

    @Transactional(readOnly = true)
    public DashboardDTO.AdminDashboardResponse getAdminDashboard() {
        long totalUsers = userRepository.count();
        long totalStudents = countByRole(Role.RoleName.STUDENT);
        long totalTeachers = countByRole(Role.RoleName.TEACHER);
        long totalExperts = countByRole(Role.RoleName.EXPERT);
        long totalSubjects = subjectRepository.count();
        long totalCourses = courseRepository.findByDeletedFalse().size();
        long totalEnrollments = enrollmentRepository.count();

        return new DashboardDTO.AdminDashboardResponse(
                totalUsers, totalStudents, totalTeachers, totalExperts, totalSubjects, totalCourses, totalEnrollments
        );
    }

    @Transactional(readOnly = true)
    public DashboardDTO.TeacherDashboardResponse getTeacherDashboard() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User teacher = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Teacher not found: " + username));

        long totalAssignments = assignmentRepository.findByTeacherId(teacher.getId()).size();
        long totalCourses = courseRepository.findByDeletedFalse().stream()
                .filter(c -> c.getInstructor() != null && c.getInstructor().getId().equals(teacher.getId()))
                .count();

        long completedEvals = evaluationRepository.count();
        long totalSubmissions = submissionRepository.count();
        long pendingEvals = Math.max(0, totalSubmissions - completedEvals);

        return new DashboardDTO.TeacherDashboardResponse(
                totalAssignments, totalCourses, pendingEvals, completedEvals
        );
    }

    @Transactional(readOnly = true)
    public DashboardDTO.StudentDashboardResponse getStudentDashboard() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User student = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found: " + username));

        List<CourseEnrollment> enrollments = enrollmentRepository.findByStudentId(student.getId());
        long totalEnrollments = enrollments.size();
        long activeCourses = enrollments.stream()
                .filter(e -> e.getStatus() == CourseEnrollment.EnrollmentStatus.ACTIVE
                        || e.getStatus() == CourseEnrollment.EnrollmentStatus.COMPLETED)
                .count();

        List<Submission> submissions = enrollments.stream()
                .flatMap(e -> submissionRepository.findByCourseEnrollmentId(e.getId()).stream())
                .toList();

        long submitted = submissions.size();
        long graded = submissions.stream().filter(s -> s.getSubmissionStatus() == Submission.SubmissionStatus.GRADED).count();

        // Real average score across the student's completed evaluations (no hardcoded KPIs).
        List<BigDecimal> scores = submissions.stream()
                .filter(s -> s.getSubmissionStatus() == Submission.SubmissionStatus.GRADED)
                .flatMap(s -> evaluationRepository.findBySubmissionId(s.getId()).stream())
                .map(e -> e.getScore())
                .filter(java.util.Objects::nonNull)
                .toList();
        BigDecimal averageScore = scores.isEmpty()
                ? BigDecimal.ZERO
                : scores.stream().reduce(BigDecimal.ZERO, BigDecimal::add)
                        .divide(BigDecimal.valueOf(scores.size()), 2, RoundingMode.HALF_UP);

        return new DashboardDTO.StudentDashboardResponse(
                totalEnrollments, activeCourses, submitted, graded, averageScore
        );
    }

    @Transactional(readOnly = true)
    public DashboardDTO.ExpertDashboardResponse getExpertDashboard() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User expert = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Expert not found: " + username));

        long totalTemplates = templateRepository.findByExpertId(expert.getId()).size();
        long publishedCourses = courseRepository.findByDeletedFalse().stream()
                .filter(c -> c.getStatus() == com.ams.entity.Course.Status.PUBLISHED)
                .count();

        return new DashboardDTO.ExpertDashboardResponse(totalTemplates, publishedCourses);
    }

    private long countByRole(Role.RoleName roleName) {
        return roleRepository.findByRoleName(roleName)
                .map(r -> userRoleRepository.findAll().stream()
                        .filter(ur -> ur.getRole().getId().equals(r.getId()) && ur.getAssignmentStatus() == com.ams.entity.UserRole.AssignmentStatus.ACTIVE)
                        .count())
                .orElse(0L);
    }
}
