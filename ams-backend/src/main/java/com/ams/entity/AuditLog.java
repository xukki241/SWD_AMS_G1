package com.ams.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.Immutable;

import java.time.LocalDateTime;

/**
 * Immutable audit log – never updated or deleted programmatically.
 * The @Immutable annotation tells Hibernate to skip dirty-checking on this entity.
 */
@Entity
@Immutable
@Table(name = "audit_logs")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Nullable – actor may be deleted or the action may be system-initiated. */
    @Column(name = "actor_id")
    private Long actorId;

    @Column(nullable = false, length = 100)
    private String action;

    @Column(name = "resource_type", nullable = false, length = 50)
    private String resourceType;

    @Column(name = "resource_reference", length = 255)
    private String resourceReference;

    @Column(name = "occurred_at", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime occurredAt = LocalDateTime.now();
}
