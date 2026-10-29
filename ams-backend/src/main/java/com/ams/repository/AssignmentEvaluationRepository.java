package com.ams.repository;

import com.ams.entity.AssignmentEvaluation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AssignmentEvaluationRepository extends JpaRepository<AssignmentEvaluation, Long> {
    Optional<AssignmentEvaluation> findBySubmissionId(Long submissionId);
}
