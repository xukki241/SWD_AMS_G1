package com.ams.service;

import com.ams.dto.AssignmentDTO;
import com.ams.entity.*;
import com.ams.exception.ResourceNotFoundException;
import com.ams.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AssignmentService {

    private final AssignmentRepository assignmentRepository;
    private final AssignmentTemplateRepository templateRepository;
    private final SubjectClassRepository subjectClassRepository;
    private final AssignmentClassRepository assignmentClassRepository;
    private final ClassRegistrationRepository registrationRepository;
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
    public List<AssignmentDTO.AssignmentResponse> getAssignmentsByClass(Long subjectClassId) {
        List<AssignmentClass> list = assignmentClassRepository.findBySubjectClassId(subjectClassId);
        return list.stream()
                .filter(ac -> ac.getAllocationStatus() == AssignmentClass.AllocationStatus.ACTIVE)
                .map(ac -> mapToResponse(ac.getAssignment()))
                .collect(Collectors.toList());
    }

    @Transactional
    public AssignmentDTO.AssignmentResponse createAssignment(AssignmentDTO.CreateAssignmentRequest request) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User teacher = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Teacher not found: " + username));

        AssignmentTemplate template = null;
        if (request.templateId() != null) {
            template = templateRepository.findById(request.templateId()).orElse(null);
        }

        Assignment assignment = Assignment.builder()
                .teacher(teacher)
                .template(template)
                .title(request.title())
                .instructions(request.instructions())
                .dueAt(request.dueAt())
                .maxScore(request.maxScore() != null ? request.maxScore() : BigDecimal.TEN)
                .build();

        assignment = assignmentRepository.save(assignment);

        if (request.subjectClassId() != null) {
            SubjectClass sc = subjectClassRepository.findById(request.subjectClassId())
                    .orElseThrow(() -> new ResourceNotFoundException("SubjectClass not found: " + request.subjectClassId()));
            AssignmentClass ac = AssignmentClass.builder()
                    .assignment(assignment)
                    .subjectClass(sc)
                    .allocationStatus(AssignmentClass.AllocationStatus.ACTIVE)
                    .allocatedAt(LocalDateTime.now())
                    .build();
            assignmentClassRepository.save(ac);
        }

        auditLogService.log("CREATE_ASSIGNMENT", "Assignment", assignment.getTitle());
        return mapToResponse(assignment);
    }

    @Transactional
    public void allocateToClass(AssignmentDTO.AllocateClassRequest request) {
        Assignment assignment = assignmentRepository.findById(request.assignmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Assignment not found with id: " + request.assignmentId()));

        SubjectClass sc = subjectClassRepository.findById(request.subjectClassId())
                .orElseThrow(() -> new ResourceNotFoundException("SubjectClass not found with id: " + request.subjectClassId()));

        AssignmentClass ac = assignmentClassRepository.findByAssignmentIdAndSubjectClassId(assignment.getId(), sc.getId())
                .orElse(AssignmentClass.builder()
                        .assignment(assignment)
                        .subjectClass(sc)
                        .allocatedAt(LocalDateTime.now())
                        .build());

        ac.setAllocationStatus(AssignmentClass.AllocationStatus.ACTIVE);
        ac.setClassNote(request.classNote());
        assignmentClassRepository.save(ac);

        auditLogService.log("ALLOCATE_ASSIGNMENT", "AssignmentClass", assignment.getTitle() + " -> " + sc.getClassCode());
    }

    /**
     * STUDENT "pending work" view (spec 4.4): for each of the student's ACTIVE
     * registrations, list the class's ACTIVE assignments with the student's own
     * work state (NOT_STARTED / DRAFT / SUBMITTED / LATE / GRADED).
     */
    @Transactional(readOnly = true)
    public List<AssignmentDTO.AssignmentOverviewItem> getMyAssignmentsOverview() {
        User student = currentUser();
        List<AssignmentDTO.AssignmentOverviewItem> items = new ArrayList<>();

        for (ClassRegistration reg : registrationRepository.findByStudentId(student.getId())) {
            if (reg.getStatus() != ClassRegistration.RegistrationStatus.ACTIVE) {
                continue;
            }
            SubjectClass sc = reg.getSubjectClass();

            for (AssignmentClass ac : assignmentClassRepository.findBySubjectClassId(sc.getId())) {
                if (ac.getAllocationStatus() != AssignmentClass.AllocationStatus.ACTIVE) {
                    continue;
                }
                Assignment a = ac.getAssignment();

                Submission submission =
                        submissionRepository.findByClassRegistrationIdAndAssignmentId(reg.getId(), a.getId()).orElse(null);
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
                        sc.getId(),
                        sc.getClassCode(),
                        sc.getClassName(),
                        a.getId(),
                        a.getTitle(),
                        a.getInstructions(),
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

    private AssignmentDTO.AssignmentResponse mapToResponse(Assignment a) {
        return new AssignmentDTO.AssignmentResponse(
                a.getId(),
                a.getTeacher().getId(),
                a.getTeacher().getFullName(),
                a.getTemplate() != null ? a.getTemplate().getId() : null,
                a.getTitle(),
                a.getInstructions(),
                a.getDueAt(),
                a.getMaxScore()
        );
    }

    private User currentUser() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));
    }
}
