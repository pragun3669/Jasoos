package com.example.demo.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.example.demo.dto.CreateTestDTO;
import com.example.demo.dto.FinalSubmitDTO;
import com.example.demo.dto.TestResponseDTO;
import com.example.demo.dto.TestDetailsDTO;
import com.example.demo.dto.StudentDTO;
import com.example.demo.dto.StudentResultDTO;
import com.example.demo.dto.AITestGenerationRequestDTO;
import com.example.demo.entity.teacher.Student;
import com.example.demo.service.TestService;
import com.example.demo.service.AITestService;

@RestController
@RequestMapping("/api/tests")
public class TestController {

    private final TestService testService;
    private final AITestService aiTestService;

    public TestController(TestService testService,
                          AITestService aiTestService) {
        this.testService = testService;
        this.aiTestService = aiTestService;
    }

    // ============================================================
    // CREATE TEST (Manual Create)
    // ============================================================
    @PostMapping
    public ResponseEntity<TestResponseDTO> createTest(@RequestBody CreateTestDTO dto) {
        return ResponseEntity.ok(testService.createTest(dto));
    }

    // ============================================================
    // AI TEST GENERATION (Full Test via FastAPI)
    // ============================================================
    @PostMapping("/ai-generate")
    public ResponseEntity<Object> generateAITest(@RequestBody AITestGenerationRequestDTO request) {
        try {
            return ResponseEntity.ok(aiTestService.generateTest(request));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("AI generation failed: " + e.getMessage());
        }
    }

    // ============================================================
    // GET TEST
    // ============================================================
    @GetMapping("/{id}")
    public ResponseEntity<TestDetailsDTO> getTest(@PathVariable Long id) {
        TestDetailsDTO response = testService.getTestDetails(id);
        return response == null ? ResponseEntity.notFound().build() : ResponseEntity.ok(response);
    }

    @GetMapping("/teacher/{teacherId}")
    public ResponseEntity<List<TestDetailsDTO>> getTestsByTeacher(@PathVariable Long teacherId) {
        return ResponseEntity.ok(testService.getTestsByTeacher(teacherId));
    }

    // ============================================================
    // TEST SUMMARY  (lightweight — no plagiarism checks)
    // Used by the dashboard to show student counts without triggering
    // the plagiarism service. Only /results triggers plagiarism.
    // ============================================================
    @GetMapping("/{testId}/summary")
    public ResponseEntity<Map<String, Object>> getTestSummary(@PathVariable Long testId) {
        List<Student> students = testService.getStudentsByTest(testId);
        long submittedCount = students.stream()
                .filter(s -> s.getSubmittedAt() != null)
                .count();

        Map<String, Object> summary = new HashMap<>();
        summary.put("totalStudents", students.size());
        summary.put("submittedCount", submittedCount);
        return ResponseEntity.ok(summary);
    }

    // ============================================================
    // GENERATE TEST LINK
    // ============================================================
    @PostMapping("/{testId}/generate-link")
    public ResponseEntity<String> generateTestLink(@PathVariable Long testId) {
        try {
            return ResponseEntity.ok(testService.generateTestLink(testId));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // ============================================================
    // ACCESS TEST VIA LINK
    // ============================================================
    @GetMapping("/link/{token}")
    public ResponseEntity<?> getTestByToken(@PathVariable String token) {
        try {
            TestDetailsDTO test = testService.getTestByLinkToken(token);
            if (test.getStatus() != null && !"active".equals(test.getStatus())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("Test is not active. Please wait for your teacher to start the test.");
            }
            return ResponseEntity.ok(test);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Test not found or link is invalid.");
        }
    }

    // ============================================================
    // STUDENT INFO SUBMISSION
    // ============================================================
    @PostMapping("/link/{token}/submit")
    public ResponseEntity<Student> submitStudentInfo(
            @PathVariable String token,
            @RequestBody StudentDTO dto) {
        try {
            return ResponseEntity.ok(testService.saveStudentInfo(token, dto));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    // ============================================================
    // FINAL CODE SUBMISSION
    // ============================================================
    @PostMapping("/link/{token}/submit-code")
    public ResponseEntity<Student> submitFinalTest(
            @PathVariable String token,
            @RequestBody FinalSubmitDTO dto) {
        try {
            return ResponseEntity.ok(testService.saveFinalSubmission(token, dto));
        } catch (RuntimeException e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(null);
        }
    }

    // ============================================================
    // GET STUDENTS
    // ============================================================
    @GetMapping("/{testId}/students")
    public ResponseEntity<List<Student>> getStudentsForTest(@PathVariable Long testId) {
        return ResponseEntity.ok(testService.getStudentsByTest(testId));
    }

    // ============================================================
    // DELETE TEST (Soft Delete)
    // ============================================================
    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteTest(@PathVariable Long id) {
        try {
            testService.softDeleteTest(id);
            return ResponseEntity.ok("Test deleted successfully (soft delete).");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // ============================================================
    // START / STOP TEST
    // ============================================================
    @PostMapping("/{testId}/start")
    public ResponseEntity<String> startTest(@PathVariable Long testId) {
        try {
            testService.startTest(testId);
            return ResponseEntity.ok("Test started successfully");
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @PostMapping("/{testId}/stop")
    public ResponseEntity<String> stopTest(@PathVariable Long testId) {
        try {
            testService.stopTest(testId);
            return ResponseEntity.ok("Test stopped successfully");
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    // ============================================================
    // RESULTS  (triggers plagiarism checks — only call on demand)
    // ============================================================
    @GetMapping("/{testId}/results")
    public ResponseEntity<List<StudentResultDTO>> getTestResults(@PathVariable Long testId) {
        return ResponseEntity.ok(testService.getTestResults(testId));
    }
}