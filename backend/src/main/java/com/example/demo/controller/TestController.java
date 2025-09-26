package com.example.demo.controller;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.example.demo.dto.CreateTestDTO;
import com.example.demo.dto.TestResponseDTO;
import com.example.demo.dto.TestDetailsDTO;
import com.example.demo.service.TestService;

@RestController
@RequestMapping("/api/tests")
public class TestController {

    private final TestService testService;

    public TestController(TestService testService) {
        this.testService = testService;
    }

    // --- Create a new test with questions and test cases ---
    @PostMapping
    public ResponseEntity<TestResponseDTO> createTest(@RequestBody CreateTestDTO dto) {
        TestResponseDTO response = testService.createTest(dto);
        return ResponseEntity.ok(response);
    }

    // --- Get a test by ID, including questions and test cases ---
    @GetMapping("/{id}")
    public ResponseEntity<TestDetailsDTO> getTest(@PathVariable Long id) {
        TestDetailsDTO response = testService.getTestDetails(id);
        if (response == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(response);
    }
      // --- Get all tests created by a teacher ---
      @GetMapping("/teacher/{teacherId}")
      public ResponseEntity<List<TestDetailsDTO>> getTestsByTeacher(@PathVariable Long teacherId) {
          List<TestDetailsDTO> response = testService.getTestsByTeacher(teacherId);
          return ResponseEntity.ok(response);
      }
}
