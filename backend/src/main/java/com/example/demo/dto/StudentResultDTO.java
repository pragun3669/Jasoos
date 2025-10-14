package com.example.demo.dto;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class StudentResultDTO {
    private Long studentId;
    private String name;
    private String email;
    private String batch;   
    private String status;
    private Integer score;
    private Integer totalMarks;
    private LocalDateTime submissionTime;
    private Integer tabSwitchCount;
    private Integer copyPasteAttempts;
    
    private List<QuestionResultDTO> questionResults;

    @Data
    public static class QuestionResultDTO {
        private Long questionId;
        private String questionDescription;
        private Integer questionMarks;
        private Boolean correct;
        private Integer attempts;
        private Integer passedTestCases;
        private Integer totalTestCases;
        private Double earnedPoints;
        
        // NEW: Added for displaying submitted code details
        private String submittedCode;
        private String language;

        private List<TestCaseResultDTO> testCaseResults;
    }

    @Data
    public static class TestCaseResultDTO {
        private Boolean passed;
        private String input;
        private String expectedOutput;
        private String actualOutput;
        private Integer executionTime;
        private String error;
    }
}