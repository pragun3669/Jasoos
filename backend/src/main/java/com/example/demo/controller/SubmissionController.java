package com.example.demo.controller;

import com.example.demo.dto.SubmissionRequest;
import com.example.demo.dto.SubmissionResponseDTO;
import com.example.demo.entity.teacher.Submission;
import com.example.demo.entity.teacher.SubmissionResult;
import com.example.demo.service.SubmissionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/submissions")
public class SubmissionController {

    private final SubmissionService submissionService;

    public SubmissionController(SubmissionService submissionService) {
        this.submissionService = submissionService;
    }

    // ---- Student submits code ----
    @PostMapping
    public ResponseEntity<SubmissionResponseDTO> createSubmission(
            @RequestParam Long testId,
            @RequestBody SubmissionRequest request,
            @RequestParam Long studentId) {

        Submission s = submissionService.createSubmission(testId, request, studentId);
        // Now runnerClient is called automatically inside the service
        return ResponseEntity.ok(
                new SubmissionResponseDTO(s.getId(), s.getStatus())
        );
    }

    // ---- Frontend polls submission status ----
    @GetMapping("/{id}")
    public ResponseEntity<Submission> getSubmission(@PathVariable Long id) {
        Submission s = submissionService.getSubmission(id);
        if (s == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(s);
    }

    // ---- Frontend polls submission test results ----
    @GetMapping("/{id}/results")
    public ResponseEntity<List<SubmissionResult>> getResults(@PathVariable Long id) {
        List<SubmissionResult> results = submissionService.getResultsForSubmission(id);
        return ResponseEntity.ok(results);
    }
}
