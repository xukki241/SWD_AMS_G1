package com.ams.repository;

import com.ams.entity.AssignmentClass;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AssignmentClassRepository extends JpaRepository<AssignmentClass, Long> {
    List<AssignmentClass> findBySubjectClassId(Long subjectClassId);
    List<AssignmentClass> findByAssignmentId(Long assignmentId);
    Optional<AssignmentClass> findByAssignmentIdAndSubjectClassId(Long assignmentId, Long subjectClassId);
}
