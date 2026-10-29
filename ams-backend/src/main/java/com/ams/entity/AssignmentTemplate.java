package com.ams.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "assignment_templates", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"subject_id", "title"})
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AssignmentTemplate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subject_id", nullable = false)
    private Subject subject;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "expert_id", nullable = false)
    private User expert;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String instructions;

    @Column(name = "default_due_rule", length = 255)
    private String defaultDueRule;
}
