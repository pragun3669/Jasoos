package com.example.demo.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class SubmissionRequest {
    private String language;
    private String source;
    private String filename;
    private String stdin;
    private Integer timeLimitMs;
    private Long questionId;
    private Long studentId;
}