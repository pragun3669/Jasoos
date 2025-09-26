package com.example.demo.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;

@Entity
@Table(name = "test_cases")
public class TestCase {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "input_data")
    private String inputData;

    @Column(name = "expected_output")
    private String expectedOutput;

    @Column(name = "example_case")
    private boolean exampleCase;

    @ManyToOne
    @JoinColumn(name = "question_id")
    @JsonBackReference
    private Question question;

    public TestCase() {}

    public TestCase(String inputData, String expectedOutput, boolean exampleCase, Question question) {
        this.inputData = inputData;
        this.expectedOutput = expectedOutput;
        this.exampleCase = exampleCase;
        this.question = question;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getInputData() { return inputData; }
    public void setInputData(String inputData) { this.inputData = inputData; }

    public String getExpectedOutput() { return expectedOutput; }
    public void setExpectedOutput(String expectedOutput) { this.expectedOutput = expectedOutput; }

    public boolean isExampleCase() { return exampleCase; }
    public void setExampleCase(boolean exampleCase) { this.exampleCase = exampleCase; }

    public Question getQuestion() { return question; }
    public void setQuestion(Question question) { this.question = question; }
}
