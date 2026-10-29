package com.ams.service;

import com.ams.dto.EvaluationDTO;
import com.ams.dto.SubmissionDTO;
import com.ams.entity.Assignment;
import com.ams.entity.AssignmentEvaluation;
import com.ams.entity.ClassRegistration;
import com.ams.entity.Submission;
import com.ams.entity.User;
import com.ams.exception.BadRequestException;
import com.ams.exception.ResourceNotFoundException;
import com.ams.repository.AssignmentEvaluationRepository;
import com.ams.repository.AssignmentRepository;
import com.ams.repository.ClassRegistrationRepository;
import com.ams.repository.SubmissionRepository;
import com.ams.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class SubmissionService {

    private final SubmissionRepository submissionRepository;
    private final ClassRegistrationRepository registrationRepository;
    private final AssignmentRepository assignmentRepository;
    private final AssignmentEvaluationRepository evaluationRepository;
    private final UserRepository userRepository;
    private final FileUploadService fileUploadService;
    private final AuditLogService auditLogService;

    @Transactional
    public SubmissionDTO.SubmissionResponse submitAssignment(Long classRegistrationId, Long assignmentId, MultipartFile file) throws IOException {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User student = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found: " + username));

        ClassRegistration registration = registrationRepository.findById(classRegistrationId)
                .orElseThrow(() -> new ResourceNotFoundException("Registration not found: " + classRegistrationId));

        if (!registration.getStudent().getId().equals(student.getId())) {
            throw new BadRequestException("You can only submit for your own registration");
        }

        if (registration.getStatus() != ClassRegistration.RegistrationStatus.ACTIVE) {
            throw new BadRequestException("Registration is not active. Please complete tuition payment first.");
        }

        Assignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Assignment not found: " + assignmentId));

        Map uploadResult = fileUploadService.uploadFile(file, "submissions");
        String secureUrl = (String) uploadResult.get("secure_url");
        String format = (String) uploadResult.get("format");
        Long bytes = ((Number) uploadResult.get("bytes")).longValue();

        String metadataJson = String.format("{\"originalName\":\"%s\",\"bytes\":%d,\"format\":\"%s\"}",
                file.getOriginalFilename(), bytes, format);

        Submission submission = submissionRepository.findByClassRegistrationIdAndAssignmentId(classRegistrationId, assignmentId)
                .orElse(Submission.builder()
                        .classRegistration(registration)
                        .assignment(assignment)
                        .build());

        submission.setSubmittedAt(LocalDateTime.now());
        submission.setSecureFileReference(secureUrl);
        submission.setFileMetadata(metadataJson);
        submission.setSubmissionStatus(
                LocalDateTime.now().isAfter(assignment.getDueAt()) ? Submission.SubmissionStatus.LATE : Submission.SubmissionStatus.SUBMITTED
        );

        submission = submissionRepository.save(submission);
        auditLogService.log("SUBMIT_ASSIGNMENT", "Submission", "SubId:" + submission.getId());
        return mapToResponse(submission);
    }

    @Transactional(readOnly = true)
    public List<SubmissionDTO.SubmissionResponse> getSubmissionsByAssignment(Long assignmentId) {
        return submissionRepository.findByAssignmentId(assignmentId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<SubmissionDTO.SubmissionResponse> getMySubmissions() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User student = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found: " + username));

        List<ClassRegistration> registrations = registrationRepository.findByStudentId(student.getId());
        return registrations.stream()
                .flatMap(reg -> submissionRepository.findByClassRegistrationId(reg.getId()).stream())
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public SubmissionDTO.SubmissionResponse mapToResponse(Submission s) {
        EvaluationDTO.EvaluationResponse evalDto = null;
        AssignmentEvaluation eval = evaluationRepository.findBySubmissionId(s.getId()).orElse(null);
        if (eval != null) {
            evalDto = new EvaluationDTO.EvaluationResponse(
                    eval.getId(),
                    eval.getSubmission().getId(),
                    eval.getEvaluator().getId(),
                    eval.getEvaluator().getFullName(),
                    eval.getScore(),
                    eval.getFeedback(),
                    eval.getEvaluationStatus()
            );
        }

        return new SubmissionDTO.SubmissionResponse(
                s.getId(),
                s.getClassRegistration().getId(),
                s.getClassRegistration().getStudent().getId(),
                s.getClassRegistration().getStudent().getFullName(),
                s.getAssignment().getId(),
                s.getAssignment().getTitle(),
                s.getSubmittedAt(),
                s.getSecureFileReference(),
                s.getFileMetadata(),
                s.getSubmissionStatus(),
                evalDto
        );
    }
}
