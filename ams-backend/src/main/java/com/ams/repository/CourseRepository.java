package com.ams.repository;

import com.ams.entity.Course;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CourseRepository extends JpaRepository<Course, Long>, JpaSpecificationExecutor<Course> {

    Optional<Course> findByIdAndDeletedFalse(Long id);

    List<Course> findByDeletedFalse();

    Optional<Course> findByCodeIgnoreCase(String code);

    /** Only non-deleted courses reserve a code, so a soft-deleted course can be recreated. */
    boolean existsByCodeIgnoreCaseAndDeletedFalse(String code);

    boolean existsByCodeIgnoreCaseAndIdNotAndDeletedFalse(String code, Long id);

    /**
     * Any enrollment (including PENDING_PAYMENT / CANCELLED) blocks deletion so
     * students never keep a dangling enrollment to a hidden course.
     */
    @Query(value = "SELECT COUNT(*) > 0 FROM course_enrollments e WHERE e.course_id = :courseId",
            nativeQuery = true)
    boolean hasEnrollments(@Param("courseId") Long courseId);
}
