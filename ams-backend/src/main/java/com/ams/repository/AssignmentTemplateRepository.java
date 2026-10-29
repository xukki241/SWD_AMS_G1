package com.ams.repository;

import com.ams.entity.AssignmentTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AssignmentTemplateRepository extends JpaRepository<AssignmentTemplate, Long> {
    List<AssignmentTemplate> findBySubjectId(Long subjectId);
    List<AssignmentTemplate> findByExpertId(Long expertId);
}
