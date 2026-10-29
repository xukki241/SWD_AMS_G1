package com.ams.repository;

import com.ams.entity.Submission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SubmissionRepository extends JpaRepository<Submission, Long> {
    List<Submission> findByAssignmentId(Long assignmentId);
    List<Submission> findByClassRegistrationId(Long classRegistrationId);
    Optional<Submission> findByClassRegistrationIdAndAssignmentId(Long classRegistrationId, Long assignmentId);
}
