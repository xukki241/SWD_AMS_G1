package com.ams.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "subject_classes")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SubjectClass {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subject_id", nullable = false)
    private Subject subject;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "expert_id")
    private User expert;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "teacher_id")
    private User teacher;

    @Column(name = "class_code", nullable = false, unique = true, length = 20)
    private String classCode;

    @Column(name = "class_name", nullable = false, length = 255)
    private String className;

    @Column(nullable = false, length = 20)
    private String term;
}
