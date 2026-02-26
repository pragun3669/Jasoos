
package com.example.demo.entity.teacher;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "last_run_code",
       uniqueConstraints = @UniqueConstraint(columnNames = {"student_id", "test_id", "question_id"}))
@Getter
@Setter
@NoArgsConstructor
public class LastRunCode {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "student_id", nullable = false)
    private Long studentId;

    @Column(name = "test_id", nullable = false)
    private Long testId;

    @Column(name = "question_id", nullable = false)
    private Long questionId;

    private String language;

    
    @Column(columnDefinition = "TEXT")
    private String code;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
