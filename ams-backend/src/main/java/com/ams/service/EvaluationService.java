package com.ams.service;

import com.ams.dto.EvaluationDTO;
import com.ams.entity.Assignment;
import com.ams.entity.AssignmentEvaluation;
import com.ams.entity.Role;
import com.ams.entity.Submission;
import com.ams.entity.User;
import com.ams.exception.BadRequestException;
import com.ams.exception.ResourceNotFoundException;
import com.ams.repository.AssignmentEvaluationRepository;
import com.ams.repository.SubmissionRepository;
import com.ams.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
@Slf4j
public class EvaluationService {

    private final AssignmentEvaluationRepository evaluationRepository;
    private final SubmissionRepository submissionRepository;
    private final UserRepository userRepository;
    private final RoleChecker roleChecker;
    private final AuditLogService auditLogService;
    private final EmailDeliveryService emailDeliveryService;
    private final SubmissionService submissionService;

    @Transactional
    public EvaluationDTO.EvaluationResponse evaluateSubmission(EvaluationDTO.CreateEvaluationRequest request) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User evaluator = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Evaluator not found: " + username));

        Submission submission = submissionRepository.findById(request.submissionId())
                .orElseThrow(() -> new ResourceNotFoundException("Submission not found with id: " + request.submissionId()));

        if (submission.getSubmissionStatus() == Submission.SubmissionStatus.GRADED) {
            throw new BadRequestException("This submission has already been graded and cannot be re-graded");
        }

        Assignment assignment = submission.getAssignment();
        assertEvaluatorAuthorized(evaluator, assignment);
        submissionService.requireLiveGradingClaim(submission, evaluator.getId());

        // Score must be within the assignment's configured maximum (SRS: max_score).
        BigDecimal maxScore = assignment.getMaxScore() == null ? BigDecimal.TEN : assignment.getMaxScore();
        if (request.score() == null || request.score().signum() < 0 || request.score().compareTo(maxScore) > 0) {
            throw new BadRequestException(
                    "Score must be between 0 and the assignment's maximum score (" + maxScore + ")");
        }

        AssignmentEvaluation evaluation = evaluationRepository.findBySubmissionId(submission.getId())
                .orElse(AssignmentEvaluation.builder()
                        .submission(submission)
                        .build());

        validateCriterionScores(assignment, request.score(), request.criteriaScores());

        evaluation.setEvaluator(evaluator);
        evaluation.setScore(request.score());
        evaluation.setFeedback(request.feedback());
        evaluation.setCriteriaScores(request.criteriaScores());
        evaluation.setEvaluationStatus(AssignmentEvaluation.EvaluationStatus.COMPLETED);
        evaluation.setPublished(false);

        evaluation = evaluationRepository.save(evaluation);

        auditLogService.log("EVALUATE_SUBMISSION", "AssignmentEvaluation",
                "SubId:" + submission.getId() + ", Score:" + request.score() + " / " + maxScore);

