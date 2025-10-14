package com.example.demo.dto;

import java.time.LocalDateTime;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonFormat;

@JsonIgnoreProperties(ignoreUnknown = true)
public class FinalSubmitDTO {
    private String name;
    private String email;
    private String batch;
    private Integer score;
    
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'")
    private LocalDateTime submittedAt;
    
    private Long testId;
    private List<QuestionResultDTO> questionResults;
    private Integer tabSwitchCount;
    private Integer copyPasteAttempts;

    // Getters and Setters
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getBatch() { return batch; }
    public void setBatch(String batch) { this.batch = batch; }

    public Integer getScore() { return score; }
    public void setScore(Integer score) { this.score = score; }

    public LocalDateTime getSubmittedAt() { return submittedAt; }
    public void setSubmittedAt(LocalDateTime submittedAt) { this.submittedAt = submittedAt; }

    public Long getTestId() { return testId; }
    public void setTestId(Long testId) { this.testId = testId; }

    public List<QuestionResultDTO> getQuestionResults() { return questionResults; }
    public void setQuestionResults(List<QuestionResultDTO> questionResults) { 
        this.questionResults = questionResults; 
    }

    public Integer getTabSwitchCount() { return tabSwitchCount; }
    public void setTabSwitchCount(Integer tabSwitchCount) { 
        this.tabSwitchCount = tabSwitchCount; 
    }

    public Integer getCopyPasteAttempts() { return copyPasteAttempts; }
    public void setCopyPasteAttempts(Integer copyPasteAttempts) { 
        this.copyPasteAttempts = copyPasteAttempts; 
    }

    // Nested DTO for question results
    public static class QuestionResultDTO {
        private Long questionId;
        private Boolean correct;
        private Integer attempts;
        private Object output;
        private List<TestCaseResult> results;  // NEW: Detailed test case results

        public Long getQuestionId() { return questionId; }
        public void setQuestionId(Long questionId) { this.questionId = questionId; }

        public Boolean getCorrect() { return correct; }
        public void setCorrect(Boolean correct) { this.correct = correct; }

        public Integer getAttempts() { return attempts; }
        public void setAttempts(Integer attempts) { this.attempts = attempts; }

        public Object getOutput() { return output; }
        public void setOutput(Object output) { this.output = output; }

        public List<TestCaseResult> getResults() { return results; }
        public void setResults(List<TestCaseResult> results) { this.results = results; }
    }

    // NEW: Nested DTO for individual test case results
    public static class TestCaseResult {
        private String status;  // "passed" or "failed"
        private String input;
        private String expectedOutput;
        private String actualOutput;

        public TestCaseResult() {}

        public TestCaseResult(String status, String input, String expectedOutput, String actualOutput) {
            this.status = status;
            this.input = input;
            this.expectedOutput = expectedOutput;
            this.actualOutput = actualOutput;
        }

        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }

        public String getInput() { return input; }
        public void setInput(String input) { this.input = input; }

        public String getExpectedOutput() { return expectedOutput; }
        public void setExpectedOutput(String expectedOutput) { this.expectedOutput = expectedOutput; }

        public String getActualOutput() { return actualOutput; }
        public void setActualOutput(String actualOutput) { this.actualOutput = actualOutput; }
    }
}