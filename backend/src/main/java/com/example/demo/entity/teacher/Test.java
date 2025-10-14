package com.example.demo.entity.teacher;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Setter
@Getter
@Entity
@Table(name = "tests")
public class Test {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;
    private Integer duration; // in minutes
    private Long createdBy;   // Teacher ID

    private String status;    // draft, active, completed
    private boolean deleted = false; // soft delete flag

    @OneToMany(mappedBy = "test", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference
    private List<Question> questions = new ArrayList<>();

    public void addQuestion(Question question) {
        this.questions.add(question);
        question.setTest(this);
    }

    public Test() {
        this.status = "draft";
        this.deleted = false;
    }

    public Test(String title, Integer duration, Long createdBy) {
        this.title = title;
        this.duration = duration;
        this.createdBy = createdBy;
        this.status = "draft";
        this.deleted = false;
    }
}
