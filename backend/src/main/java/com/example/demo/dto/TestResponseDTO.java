package com.example.demo.dto;


public class TestResponseDTO {
    private Long testId;
    private String link;

    public TestResponseDTO(Long testId, String link) {
        this.testId = testId;
        this.link = link;
    }

    public Long getTestId() { return testId; }
    public String getLink() { return link; }
}