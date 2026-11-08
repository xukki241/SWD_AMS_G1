package com.ams.repository;

import com.ams.entity.CourseEnrollment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CourseEnrollmentRepository extends JpaRepository<CourseEnrollment, Long> {

    List<CourseEnrollment> findByStudentId(Long studentId);

    List<CourseEnrollment> findByCourseId(Long courseId);

    Optional<CourseEnrollment> findByIdAndStudentId(Long id, Long studentId);

    Optional<CourseEnrollment> findByCourseIdAndStudentId(Long courseId, Long studentId);

    boolean existsByCourseId(Long courseId);

    long countByCourseIdAndStatus(Long courseId, CourseEnrollment.EnrollmentStatus status);
}
