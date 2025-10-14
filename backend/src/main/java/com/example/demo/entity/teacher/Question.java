package com.example.demo.entity.teacher;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Setter
@Getter
@NoArgsConstructor // Add NoArgsConstructor for JPA
@Entity
@Table(name = "questions")
public class Question {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Lob
    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private Integer marks;

    // Fields for dynamic time limit calculation
    private Long maxInputSize;      // e.g., 100000
    private String complexity;      // e.g., "O(N)", "O(NlogN)"
    private Double baseTimeLimit;   // in seconds, e.g., 1.0

    // ✅ The new field to store the calculated time limit
    private Double timeLimitSec;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "test_id", nullable = false)
    @JsonBackReference
    private Test test;

    @OneToMany(mappedBy = "question", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @JsonManagedReference
    private List<TestCase> testCases = new ArrayList<>();

    public Question(String description, Integer marks, Test test) {
        this.description = description;
        this.marks = marks;
        this.test = test;
    }

    // Helper methods for bidirectional sync
    public void addTestCase(TestCase testCase) {
        this.testCases.add(testCase);
        testCase.setQuestion(this);
    }

    public void removeTestCase(TestCase testCase) {
        this.testCases.remove(testCase);
        testCase.setQuestion(null);
    }
}