package com.ams.service;

import com.ams.dto.AiGradingDTO;
import com.ams.entity.Assignment;
import com.ams.entity.AssignmentEvaluation;
import com.ams.entity.Submission;
import com.ams.exception.BadRequestException;
import com.ams.repository.AssignmentEvaluationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class AiDraftPersistenceService {
    private final SubmissionService submissionService;
    private final AssignmentEvaluationRepository evaluationRepository;

    @Transactional
    public void saveDraft(Long submissionId, Long ownerId, AiGradingDTO.AiGradeResponse draft) {
        Submission submission = submissionService.getAuthorizedSubmission(submissionId);
        submissionService.requireLiveGradingClaim(submission, ownerId);
        Assignment assignment = submission.getAssignment();
        validateAgainstCurrentRubric(assignment, draft);

        AssignmentEvaluation evaluation = evaluationRepository.findBySubmissionId(submissionId)
                .orElseGet(() -> AssignmentEvaluation.builder().submission(submission).build());
        evaluation.setAiDraftScore(draft.totalScore());
        evaluation.setAiDraftFeedback(draft.feedback());
        evaluation.setAiDraftCriteria(draft.criteria().stream()
                .map(c -> new AssignmentEvaluation.CriterionScore(c.id(), c.score(), c.feedback())).toList());
        evaluationRepository.save(evaluation);
    }

    private void validateAgainstCurrentRubric(Assignment assignment, AiGradingDTO.AiGradeResponse draft) {
        Map<String, Assignment.RubricCriterion> expected = new HashMap<>();
        if (assignment.getRubricCriteria() != null) {
            assignment.getRubricCriteria().forEach(c -> expected.put(c.id(), c));
        }
        Set<String> seen = new HashSet<>();
        BigDecimal sum = BigDecimal.ZERO;
        for (AiGradingDTO.AiCriterionScore item : draft.criteria()) {
            Assignment.RubricCriterion criterion = expected.get(item.id());
            if (criterion == null || !seen.add(item.id()) || item.score() == null || item.score().signum() < 0
                    || item.score().compareTo(criterion.maxScore()) > 0) {
                throw new BadRequestException("Rubric changed while Gemini was grading. Generate the draft again");
            }
            sum = sum.add(item.score());
        }
        BigDecimal max = assignment.getMaxScore() == null ? BigDecimal.TEN : assignment.getMaxScore();
        if (seen.size() != expected.size() || draft.totalScore() == null || draft.totalScore().signum() < 0
                || draft.totalScore().compareTo(max) > 0
                || draft.totalScore().subtract(sum).abs().compareTo(new BigDecimal("0.01")) > 0) {
            throw new BadRequestException("Rubric changed while Gemini was grading. Generate the draft again");
        }
    }
}
