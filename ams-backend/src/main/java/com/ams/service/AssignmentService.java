package com.ams.service;

import com.ams.dto.AssignmentDTO;
import com.ams.entity.*;
import com.ams.exception.ResourceNotFoundException;
import com.ams.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AssignmentService {

    private final AssignmentRepository assignmentRepository;
    private final AssignmentTemplateRepository templateRepository;
    private final SubjectClassRepository subjectClassRepository;
    private final AssignmentClassRepository assignmentClassRepository;
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

    private AssignmentDTO.AssignmentResponse mapToResponse(Assignment a) {
        return new AssignmentDTO.AssignmentResponse(
                a.getId(),
                a.getTeacher().getId(),
                a.getTeacher().getFullName(),
                a.getTemplate() != null ? a.getTemplate().getId() : null,
                a.getTitle(),
                a.getInstructions(),
                a.getDueAt()
        );
    }
}
