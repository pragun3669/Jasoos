package com.example.demo.dto;

import java.util.ArrayList;
import java.util.List;

public class CreateTestDTO {

    private String title;
    private Integer duration;
    private Long createdBy; // Teacher ID
    private List<QuestionDTO> questions = new ArrayList<>();

    public CreateTestDTO() {}

    public CreateTestDTO(String title, Integer duration, Long createdBy, List<QuestionDTO> questions) {
        this.title = title;
        this.duration = duration;
        this.createdBy = createdBy;
        this.questions = questions != null ? questions : new ArrayList<>();
    }

    public static class QuestionDTO {
        public String description;
        public Integer marks;
        public List<TestCaseDTO> testCases = new ArrayList<>();

        public QuestionDTO() {}

        public QuestionDTO(String description, Integer marks, List<TestCaseDTO> testCases) {
            this.description = description;
            this.marks = marks;
            this.testCases = testCases != null ? testCases : new ArrayList<>();
        }
    }

    public static class TestCaseDTO {
        public String inputData;
        public String expectedOutput;
        public boolean exampleCase;

        public TestCaseDTO() {}

        public TestCaseDTO(String inputData, String expectedOutput, boolean exampleCase) {
            this.inputData = inputData;
            this.expectedOutput = expectedOutput;
            this.exampleCase = exampleCase;
        }
    }

    // Getters and Setters
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public Integer getDuration() { return duration; }
    public void setDuration(Integer duration) { this.duration = duration; }

    public Long getCreatedBy() { return createdBy; }
    public void setCreatedBy(Long createdBy) { this.createdBy = createdBy; }

    public List<QuestionDTO> getQuestions() { return questions; }
    public void setQuestions(List<QuestionDTO> questions) { 
        this.questions = questions != null ? questions : new ArrayList<>(); 
    }
}
