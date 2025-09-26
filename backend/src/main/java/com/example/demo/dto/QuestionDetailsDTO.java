package com.example.demo.dto;

import java.util.List;

public class QuestionDetailsDTO {
    private Long id;
    private String description;
    private Integer marks;
    private List<TestCaseDetailsDTO> testCases;

    public QuestionDetailsDTO(Long id, String description, Integer marks, List<TestCaseDetailsDTO> testCases) {
        this.id = id;
        this.description = description;
        this.marks = marks;
        this.testCases = testCases;
    }

    // Getters
    public Long getId() { return id; }
    public String getDescription() { return description; }
    public Integer getMarks() { return marks; }
    public List<TestCaseDetailsDTO> getTestCases() { return testCases; }
}
