package com.example.demo.dto;

import lombok.Getter;

import java.util.List;

@Getter
public class QuestionDetailsDTO {
    // Getters
    private Long id;
    private String description;
    private Integer marks;
    private List<TestCaseDetailsDTO> testCases;

    public QuestionDetailsDTO(Long id, String description, Integer marks, List<TestCaseDetailsDTO> testCases) {
        this.id = id;
        this.description = description;
        this.marks = marks;
        this.testCases = testCases;
    }

}
