package com.example.demo.dto;

import lombok.Data;
import com.fasterxml.jackson.annotation.JsonFormat;
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

    // NEW: plagiarism score (0–100)
    private Double plagiarismScore;

    // NEW: detailed plagiarism fields
    private String submittedCode;          // student's final submitted code (combined for all questions or primary code)
    private String aiGeneratedSolution;     // AI-generated answer for similarity comparison
    private String similarStudentCode;      // code of the closest matched student
    private String similaritySource;        // ai | other_student | self | unknown

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime submittedAt;

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

        private String submittedCode;
        private String language;

        private List<TestCaseResultDTO> testCaseResults;

        // NEW — Per-question AI code (optional but useful)
        private String aiGeneratedSolution;

        // NEW — Per-question plagiarism score
        private Double plagiarismScore;

        // NEW — Per-question source of similarity
        private String similaritySource;   // ai | other_student | self | unknown
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
