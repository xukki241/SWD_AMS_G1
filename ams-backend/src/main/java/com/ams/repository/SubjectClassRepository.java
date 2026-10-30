package com.ams.repository;

import com.ams.entity.SubjectClass;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SubjectClassRepository extends JpaRepository<SubjectClass, Long> {
    Optional<SubjectClass> findByClassCode(String classCode);
    Optional<SubjectClass> findByJoinCode(String joinCode);
    List<SubjectClass> findBySubjectId(Long subjectId);
    List<SubjectClass> findByTeacherId(Long teacherId);
    List<SubjectClass> findByExpertId(Long expertId);
}
