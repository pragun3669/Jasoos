package com.example.demo.controller;

import com.example.demo.entity.teacher.LastRunCode;
import com.example.demo.service.LastRunCodeService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/last-code")
public class LastRunCodeController {

    private final LastRunCodeService service;

    public LastRunCodeController(LastRunCodeService service) {
        this.service = service;
    }

    // ========================================================
    // GET last saved code for a student + test + question
    // ========================================================
    @GetMapping("/{studentId}/{testId}/{questionId}")
    public ResponseEntity<?> getLastCode(
            @PathVariable Long studentId,
            @PathVariable Long testId,
            @PathVariable Long questionId) {

        return service.find(studentId, testId, questionId)
                .map(code -> {
                    Map<String, Object> response = new HashMap<>();
                    response.put("code", code.getCode());
                    response.put("language", code.getLanguage());
                    return ResponseEntity.ok(response);
                })
                .orElseGet(() -> {
                    Map<String, Object> response = new HashMap<>();
                    response.put("code", "");
                    response.put("language", "");
                    return ResponseEntity.ok(response);
                });
    }

    // ========================================================
    // SAVE or UPDATE autosaved code (called by frontend every few seconds)
    // Accepts JSON { studentId, testId, questionId, language, code }
    // ========================================================
    @PostMapping
    public ResponseEntity<?> saveLastCode(@RequestBody LastRunCode payload) {
        if (payload.getStudentId() == null ||
            payload.getTestId() == null ||
            payload.getQuestionId() == null) {

            Map<String, Object> error = new HashMap<>();
            error.put("error", "studentId, testId and questionId are required");
            return ResponseEntity.badRequest().body(error);
        }

        LastRunCode saved = service.saveOrUpdate(
                payload.getStudentId(),
                payload.getTestId(),
                payload.getQuestionId(),
                payload.getLanguage(),
                payload.getCode()
        );

        Map<String, Object> response = new HashMap<>();
        response.put("saved", true);
        response.put("code", saved.getCode());
        response.put("language", saved.getLanguage());

        return ResponseEntity.ok(response);
    }

    // ========================================================
    // DELETE SAVED CODE AFTER TEST SUBMISSION (OPTIONAL)
    // ========================================================
    @DeleteMapping("/{studentId}/{testId}")
    public ResponseEntity<?> deleteByStudentTest(
            @PathVariable Long studentId,
            @PathVariable Long testId) {

        service.deleteByStudentAndTest(studentId, testId);

        Map<String, Object> response = new HashMap<>();
        response.put("deleted", true);

        return ResponseEntity.ok(response);
    }
}
