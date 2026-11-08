package com.ams.repository;

import com.ams.entity.Submission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.time.LocalDateTime;

@Repository
public interface SubmissionRepository extends JpaRepository<Submission, Long> {
    List<Submission> findByAssignmentId(Long assignmentId);
    List<Submission> findByCourseEnrollmentId(Long courseEnrollmentId);
    Optional<Submission> findByCourseEnrollmentIdAndAssignmentId(Long courseEnrollmentId, Long assignmentId);

    @Modifying
    @Query("update Submission s set s.gradingClaimOwner = :owner, s.gradingClaimExpiresAt = :expiresAt " +
            "where s.id = :id and s.submissionStatus <> :graded " +
            "and (s.gradingClaimOwner is null or s.gradingClaimExpiresAt is null or s.gradingClaimExpiresAt <= :now or s.gradingClaimOwner = :owner)")
    int acquireGradingClaim(@Param("id") Long id, @Param("owner") Long owner,
                            @Param("now") LocalDateTime now, @Param("expiresAt") LocalDateTime expiresAt,
                            @Param("graded") Submission.SubmissionStatus graded);

    @Modifying
    @Query("update Submission s set s.gradingClaimExpiresAt = :expiresAt " +
            "where s.id = :id and s.gradingClaimOwner = :owner and s.gradingClaimExpiresAt > :now")
    int renewGradingClaim(@Param("id") Long id, @Param("owner") Long owner,
                          @Param("now") LocalDateTime now, @Param("expiresAt") LocalDateTime expiresAt);

    @Modifying
    @Query("update Submission s set s.gradingClaimOwner = null, s.gradingClaimExpiresAt = null " +
            "where s.id = :id and s.gradingClaimOwner = :owner")
    int releaseGradingClaim(@Param("id") Long id, @Param("owner") Long owner);
}
