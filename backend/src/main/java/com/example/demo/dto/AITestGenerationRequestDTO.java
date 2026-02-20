package com.example.demo.dto;

import lombok.Data;

@Data
public class AITestGenerationRequestDTO {
    private String topic;
    private String difficulty; // Easy | Medium | Hard
    private Integer numberOfQuestions;
}
