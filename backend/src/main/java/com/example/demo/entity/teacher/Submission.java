package com.example.demo.entity.teacher;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "submission")
@Getter
@Setter
@NoArgsConstructor
public class Submission {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // --- Keep primitive fields for backward compatibility ---
    @Column(name = "student_id", nullable = false, insertable = false, updatable = false)
    private Long studentId;

    @Column(name = "test_id", nullable = false, insertable = false, updatable = false)
    private Long testId;

    @Column(name = "question_id", nullable = false, insertable = false, updatable = false)
    private Long questionId;

    // --- Optional: map relationships if you have entities for Student, Test, Question ---
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id")
    private Student student;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "test_id")
    private Test test;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_id")
    private Question question;

    private String language;
    private String filename;

    @Lob
    @Column(columnDefinition = "TEXT")
    private String source;

    @Lob
    @Column(columnDefinition = "TEXT")
    private String stdin;

    private String status; // PENDING, RUNNING, COMPLETED, FAILED

    @Lob
    @Column(name = "compile_output", columnDefinition = "TEXT")
    private String compileOutput;

    private Integer score;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = createdAt;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
