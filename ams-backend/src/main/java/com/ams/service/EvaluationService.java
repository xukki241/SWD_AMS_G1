package com.ams.service;

import com.ams.dto.EvaluationDTO;
import com.ams.entity.Assignment;
import com.ams.entity.AssignmentEvaluation;
import com.ams.entity.Role;
import com.ams.entity.SubjectClass;
import com.ams.entity.Submission;
import com.ams.entity.User;
import com.ams.exception.BadRequestException;
import com.ams.exception.ResourceNotFoundException;
import com.ams.repository.AssignmentEvaluationRepository;
import com.ams.repository.SubmissionRepository;
import com.ams.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
public class EvaluationService {

    private final AssignmentEvaluationRepository evaluationRepository;
    private final SubmissionRepository submissionRepository;
    private final UserRepository userRepository;
    private final RoleChecker roleChecker;
    private final AuditLogService auditLogService;

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
        SubjectClass subjectClass = submission.getClassRegistration().getSubjectClass();
        assertEvaluatorAuthorized(evaluator, assignment, subjectClass);

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

        evaluation.setEvaluator(evaluator);
        evaluation.setScore(request.score());
        evaluation.setFeedback(request.feedback());
        evaluation.setEvaluationStatus(AssignmentEvaluation.EvaluationStatus.COMPLETED);

        evaluation = evaluationRepository.save(evaluation);

        submission.setSubmissionStatus(Submission.SubmissionStatus.GRADED);
        submissionRepository.save(submission);

        auditLogService.log("EVALUATE_SUBMISSION", "AssignmentEvaluation",
                "SubId:" + submission.getId() + ", Score:" + request.score() + " / " + maxScore);

        return new EvaluationDTO.EvaluationResponse(
                evaluation.getId(),
                submission.getId(),
                evaluator.getId(),
                evaluator.getFullName(),
                evaluation.getScore(),
                evaluation.getFeedback(),
                evaluation.getEvaluationStatus()
        );
    }

    @Transactional(readOnly = true)
    public EvaluationDTO.EvaluationResponse getEvaluationBySubmission(Long submissionId) {
        AssignmentEvaluation eval = evaluationRepository.findBySubmissionId(submissionId)
                .orElseThrow(() -> new ResourceNotFoundException("Evaluation not found for submission id: " + submissionId));

        Submission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new ResourceNotFoundException("Submission not found with id: " + submissionId));
        User current = currentUser();

        boolean isStudentOwner = current.getId().equals(submission.getClassRegistration().getStudent().getId());
        boolean isStaff = roleChecker.hasRole(current.getId(),
                Role.RoleName.ADMIN, Role.RoleName.TEACHER, Role.RoleName.EXPERT);
        if (!isStudentOwner && !isStaff) {
            throw new AccessDeniedException("You can only view evaluations of your own submissions");
        }

        return new EvaluationDTO.EvaluationResponse(
                eval.getId(),
                eval.getSubmission().getId(),
                eval.getEvaluator().getId(),
                eval.getEvaluator().getFullName(),
                eval.getScore(),
                eval.getFeedback(),
                eval.getEvaluationStatus()
        );
    }

    /**
     * Grade integrity (NFR RBAC): only the assignment's teacher, the class's expert,
     * or an admin may grade a submission.
     */
    private void assertEvaluatorAuthorized(User evaluator, Assignment assignment, SubjectClass subjectClass) {
        boolean isAssignmentTeacher = assignment.getTeacher() != null
                && evaluator.getId().equals(assignment.getTeacher().getId());
        boolean isClassExpert = subjectClass.getExpert() != null
                && evaluator.getId().equals(subjectClass.getExpert().getId());
        boolean isAdmin = roleChecker.hasRole(evaluator.getId(), Role.RoleName.ADMIN);
        if (!isAssignmentTeacher && !isClassExpert && !isAdmin) {
            throw new AccessDeniedException(
                    "You are not authorized to grade submissions in class " + subjectClass.getClassCode());
        }
    }

    private User currentUser() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));
    }
}
