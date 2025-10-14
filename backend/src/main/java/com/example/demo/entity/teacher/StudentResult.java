package com.example.demo.entity.teacher;

import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.*;

@Entity
@Table(name = "student_results")
public class StudentResult {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long questionId;      // The ID of the question
    private Boolean correct;      // Whether student got it correct
    private Integer attempts;     // Number of attempts
    @Column(columnDefinition = "TEXT")
    private String output;        // Output or code result

    @ManyToOne
    @JoinColumn(name = "student_id")
    @JsonIgnore 
    private Student student;      // Link to student

    // --- Getters & Setters ---
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getQuestionId() { return questionId; }
    public void setQuestionId(Long questionId) { this.questionId = questionId; }

    public Boolean getCorrect() { return correct; }
    public void setCorrect(Boolean correct) { this.correct = correct; }

    public Integer getAttempts() { return attempts; }
    public void setAttempts(Integer attempts) { this.attempts = attempts; }

    public String getOutput() { return output; }
    public void setOutput(String output) { this.output = output; }

    public Student getStudent() { return student; }
    public void setStudent(Student student) { this.student = student; }
}
