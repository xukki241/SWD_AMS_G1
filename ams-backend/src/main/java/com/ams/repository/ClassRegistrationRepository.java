package com.ams.repository;

import com.ams.entity.ClassRegistration;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ClassRegistrationRepository extends JpaRepository<ClassRegistration, Long> {
    List<ClassRegistration> findByStudentId(Long studentId);
    List<ClassRegistration> findBySubjectClassId(Long subjectClassId);
    Optional<ClassRegistration> findByRegistrationReference(String registrationReference);
    Optional<ClassRegistration> findByStudentIdAndSubjectClassId(Long studentId, Long subjectClassId);
    boolean existsByStudentIdAndSubjectClassId(Long studentId, Long subjectClassId);
}
