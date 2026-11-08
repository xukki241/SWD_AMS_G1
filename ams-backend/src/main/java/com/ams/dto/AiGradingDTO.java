package com.ams.dto;

import com.ams.entity.AssignmentEvaluation;
import jakarta.validation.constraints.NotEmpty;

import java.math.BigDecimal;
import java.util.List;

public class AiGradingDTO {
    public record AiCriterionScore(String id, BigDecimal score, String feedback) {}

    public record AiGradeResponse(Long submissionId, BigDecimal totalScore, String feedback,
                                  List<AiCriterionScore> criteria) {}

    public record BatchRequest(@NotEmpty List<Long> submissionIds) {}

    public record BatchItemResult(Long submissionId, String status, String message) {}

    public record BatchResponse(List<BatchItemResult> results) {}
}
