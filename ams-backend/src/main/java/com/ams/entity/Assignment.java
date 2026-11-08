package com.ams.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "assignments")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Assignment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Course this assignment belongs to (the course-centric model). */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "course_id", nullable = false)
    private Course course;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "teacher_id", nullable = false)
    private User teacher;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "template_id")
    private AssignmentTemplate template;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String instructions;

    @Column(columnDefinition = "TEXT")
    private String rubric;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "rubric_criteria", columnDefinition = "jsonb")
    private List<RubricCriterion> rubricCriteria;

    /** Optional classwork topic for GC-style grouping (e.g. "Đồ án môn học"). */
    @Column(length = 120)
    private String topic;

    @Column(name = "due_at", nullable = false)
    private LocalDateTime dueAt;

    @Column(name = "max_score", nullable = false, precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal maxScore = BigDecimal.TEN;

    /** Optional instructor handout / brief uploaded to Cloudinary (or local fallback). */
    @Column(name = "attachment_url", length = 1000)
    private String attachmentUrl;

    @Column(name = "attachment_metadata", columnDefinition = "TEXT")
    private String attachmentMetadata;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private Status status = Status.PUBLISHED;

    public enum Status { DRAFT, PUBLISHED }

    public record RubricCriterion(String id, String name, String description, BigDecimal maxScore) {}
}
