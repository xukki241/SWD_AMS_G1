package com.ams.service;

import com.ams.dto.AssignmentDTO;
import com.ams.entity.*;
import com.ams.exception.ResourceNotFoundException;
import com.ams.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AssignmentService {

    private final AssignmentRepository assignmentRepository;
    private final AssignmentTemplateRepository templateRepository;
    private final CourseRepository courseRepository;
    private final CourseEnrollmentRepository enrollmentRepository;
    private final SubmissionRepository submissionRepository;
    private final AssignmentEvaluationRepository evaluationRepository;
    private final UserRepository userRepository;
    private final AuditLogService auditLogService;

    @Transactional(readOnly = true)
    public List<AssignmentDTO.AssignmentResponse> getAllAssignments() {
        return assignmentRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public AssignmentDTO.AssignmentResponse getAssignmentById(Long id) {
        Assignment a = assignmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Assignment not found with id: " + id));
        return mapToResponse(a);
    }

    @Transactional(readOnly = true)
    public List<AssignmentDTO.AssignmentResponse> getAssignmentsByCourse(Long courseId) {
        return assignmentRepository.findByCourseIdOrderByDueAtAsc(courseId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public AssignmentDTO.AssignmentResponse createAssignment(Long courseId, AssignmentDTO.CreateAssignmentRequest request) {
        User teacher = currentUser();

        Course course = courseRepository.findById(courseId)
                .filter(c -> !c.isDeleted())
                .orElseThrow(() -> new ResourceNotFoundException("Course not found with id: " + courseId));

        boolean isAdmin = SecurityContextHolder.getContext().getAuthentication()
                .getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        if (!isAdmin && (course.getInstructor() == null || !course.getInstructor().getId().equals(teacher.getId()))) {
            throw new AccessDeniedException("Only the course instructor can add assignments to this course");
        }

        AssignmentTemplate template = null;
        if (request.templateId() != null) {
            template = templateRepository.findById(request.templateId()).orElse(null);
        }

        Assignment assignment = Assignment.builder()
                .course(course)
                .teacher(teacher)
                .template(template)
                .title(request.title())
                .instructions(request.instructions())
                .topic(blankToNull(request.topic()))
                .dueAt(request.dueAt())
                .maxScore(request.maxScore() != null ? request.maxScore() : BigDecimal.TEN)
                .build();

        assignment = assignmentRepository.save(assignment);
        auditLogService.log("CREATE_ASSIGNMENT", "Assignment", assignment.getTitle());
        return mapToResponse(assignment);
    }

    /**
     * STUDENT "pending work" view: for each of the student's non-cancelled
     * enrollments, list the course's assignments with the student's own work
     * state (NOT_STARTED / DRAFT / SUBMITTED / LATE / GRADED).
     */
    @Transactional(readOnly = true)
    public List<AssignmentDTO.AssignmentOverviewItem> getMyAssignmentsOverview() {
        User student = currentUser();
        List<AssignmentDTO.AssignmentOverviewItem> items = new ArrayList<>();

        for (CourseEnrollment enrollment : enrollmentRepository.findByStudentId(student.getId())) {
            if (enrollment.getStatus() == CourseEnrollment.EnrollmentStatus.CANCELLED) {
                continue;
            }
            Course course = enrollment.getCourse();

            for (Assignment a : assignmentRepository.findByCourseIdOrderByDueAtAsc(course.getId())) {
                Submission submission = submissionRepository
                        .findByCourseEnrollmentIdAndAssignmentId(enrollment.getId(), a.getId())
                        .orElse(null);

                String workState = "NOT_STARTED";
                Long submissionId = null;
                BigDecimal score = null;

                if (submission != null) {
                    workState = submission.getSubmissionStatus().name();
                    submissionId = submission.getId();
                    AssignmentEvaluation eval =
                            evaluationRepository.findBySubmissionId(submission.getId()).orElse(null);
                    if (eval != null && eval.getScore() != null) {
                        score = eval.getScore();
                    }
                }

                items.add(new AssignmentDTO.AssignmentOverviewItem(
                        course.getId(),
                        course.getCode(),
                        course.getTitle(),
                        enrollment.getId(),
                        a.getId(),
                        a.getTitle(),
                        a.getInstructions(),
                        a.getTopic(),
                        a.getDueAt(),
                        a.getMaxScore(),
                        workState,
                        submissionId,
                        score
                ));
            }
        }
        return items;
    }

    @Transactional
    public AssignmentDTO.AssignmentResponse updateAssignment(Long id, AssignmentDTO.UpdateAssignmentRequest request) {
        Assignment assignment = assignmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Assignment not found with id: " + id));
        requireOwningTeacher(assignment);

        if (request.title() != null && !request.title().isBlank()) {
            assignment.setTitle(request.title().trim());
        }
        if (request.instructions() != null) {
            assignment.setInstructions(request.instructions());
        }
        if (request.topic() != null) {
            assignment.setTopic(blankToNull(request.topic()));
        }
        if (request.dueAt() != null) {
            assignment.setDueAt(request.dueAt());
        }
        if (request.maxScore() != null) {
            assignment.setMaxScore(request.maxScore());
        }

        assignment = assignmentRepository.save(assignment);
        auditLogService.log("UPDATE_ASSIGNMENT", "Assignment", assignment.getTitle());
        return mapToResponse(assignment);
    }

    @Transactional
    public void deleteAssignment(Long id) {
        Assignment assignment = assignmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Assignment not found with id: " + id));
        requireOwningTeacher(assignment);
        assignmentRepository.delete(assignment);
        auditLogService.log("DELETE_ASSIGNMENT", "Assignment", assignment.getTitle());
    }

    private void requireOwningTeacher(Assignment assignment) {
        User user = currentUser();
        boolean isAdmin = SecurityContextHolder.getContext().getAuthentication()
                .getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        if (!isAdmin && (assignment.getTeacher() == null || !user.getId().equals(assignment.getTeacher().getId()))) {
            throw new AccessDeniedException("Only the assignment owner can modify this assignment");
        }
    }

    private AssignmentDTO.AssignmentResponse mapToResponse(Assignment a) {
        Course course = a.getCourse();
        return new AssignmentDTO.AssignmentResponse(
                a.getId(),
                course.getId(),
                course.getCode(),
                course.getTitle(),
                a.getTeacher().getId(),
                a.getTeacher().getFullName(),
                a.getTemplate() != null ? a.getTemplate().getId() : null,
                a.getTitle(),
                a.getInstructions(),
                a.getTopic(),
                a.getDueAt(),
                a.getMaxScore()
        );
    }

    private static String blankToNull(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private User currentUser() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));
    }
}
