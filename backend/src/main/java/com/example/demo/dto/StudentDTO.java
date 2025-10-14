package com.example.demo.dto;

import lombok.Data;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
@JsonIgnoreProperties(ignoreUnknown = true)
@Data
public class StudentDTO {
    private String name;
    private String email;
    private String phone;
    private String batch;

    // Overall score (optional, can be computed on backend)
    private Integer score;

    // List of per-question results
    private List<QuestionResultDTO> questionResults;

    // Optional tracking info
    private Integer tabSwitchCount;
    private Integer copyPasteAttempts;

    @Data
    public static class QuestionResultDTO {
        private Long questionId;
        private Boolean correct;
        private Integer attempts;
        private String output;
    }
}