        return new EvaluationDTO.EvaluationResponse(
                evaluation.getId(),
                submission.getId(),
                evaluator.getId(),
                evaluator.getFullName(),
                evaluation.getScore(),
                evaluation.getFeedback(),
                evaluation.getEvaluationStatus(), evaluation.getAiDraftScore(), evaluation.getAiDraftFeedback(),
                evaluation.getAiDraftCriteria(), evaluation.getCriteriaScores(),
                evaluation.isPublished(), evaluation.getViewedAt()
        );
    }

    @Transactional
    public EvaluationDTO.EvaluationResponse getEvaluationBySubmission(Long submissionId) {
        AssignmentEvaluation eval = evaluationRepository.findBySubmissionId(submissionId)
                .orElseThrow(() -> new ResourceNotFoundException("Evaluation not found for submission id: " + submissionId));

        Submission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new ResourceNotFoundException("Submission not found with id: " + submissionId));
        User current = currentUser();

        boolean isStudentOwner = current.getId().equals(submission.getCourseEnrollment().getStudent().getId());
        boolean isStaff = roleChecker.hasRole(current.getId(),
                Role.RoleName.ADMIN, Role.RoleName.TEACHER);
        if (!isStudentOwner && !isStaff) {
            throw new AccessDeniedException("You can only view evaluations of your own submissions");
        }
        if (isStudentOwner && !eval.isPublished()) {
            throw new AccessDeniedException("This grade has not been published");
        }
        if (isStudentOwner && eval.getViewedAt() == null) {
            eval.setViewedAt(java.time.LocalDateTime.now());
            evaluationRepository.save(eval);
        }

        return new EvaluationDTO.EvaluationResponse(
                eval.getId(),
                eval.getSubmission().getId(),
                eval.getEvaluator() == null ? null : eval.getEvaluator().getId(),
                eval.getEvaluator() == null ? "" : eval.getEvaluator().getFullName(),
                eval.getScore(),
                eval.getFeedback(),
                eval.getEvaluationStatus(), eval.getAiDraftScore(), eval.getAiDraftFeedback(),
                eval.getAiDraftCriteria(), eval.getCriteriaScores(),
                eval.isPublished(), eval.getViewedAt()
        );
    }

    @Transactional
    public EvaluationDTO.EvaluationResponse publishEvaluation(Long submissionId) {
        AssignmentEvaluation evaluation = evaluationRepository.findBySubmissionId(submissionId)
                .orElseThrow(() -> new ResourceNotFoundException("Evaluation not found for submission id: " + submissionId));
        assertEvaluatorAuthorized(currentUser(), evaluation.getSubmission().getAssignment());
        submissionService.requireLiveGradingClaim(evaluation.getSubmission(), currentUser().getId());
        if (evaluation.getScore() == null || evaluation.getEvaluationStatus() != AssignmentEvaluation.EvaluationStatus.COMPLETED) {
            throw new BadRequestException("Grade the submission before publishing it");
        }
        validateCriterionScores(evaluation.getSubmission().getAssignment(), evaluation.getScore(), evaluation.getCriteriaScores());
        evaluation.setPublished(true);
        evaluation = evaluationRepository.save(evaluation);
        Submission submission = evaluation.getSubmission();
        submission.setSubmissionStatus(Submission.SubmissionStatus.GRADED);
        submission.setGradingClaimOwner(null);
        submission.setGradingClaimExpiresAt(null);
        submissionRepository.save(submission);
        try {
            emailDeliveryService.sendGradePublished(
                    submission.getCourseEnrollment().getStudent().getEmail(),
                    submission.getAssignment().getTitle());
        } catch (Exception ex) {
            log.warn("Could not notify student {} about published grade: {}",
                    submission.getCourseEnrollment().getStudent().getId(), ex.getMessage());
        }
        auditLogService.log("PUBLISH_EVALUATION", "AssignmentEvaluation", "Submission:" + submissionId);
        return new EvaluationDTO.EvaluationResponse(evaluation.getId(), submissionId,
                evaluation.getEvaluator() == null ? null : evaluation.getEvaluator().getId(),
                evaluation.getEvaluator() == null ? "" : evaluation.getEvaluator().getFullName(),
                evaluation.getScore(), evaluation.getFeedback(), evaluation.getEvaluationStatus(),
                evaluation.getAiDraftScore(), evaluation.getAiDraftFeedback(), evaluation.getAiDraftCriteria(),
                evaluation.getCriteriaScores(), evaluation.isPublished(), evaluation.getViewedAt());
    }

    private void validateCriterionScores(Assignment assignment, BigDecimal total,
                                         java.util.List<AssignmentEvaluation.CriterionScore> scores) {
        BigDecimal assignmentMax = assignment.getMaxScore() == null ? BigDecimal.TEN : assignment.getMaxScore();
        if (total == null || total.signum() < 0 || total.compareTo(assignmentMax) > 0) {
            throw new BadRequestException("Score must be between 0 and the assignment's maximum score (" + assignmentMax + ")");
        }
        java.util.List<Assignment.RubricCriterion> rubric = assignment.getRubricCriteria();
        if (rubric == null || rubric.isEmpty()) {
            if (scores != null && !scores.isEmpty()) throw new BadRequestException("This assignment has no structured rubric");
            return;
        }
        if (scores == null || scores.size() != rubric.size()) throw new BadRequestException("A score is required for every rubric criterion");
        java.util.Map<String, Assignment.RubricCriterion> expected = new java.util.HashMap<>();
        rubric.forEach(c -> expected.put(c.id(), c));
        java.util.Set<String> seen = new java.util.HashSet<>();
        BigDecimal sum = BigDecimal.ZERO;
        for (AssignmentEvaluation.CriterionScore item : scores) {
            Assignment.RubricCriterion criterion = item == null ? null : expected.get(item.id());
            if (criterion == null || !seen.add(item.id()) || item.score() == null || item.score().signum() < 0
                    || item.score().compareTo(criterion.maxScore()) > 0) {
                throw new BadRequestException("Each rubric criterion needs one valid score within its maximum");
            }
            sum = sum.add(item.score());
        }
        if (sum.subtract(total).abs().compareTo(new BigDecimal("0.01")) > 0) {
            throw new BadRequestException("The total grade must equal the sum of criterion scores");
        }
    }

    /**
     * Grade integrity (NFR RBAC): only the course instructor, or an admin,
     * may grade a submission.
     */
    private void assertEvaluatorAuthorized(User evaluator, Assignment assignment) {
        boolean isCourseInstructor = assignment.getCourse() != null
                && assignment.getCourse().getInstructor() != null
                && evaluator.getId().equals(assignment.getCourse().getInstructor().getId());
        boolean isAssignmentTeacher = assignment.getTeacher() != null
                && evaluator.getId().equals(assignment.getTeacher().getId());
        boolean isAdmin = roleChecker.hasRole(evaluator.getId(), Role.RoleName.ADMIN);
        if (!isCourseInstructor && !isAssignmentTeacher && !isAdmin) {
            throw new AccessDeniedException(
                    "You are not authorized to grade submissions for course " + assignment.getCourse().getCode());
        }
    }

    private User currentUser() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));
    }
}
