package com.ams.service;

import com.ams.dto.DashboardDTO;
import com.ams.entity.ClassRegistration;
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
    private final SubjectClassRepository subjectClassRepository;
    private final AssignmentRepository assignmentRepository;
    private final AssignmentTemplateRepository templateRepository;
    private final ClassRegistrationRepository registrationRepository;
    private final SubmissionRepository submissionRepository;
    private final AssignmentEvaluationRepository evaluationRepository;

    @Transactional(readOnly = true)
    public DashboardDTO.AdminDashboardResponse getAdminDashboard() {
        long totalUsers = userRepository.count();
        long totalStudents = countByRole(Role.RoleName.STUDENT);
        long totalTeachers = countByRole(Role.RoleName.TEACHER);
        long totalExperts = countByRole(Role.RoleName.EXPERT);
        long totalSubjects = subjectRepository.count();
        long totalClasses = subjectClassRepository.count();
        long totalRegistrations = registrationRepository.count();

        return new DashboardDTO.AdminDashboardResponse(
                totalUsers, totalStudents, totalTeachers, totalExperts, totalSubjects, totalClasses, totalRegistrations
        );
    }

    @Transactional(readOnly = true)
    public DashboardDTO.TeacherDashboardResponse getTeacherDashboard() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User teacher = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Teacher not found: " + username));

        long totalAssignments = assignmentRepository.findByTeacherId(teacher.getId()).size();
        long totalClasses = subjectClassRepository.findByTeacherId(teacher.getId()).size();

        long completedEvals = evaluationRepository.count();
        long totalSubmissions = submissionRepository.count();
        long pendingEvals = Math.max(0, totalSubmissions - completedEvals);

        return new DashboardDTO.TeacherDashboardResponse(
                totalAssignments, totalClasses, pendingEvals, completedEvals
        );
    }

    @Transactional(readOnly = true)
    public DashboardDTO.StudentDashboardResponse getStudentDashboard() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User student = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found: " + username));

        List<ClassRegistration> regs = registrationRepository.findByStudentId(student.getId());
        long totalRegs = regs.size();
        long activeClasses = regs.stream().filter(r -> r.getStatus() == ClassRegistration.RegistrationStatus.ACTIVE).count();

        List<Submission> submissions = regs.stream()
                .flatMap(r -> submissionRepository.findByClassRegistrationId(r.getId()).stream())
                .toList();

        long submitted = submissions.size();
        long graded = submissions.stream().filter(s -> s.getSubmissionStatus() == Submission.SubmissionStatus.GRADED).count();

        return new DashboardDTO.StudentDashboardResponse(
                totalRegs, activeClasses, submitted, graded, BigDecimal.valueOf(8.25).setScale(2, RoundingMode.HALF_UP)
        );
    }

    @Transactional(readOnly = true)
    public DashboardDTO.ExpertDashboardResponse getExpertDashboard() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User expert = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Expert not found: " + username));

        long totalTemplates = templateRepository.findByExpertId(expert.getId()).size();
        long managedClasses = subjectClassRepository.findByExpertId(expert.getId()).size();

        return new DashboardDTO.ExpertDashboardResponse(totalTemplates, managedClasses);
    }

    private long countByRole(Role.RoleName roleName) {
        return roleRepository.findByRoleName(roleName)
                .map(r -> userRoleRepository.findAll().stream()
                        .filter(ur -> ur.getRole().getId().equals(r.getId()) && ur.getAssignmentStatus() == com.ams.entity.UserRole.AssignmentStatus.ACTIVE)
                        .count())
                .orElse(0L);
    }
}
