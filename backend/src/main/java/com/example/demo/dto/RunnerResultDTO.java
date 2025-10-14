package com.example.demo.dto;

import lombok.Data;
import java.util.List;

@Data
public class RunnerResultDTO {
    private Long submissionId;
    private String status;
    private String compileOutput;
    private int score;
    private List<TestResultDTO> results;

    @Data
    public static class TestResultDTO {
        private Long testCaseId;
        private String status;
        private String stdout;
        private String stderr;
        private int execTimeMs;
        private int memoryKb;
    }
}

