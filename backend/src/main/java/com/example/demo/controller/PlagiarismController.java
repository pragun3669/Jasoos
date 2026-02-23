package com.example.demo.controller;

import com.example.demo.dto.StudentResultDTO;
import com.example.demo.service.PlagiarismService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/plagiarism")
public class PlagiarismController {

    private final PlagiarismService plagiarismService;

    public PlagiarismController(PlagiarismService plagiarismService) {
        this.plagiarismService = plagiarismService;
    }

    @GetMapping("/test/{testId}")
    public List<StudentResultDTO> getTestPlagiarism(
            @PathVariable Long testId) {

        return plagiarismService.getTestPlagiarismResults(testId);
    }
}