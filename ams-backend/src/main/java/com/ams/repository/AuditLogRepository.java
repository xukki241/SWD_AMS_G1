package com.ams.repository;

import com.ams.entity.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    List<AuditLog> findByActorIdOrderByOccurredAtDesc(Long actorId);
    List<AuditLog> findAllByOrderByOccurredAtDesc();
}
