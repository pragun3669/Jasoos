package com.example.demo.dto;

import java.util.List;

public class TestDetailsDTO {
    private Long id;
    private String title;
    private Integer duration;
    private Long createdBy;
    private List<QuestionDetailsDTO> questions;

    public TestDetailsDTO(Long id, String title, Integer duration, Long createdBy, List<QuestionDetailsDTO> questions) {
        this.id = id;
        this.title = title;
        this.duration = duration;
        this.createdBy = createdBy;
        this.questions = questions;
    }

    // Getters
    public Long getId() { return id; }
    public String getTitle() { return title; }
    public Integer getDuration() { return duration; }
    public Long getCreatedBy() { return createdBy; }
    public List<QuestionDetailsDTO> getQuestions() { return questions; }
}
