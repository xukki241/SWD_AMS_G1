package com.ams.repository;

import com.ams.entity.Module;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ModuleRepository extends JpaRepository<Module, Long> {

    List<Module> findByCourseIdOrderByOrderIndexAsc(Long courseId);

    Optional<Module> findByIdAndCourseId(Long id, Long courseId);

    long countByCourseId(Long courseId);

    @Query("SELECT COALESCE(MAX(m.orderIndex), -1) FROM Module m WHERE m.course.id = :courseId")
    int findMaxOrderIndex(@Param("courseId") Long courseId);
}
