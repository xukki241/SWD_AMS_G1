package com.ams.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "assignment_classes", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"assignment_id", "subject_class_id"})
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AssignmentClass {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assignment_id", nullable = false)
    private Assignment assignment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subject_class_id", nullable = false)
    private SubjectClass subjectClass;

    @Column(name = "allocated_at", nullable = false)
    @Builder.Default
    private LocalDateTime allocatedAt = LocalDateTime.now();

    @Enumerated(EnumType.STRING)
    @Column(name = "allocation_status", nullable = false, length = 20)
    @Builder.Default
    private AllocationStatus allocationStatus = AllocationStatus.ACTIVE;

    @Column(name = "class_note", columnDefinition = "TEXT")
    private String classNote;

    public enum AllocationStatus {
        ACTIVE, CANCELLED
    }
}
