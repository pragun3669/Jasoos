package com.example.demo.dto;

import lombok.Getter;
import lombok.Setter;

@Getter @Setter
public class LastRunCodeDTO {
    private Long studentId;
    private Long testId;
    private Long questionId;
    private String language;
    private String code;
}
