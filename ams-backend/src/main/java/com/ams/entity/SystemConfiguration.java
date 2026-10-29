package com.ams.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "system_configurations")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SystemConfiguration {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "configuration_name", nullable = false, unique = true, length = 100)
    private String configurationName;

    @Column(name = "business_value", columnDefinition = "TEXT")
    private String businessValue;

    @Enumerated(EnumType.STRING)
    @Column(name = "effective_status", nullable = false, length = 20)
    @Builder.Default
    private EffectiveStatus effectiveStatus = EffectiveStatus.ACTIVE;

    @Column(name = "last_reviewed_at")
    private LocalDateTime lastReviewedAt;

    public enum EffectiveStatus {
        ACTIVE, INACTIVE
    }
}
