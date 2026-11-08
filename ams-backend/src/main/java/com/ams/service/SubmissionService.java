package com.ams.service;

import com.ams.dto.EvaluationDTO;
import com.ams.dto.SubmissionDTO;
import com.ams.entity.Assignment;
import com.ams.entity.AssignmentEvaluation;
import com.ams.entity.CourseEnrollment;
import com.ams.entity.Submission;
import com.ams.entity.User;
import com.ams.exception.BadRequestException;
import com.ams.exception.ResourceNotFoundException;
import com.ams.repository.AssignmentEvaluationRepository;
import com.ams.repository.AssignmentRepository;
import com.ams.repository.CourseEnrollmentRepository;
import com.ams.repository.SubmissionRepository;
import com.ams.repository.UserRepository;
import com.ams.service.ai.AiClient;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
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
    private final CourseEnrollmentRepository enrollmentRepository;
    private final AssignmentRepository assignmentRepository;
    private final AssignmentEvaluationRepository evaluationRepository;
    private final UserRepository userRepository;
    private final FileUploadService fileUploadService;
    private final AuditLogService auditLogService;
    private final AiClient aiClient;
    private final ObjectMapper objectMapper;

    @Transactional
    public SubmissionDTO.SubmissionResponse submitAssignment(Long enrollmentId, Long assignmentId, MultipartFile file, String answerText) throws IOException {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User student = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found: " + username));

        CourseEnrollment enrollment = enrollmentRepository.findById(enrollmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Enrollment not found: " + enrollmentId));

        if (!enrollment.getStudent().getId().equals(student.getId())) {
            throw new BadRequestException("You can only submit for your own enrollment");
        }

        if (enrollment.getStatus() != CourseEnrollment.EnrollmentStatus.ACTIVE
                && enrollment.getStatus() != CourseEnrollment.EnrollmentStatus.COMPLETED) {
            throw new BadRequestException("Enrollment is not active. Please complete tuition payment first.");
        }

        Assignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Assignment not found: " + assignmentId));
        if (!assignment.getCourse().getId().equals(enrollment.getCourse().getId())) {
            throw new BadRequestException("Assignment does not belong to the enrolled course");
        }
        String cleanAnswer = answerText == null ? null : answerText.trim();
        boolean hasFile = file != null && !file.isEmpty();
        if (!hasFile && (cleanAnswer == null || cleanAnswer.isBlank())) throw new BadRequestException("Attach a file or enter your answer");
        if (hasFile && file.getSize() > 10L * 1024 * 1024) throw new BadRequestException("Submission file must be 10 MB or smaller");
        if (hasFile && !isAllowedSubmissionFile(file)) {
            throw new BadRequestException(
                    "Unsupported submission file type. Allowed: PDF, DOC/DOCX, ZIP, text, or image.");
        }

        if (submissionRepository.findByCourseEnrollmentIdAndAssignmentId(enrollmentId, assignmentId).isPresent()) {
            throw new BadRequestException("A final submission already exists for this assignment");
        }

        String secureUrl = null;
        String metadataJson = null;
        if (hasFile) {
            Map uploadResult = fileUploadService.uploadFile(file, "submissions");
            secureUrl = (String) uploadResult.get("secure_url");
            String format = (String) uploadResult.get("format");
            Long bytes = ((Number) uploadResult.get("bytes")).longValue();
            String name = file.getOriginalFilename() == null ? "submission" : file.getOriginalFilename().replace("\\", "\\\\").replace("\"", "\\\"");
            metadataJson = String.format("{\"originalName\":\"%s\",\"bytes\":%d,\"format\":\"%s\"}", name, bytes, format);
        }

        Submission submission = Submission.builder()
                        .courseEnrollment(enrollment)
                        .assignment(assignment)
                        .build();

        submission.setSubmittedAt(LocalDateTime.now());
        submission.setSecureFileReference(secureUrl);
        submission.setFileMetadata(metadataJson);
        submission.setAnswerText(cleanAnswer);
        submission.setSubmissionStatus(
                LocalDateTime.now().isAfter(assignment.getDueAt()) ? Submission.SubmissionStatus.LATE : Submission.SubmissionStatus.SUBMITTED
        );

        submission = submissionRepository.save(submission);
        if ((cleanAnswer != null && !cleanAnswer.isBlank()) || hasFile) createAiDraft(submission, cleanAnswer, file, hasFile);
        auditLogService.log("SUBMIT_ASSIGNMENT", "Submission", "SubId:" + submission.getId());
        return mapToResponse(submission);
    }

    private void createAiDraft(Submission submission, String answerText, MultipartFile file, boolean hasFile) {
        try {
            Assignment assignment = submission.getAssignment();
            String prompt = "Grade the student's submitted answer as a private draft for the teacher. "
                    + "Return only JSON with numeric score and concise feedback. Do not write or improve the student's answer. "
                    + "Score must be between 0 and maxScore.\nAssignment: " + assignment.getTitle()
                    + "\nInstructions: " + assignment.getInstructions()
                    + "\nRubric: " + assignment.getRubric()
                    + "\nMaximum score: " + assignment.getMaxScore()
                    + "\nStudent answer:\n" + (answerText == null ? "(See attached submitted file.)" : answerText);
            String raw = hasFile
                    ? aiClient.generateWithFile(prompt, file.getContentType(), file.getBytes())
                    : aiClient.generate(prompt);
            JsonNode result = objectMapper.readTree(raw);
            java.math.BigDecimal score = new java.math.BigDecimal(result.path("score").asText());
            if (score.signum() < 0 || score.compareTo(assignment.getMaxScore()) > 0) return;
            AssignmentEvaluation evaluation = evaluationRepository.findBySubmissionId(submission.getId())
                    .orElseGet(() -> AssignmentEvaluation.builder().submission(submission).build());
            evaluation.setAiDraftScore(score);
            evaluation.setAiDraftFeedback(result.path("feedback").asText(""));
            evaluationRepository.save(evaluation);
        } catch (Exception ex) {
            log.warn("AI grading draft failed for submission {}: {}", submission.getId(), ex.getMessage());
        }
    }

    @Transactional(readOnly = true)
    public List<SubmissionDTO.SubmissionResponse> getSubmissionsByAssignment(Long assignmentId) {
        Assignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Assignment not found: " + assignmentId));
        User viewer = userRepository.findByUsername(SecurityContextHolder.getContext().getAuthentication().getName())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        boolean admin = SecurityContextHolder.getContext().getAuthentication().getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        if (!admin && (assignment.getTeacher() == null || !assignment.getTeacher().getId().equals(viewer.getId()))) {
            throw new org.springframework.security.access.AccessDeniedException("Only the assignment teacher can view submissions");
        }
        return submissionRepository.findByAssignmentId(assignmentId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public List<SubmissionDTO.SubmissionResponse> getMySubmissions() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User student = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found: " + username));

        List<CourseEnrollment> enrollments = enrollmentRepository.findByStudentId(student.getId());
        return enrollments.stream()
                .flatMap(enrollment -> submissionRepository.findByCourseEnrollmentId(enrollment.getId()).stream())
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * "Unsubmit": student withdraws a non-graded submission so they can edit and turn in again.
     */
    @Transactional
    public void unsubmit(Long submissionId) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User student = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found: " + username));

        Submission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new ResourceNotFoundException("Submission not found: " + submissionId));

        if (!submission.getCourseEnrollment().getStudent().getId().equals(student.getId())) {
            throw new BadRequestException("You can only unsubmit your own work");
        }
        if (submission.getSubmissionStatus() == Submission.SubmissionStatus.GRADED) {
            throw new BadRequestException("A final submission cannot be withdrawn");
        }
        throw new BadRequestException("A final submission cannot be withdrawn or replaced");
    }

    public SubmissionDTO.SubmissionResponse mapToResponse(Submission s) {
        EvaluationDTO.EvaluationResponse evalDto = null;
        AssignmentEvaluation eval = evaluationRepository.findBySubmissionId(s.getId()).orElse(null);
        if (eval != null) {
            boolean studentView = SecurityContextHolder.getContext().getAuthentication().getAuthorities().stream()
                    .anyMatch(a -> a.getAuthority().equals("ROLE_STUDENT"));
            if (studentView && eval.isPublished() && eval.getViewedAt() == null) {
                eval.setViewedAt(LocalDateTime.now());
                evaluationRepository.save(eval);
            }
            if (studentView && !eval.isPublished()) evalDto = null;
            else {
            evalDto = new EvaluationDTO.EvaluationResponse(
                    eval.getId(),
                    eval.getSubmission().getId(),
                    eval.getEvaluator() == null ? null : eval.getEvaluator().getId(),
                    eval.getEvaluator() == null ? "Gemini (draft)" : eval.getEvaluator().getFullName(),
                    eval.getScore(),
                    eval.getFeedback(),
                    eval.getEvaluationStatus(), eval.getAiDraftScore(), eval.getAiDraftFeedback(), eval.isPublished(), eval.getViewedAt()
            );
            }
        }

        return new SubmissionDTO.SubmissionResponse(
                s.getId(),
                s.getCourseEnrollment().getId(),
                s.getCourseEnrollment().getStudent().getId(),
                s.getCourseEnrollment().getStudent().getFullName(),
                s.getAssignment().getId(),
                s.getAssignment().getTitle(),
                s.getSubmittedAt(),
                s.getSecureFileReference(),
                s.getFileMetadata(),
                s.getSubmissionStatus(),
                evalDto
        );
    }

    private static boolean isAllowedSubmissionFile(MultipartFile file) {
        String contentType = file.getContentType() == null ? "" : file.getContentType().toLowerCase();
        String name = file.getOriginalFilename() == null ? "" : file.getOriginalFilename().toLowerCase();
        if (contentType.equals("application/pdf")
                || contentType.startsWith("text/")
                || contentType.startsWith("image/")
                || contentType.equals("application/zip")
                || contentType.equals("application/x-zip-compressed")
                || contentType.equals("application/msword")
                || contentType.equals("application/vnd.openxmlformats-officedocument.wordprocessingml.document")
                || contentType.equals("application/vnd.openxmlformats-officedocument.presentationml.presentation")
                || contentType.equals("application/octet-stream")) {
            // octet-stream is common for browsers on .docx/.zip — still gate by extension.
            if (!contentType.equals("application/octet-stream")) return true;
        }
        return name.endsWith(".pdf")
                || name.endsWith(".txt")
                || name.endsWith(".md")
                || name.endsWith(".csv")
                || name.endsWith(".png")
                || name.endsWith(".jpg")
                || name.endsWith(".jpeg")
                || name.endsWith(".gif")
                || name.endsWith(".webp")
                || name.endsWith(".zip")
                || name.endsWith(".doc")
                || name.endsWith(".docx")
                || name.endsWith(".ppt")
                || name.endsWith(".pptx");
    }
}
