package com.example.demo.dto;

import lombok.Data;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data // Includes @Getter, @Setter, @ToString, @EqualsAndHashCode, @RequiredArgsConstructor
@NoArgsConstructor // Needed for JSON deserialization
public class CreateTestDTO {

    public String title;

    public Integer duration;

    public Long createdBy; // Teacher ID

    public List<QuestionDTO> questions = new ArrayList<>();

    /**
     * DTO for a question within a test.
     */
    @Data
    @NoArgsConstructor
    public static class QuestionDTO {
        public String description;

        public Integer marks;

        // Optional fields for dynamic time limit calculation
        public Long maxInputSize;
        public String complexity;
        public Double baseTimeLimit;

        public List<TestCaseDTO> testCases = new ArrayList<>();
    }

    /**
     * DTO for a test case within a question.
     */
    @Data
    @NoArgsConstructor
    public static class TestCaseDTO {
        // Input can be empty, so no @NotBlank
        public String inputData;

        // Expected output can also be empty
        public String expectedOutput;

        // boolean primitives are false by default, which is a safe default.
        public boolean exampleCase;
    }
}