package com.ams.service;

import com.ams.entity.AuditLog;
import com.ams.entity.User;
import com.ams.repository.AuditLogRepository;
import com.ams.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;
    private final UserRepository userRepository;

    public void log(String action, String resourceType, String resourceReference) {
        Long actorId = null;
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal())) {
                String username = auth.getName();
                actorId = userRepository.findByUsername(username).map(User::getId).orElse(null);
            }
        } catch (Exception e) {
            log.warn("Could not determine actor for audit log: {}", e.getMessage());
        }

        AuditLog auditLog = AuditLog.builder()
                .actorId(actorId)
                .action(action)
                .resourceType(resourceType)
                .resourceReference(resourceReference)
                .occurredAt(LocalDateTime.now())
                .build();

        auditLogRepository.save(auditLog);
    }

    public List<AuditLog> getAllLogs() {
        return auditLogRepository.findAllByOrderByOccurredAtDesc();
    }
}
