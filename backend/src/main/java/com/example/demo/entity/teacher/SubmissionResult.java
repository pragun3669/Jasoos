package com.example.demo.entity.teacher;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "submission_results")
@Getter
@Setter
@NoArgsConstructor
public class SubmissionResult {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long submissionId;   // just store ID directly
    private Long testCaseId;
    private String status; // AC, WA, TLE, RTE, CE

    @Lob
    @Column(columnDefinition = "TEXT")
    private String stdout;

    @Lob
    @Column(columnDefinition = "TEXT")
    private String stderr;
    @Lob
@Column(columnDefinition = "TEXT")
private String inputData;


    private Integer execTimeMs;
    private Integer memoryKb;

    private String expectedOutput;
}
