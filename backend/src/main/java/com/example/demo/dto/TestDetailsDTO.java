package com.example.demo.dto;

import java.util.List;

public class TestDetailsDTO {
    private Long id;
    private String title;
    private Integer duration;
    private Long createdBy;
    private String status;
    private List<QuestionDetailsDTO> questions;

    public TestDetailsDTO(Long id, String title, Integer duration, Long createdBy, String status, List<QuestionDetailsDTO> questions) {
        this.id = id;
        this.title = title;
        this.duration = duration;
        this.createdBy = createdBy;
        this.status = status;
        this.questions = questions;
    }

    // Getters
    public Long getId() { return id; }
    public String getTitle() { return title; }
    public Integer getDuration() { return duration; }
    public Long getCreatedBy() { return createdBy; }
    public String getStatus() { return status; } 
    public List<QuestionDetailsDTO> getQuestions() { return questions; }
}
