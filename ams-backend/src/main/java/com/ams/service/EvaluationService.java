package com.ams.service;

import com.ams.dto.EvaluationDTO;
import com.ams.entity.AssignmentEvaluation;
import com.ams.entity.Submission;
import com.ams.entity.User;
import com.ams.exception.ResourceNotFoundException;
import com.ams.repository.AssignmentEvaluationRepository;
import com.ams.repository.SubmissionRepository;
import com.ams.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class EvaluationService {

    private final AssignmentEvaluationRepository evaluationRepository;
    private final SubmissionRepository submissionRepository;
    private final UserRepository userRepository;
    private final AuditLogService auditLogService;

    @Transactional
    public EvaluationDTO.EvaluationResponse evaluateSubmission(EvaluationDTO.CreateEvaluationRequest request) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User evaluator = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Evaluator not found: " + username));

        Submission submission = submissionRepository.findById(request.submissionId())
                .orElseThrow(() -> new ResourceNotFoundException("Submission not found with id: " + request.submissionId()));

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

        auditLogService.log("EVALUATE_SUBMISSION", "AssignmentEvaluation", "SubId:" + submission.getId() + ", Score:" + request.score());

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
}
