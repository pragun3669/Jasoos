package com.example.demo.entity.teacher;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDateTime;
import com.fasterxml.jackson.annotation.JsonIgnore;
@Entity
@Table(name = "submission")
@Getter
@Setter
@NoArgsConstructor
public class Submission {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // primitive fields for backward compatibility
    @Column(name = "student_id", nullable = false)
    private Long studentId;

    @Column(name = "test_id", nullable = false)
    private Long testId;

    @Column(name = "question_id", nullable = false)
    private Long questionId;

    // JPA relationships
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", insertable = false, updatable = false)
    @JsonIgnore
    private Student student;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "test_id", insertable = false, updatable = false)
    @JsonIgnore
    private Test test;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_id", insertable = false, updatable = false)
    @JsonIgnore
    private Question question;

    private String language;
    private String filename;

    
    @Column(columnDefinition = "TEXT")
    private String source;

    
    @Column(columnDefinition = "TEXT")
    private String stdin;

    private String status;

    
    @Column(name = "compile_output", columnDefinition = "TEXT")
    private String compileOutput;

    private Integer score;
    // add below: private Integer score;
private Double plagiarismScore;   // 0–100 score for code plagiarism
        
// ADD these fields below plagiarismScore:

@Column(name = "tab_switch_count")
private Integer tabSwitchCount = 0;

@Column(name = "copy_paste_attempts")
private Integer copyPasteAttempts = 0;
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
