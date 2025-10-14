package com.example.demo.service;

import com.example.demo.dto.RunnerResultDTO;
import com.example.demo.dto.SubmissionRequest;
import com.example.demo.entity.teacher.Question;
import com.example.demo.entity.teacher.Submission;
import com.example.demo.entity.teacher.SubmissionResult;
import com.example.demo.entity.teacher.TestCase;
import com.example.demo.repository.teacher.QuestionRepository;
import com.example.demo.repository.teacher.SubmissionRepository;
import com.example.demo.repository.teacher.SubmissionResultRepository;
import com.example.demo.repository.teacher.TestCaseRepository;
import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class SubmissionService {
    private final SubmissionRepository submissionRepository;
    private final SubmissionResultRepository submissionResultRepository;
    private final TestCaseRepository testCaseRepository;
    private final QuestionRepository questionRepository; // ✅ Inject QuestionRepository
    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${runner.url}") // ✅ Externalize runner URL
    private String runnerUrl;

    // ✅ Use constructor injection for all dependencies
    public SubmissionService(SubmissionRepository submissionRepository,
                             SubmissionResultRepository submissionResultRepository,
                             TestCaseRepository testCaseRepository,
                             QuestionRepository questionRepository) {
        this.submissionRepository = submissionRepository;
        this.submissionResultRepository = submissionResultRepository;
        this.testCaseRepository = testCaseRepository;
        this.questionRepository = questionRepository;
    }

    public Submission createSubmission(Long testId, SubmissionRequest request, Long studentId) {
        Submission submission = new Submission();
        submission.setTestId(testId);
        submission.setStudentId(studentId);
        submission.setFilename(request.getFilename());
        submission.setLanguage(request.getLanguage());
        submission.setSource(request.getSource());
        submission.setStdin(request.getStdin());
        submission.setStatus("PENDING");
        submission.setQuestionId(request.getQuestionId());

        Submission saved = submissionRepository.save(submission);

        // Send to runner
        sendToRunner(saved);

        return saved;
    }

    // ---- Get Submission ----
    public Submission getSubmission(Long id) {
        return submissionRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Submission not found with id: " + id));
    }

    public List<SubmissionResult> getResultsForSubmission(Long submissionId) {
        return submissionResultRepository.findBySubmissionId(submissionId);
    }

    // ---- Send job to runner ----
    private void sendToRunner(Submission s) {
        try {
            // ✅ Fetch the question to get its properties
            Question question = questionRepository.findById(s.getQuestionId())
                    .orElseThrow(() -> new EntityNotFoundException("Question not found with id: " + s.getQuestionId()));

            Map<String, Object> job = new HashMap<>();
            job.put("submissionId", s.getId());
            job.put("language", s.getLanguage());
            job.put("source", s.getSource());

            // ✅ Add the pre-calculated time limit to the job payload
            job.put("timeLimitSec", question.getTimeLimitSec());

            // Fetch test cases
            List<TestCase> testCases = testCaseRepository.findByQuestionId(s.getQuestionId());
            List<Map<String, Object>> caseList = new ArrayList<>();
            for (TestCase tc : testCases) {
                Map<String, Object> map = new HashMap<>();
                map.put("testCaseId", tc.getId());
                map.put("inputData", tc.getInputData());
                // No need to send expectedOutput to the runner; it's for backend validation only
                caseList.add(map);
            }
            job.put("testCases", caseList);

            ResponseEntity<String> response = restTemplate.postForEntity(runnerUrl, job, String.class);
            System.out.println("Runner response: " + response.getBody());

        } catch (Exception e) {
            System.err.println("Error sending job to runner: " + e.getMessage());
            s.setStatus("FAILED");
            s.setCompileOutput("Runner error: " + e.getMessage());
            submissionRepository.save(s);
        }
    }

    // ---- Handle callback from runner ----
    @Transactional
    public void handleRunnerCallback(RunnerResultDTO dto) {
        Submission submission = submissionRepository.findById(dto.getSubmissionId())
                .orElseThrow(() -> new EntityNotFoundException("Submission not found with id: " + dto.getSubmissionId()));

        submission.setStatus(dto.getStatus());
        submission.setCompileOutput(dto.getCompileOutput());

        // Fetch all test cases at once
        List<Long> testCaseIds = dto.getResults().stream()
                .map(RunnerResultDTO.TestResultDTO::getTestCaseId)
                .collect(Collectors.toList());

        Map<Long, TestCase> testCaseMap = testCaseRepository.findAllById(testCaseIds).stream()
                .collect(Collectors.toMap(TestCase::getId, Function.identity()));

        List<SubmissionResult> resultsToSave = new ArrayList<>();
        for (RunnerResultDTO.TestResultDTO tr : dto.getResults()) {
            TestCase currentTestCase = testCaseMap.get(tr.getTestCaseId());
            if (currentTestCase == null) continue;

            SubmissionResult sr = new SubmissionResult();
            sr.setSubmissionId(submission.getId());
            sr.setTestCaseId(tr.getTestCaseId());
            sr.setStdout(tr.getStdout());
            sr.setStderr(tr.getStderr());
            sr.setExecTimeMs(tr.getExecTimeMs());
            sr.setMemoryKb(tr.getMemoryKb());
            sr.setInputData(currentTestCase.getInputData());  // ✅ ADD THIS LINE
            sr.setExpectedOutput(currentTestCase.getExpectedOutput());

            // ✅ Backend decides result
            if ("TLE".equals(tr.getStatus())) {
                sr.setStatus("TLE");
            } else if ("COMPILE_ERROR".equals(dto.getStatus())) {
                sr.setStatus("CE");
            } else if ("FAILED".equals(dto.getStatus())) {
                sr.setStatus("RTE");
            } else {
                // Compare output with DB
                String expected = currentTestCase.getExpectedOutput().trim();
                String actual = (tr.getStdout() != null ? tr.getStdout().trim() : "");
                sr.setStatus(expected.equals(actual) ? "AC" : "WA");
            }

            resultsToSave.add(sr);
        }
        submissionResultRepository.saveAll(resultsToSave);

        // ---- Calculate Score ----
        long passedCount = resultsToSave.stream().filter(r -> "AC".equals(r.getStatus())).count();
        long totalCount = testCaseRepository.countByQuestionId(submission.getQuestionId());
        int score = (totalCount > 0) ? (int) ((double) passedCount / totalCount * 100) : 0;
        submission.setScore(score);

        submissionRepository.save(submission);
    }

}