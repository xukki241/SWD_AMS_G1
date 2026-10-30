package com.ams.dto;

import com.ams.entity.AssignmentEvaluation;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public class EvaluationDTO {

    public record EvaluationResponse(
            Long id,
            Long submissionId,
            Long evaluatorId,
            String evaluatorName,
            BigDecimal score,
            String feedback,
            AssignmentEvaluation.EvaluationStatus evaluationStatus
    ) {}

    // Upper bound on score is the assignment's own maxScore (checked in EvaluationService), so no fixed @DecimalMax.
    public record CreateEvaluationRequest(
            @NotNull Long submissionId,
            @NotNull @DecimalMin("0.0") BigDecimal score,
            String feedback
    ) {}
}
