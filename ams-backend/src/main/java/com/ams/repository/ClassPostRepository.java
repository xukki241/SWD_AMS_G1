package com.ams.repository;

import com.ams.entity.ClassPost;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ClassPostRepository extends JpaRepository<ClassPost, Long> {
    List<ClassPost> findBySubjectClassIdOrderByCreatedAtDesc(Long subjectClassId);
}
