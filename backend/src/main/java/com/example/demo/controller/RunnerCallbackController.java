package com.example.demo.controller;

import com.example.demo.dto.RunnerResultDTO;
import com.example.demo.service.SubmissionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/internal/runner")
public class RunnerCallbackController {

    private final SubmissionService submissionService;

    public RunnerCallbackController(SubmissionService submissionService) {
        this.submissionService = submissionService;
    }

    @PostMapping("/callback")
    public ResponseEntity<String> handleCallback(@RequestBody RunnerResultDTO dto) {
        submissionService.handleRunnerCallback(dto);
        return ResponseEntity.ok("Updated submission " + dto.getSubmissionId());
    }
}
