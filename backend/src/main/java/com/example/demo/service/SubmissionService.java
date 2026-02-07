package com.example.demo.service;

import com.example.demo.dto.RunnerResultDTO;
import com.example.demo.dto.SubmissionRequest;
import com.example.demo.entity.teacher.Question;
import com.example.demo.entity.teacher.Submission;
import com.example.demo.entity.teacher.SubmissionResult;
import com.example.demo.entity.teacher.Test;
import com.example.demo.entity.teacher.TestCase;
import com.example.demo.repository.teacher.*;
import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class SubmissionService {

    private final SubmissionRepository submissionRepository;
    private final SubmissionResultRepository submissionResultRepository;
    private final TestCaseRepository testCaseRepository;
    private final QuestionRepository questionRepository;
    private final TestRepository testRepository;
    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${runner.url}")
    private String runnerUrl;

    public SubmissionService(
            SubmissionRepository submissionRepository,
            SubmissionResultRepository submissionResultRepository,
            TestCaseRepository testCaseRepository,
            QuestionRepository questionRepository,
            TestRepository testRepository
    ) {
        this.submissionRepository = submissionRepository;
        this.submissionResultRepository = submissionResultRepository;
        this.testCaseRepository = testCaseRepository;
        this.questionRepository = questionRepository;
        this.testRepository = testRepository;
    }

    // =========================
    // CREATE SUBMISSION (FIXED!)
    // =========================
    public Submission createSubmission(Long testId, SubmissionRequest request, Long studentId) {

        Test test = testRepository.findById(testId)
                .orElseThrow(() -> new RuntimeException("Test not found: " + testId));

        Submission submission = new Submission();

        // CRITICAL FIX
        submission.setTest(test);      // sets JPA relation → Fills test_id in DB
        submission.setTestId(testId);  // optional but OK

        submission.setStudentId(studentId);
        submission.setQuestionId(request.getQuestionId());
        submission.setFilename(request.getFilename());
        submission.setLanguage(request.getLanguage());
        submission.setSource(request.getSource());
        submission.setStdin(request.getStdin());
        submission.setStatus("PENDING");

        Submission saved = submissionRepository.save(submission);

        sendToRunner(saved);

        return saved;
    }

    // =========================
    // GET SUBMISSION
    // =========================
    public Submission getSubmission(Long id) {
        return submissionRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Submission not found with id: " + id));
    }

    public List<SubmissionResult> getResultsForSubmission(Long submissionId) {
        return submissionResultRepository.findBySubmissionId(submissionId);
    }
    public List<Submission> getSubmissionsForStudent(Long studentId, Long testId) {
        return submissionRepository.findByStudentIdAndTestId(studentId, testId);
    }
    
    // =========================
    // SEND CODE TO RUNNER
    // =========================
    private void sendToRunner(Submission s) {
        try {
            Question question = questionRepository.findById(s.getQuestionId())
                    .orElseThrow(() -> new EntityNotFoundException("Question not found with id: " + s.getQuestionId()));

            Map<String, Object> job = new HashMap<>();
            job.put("submissionId", s.getId());
            job.put("language", s.getLanguage());
            job.put("source", s.getSource());
            job.put("timeLimitSec", question.getTimeLimitSec());

            List<TestCase> testCases = testCaseRepository.findByQuestionId(s.getQuestionId());
            List<Map<String, Object>> caseList = new ArrayList<>();

            for (TestCase tc : testCases) {
                Map<String, Object> map = new HashMap<>();
                map.put("testCaseId", tc.getId());
                map.put("inputData", tc.getInputData());
                caseList.add(map);
            }

            job.put("testCases", caseList);

            ResponseEntity<String> response = restTemplate.postForEntity(runnerUrl, job, String.class);
            System.out.println("Runner response: " + response.getBody());

        } catch (Exception e) {
            System.err.println("Runner error: " + e.getMessage());
            s.setStatus("FAILED");
            s.setCompileOutput("Runner error: " + e.getMessage());
            submissionRepository.save(s);
        }
    }

    // =========================
    // RUNNER CALLBACK HANDLER
    // =========================
    @Transactional
    public void handleRunnerCallback(RunnerResultDTO dto) {

        Submission submission = submissionRepository.findById(dto.getSubmissionId())
                .orElseThrow(() -> new EntityNotFoundException("Submission not found with id: " + dto.getSubmissionId()));

        submission.setStatus(dto.getStatus());
        submission.setCompileOutput(dto.getCompileOutput());

        List<Long> testCaseIds = dto.getResults().stream()
                .map(RunnerResultDTO.TestResultDTO::getTestCaseId)
                .collect(Collectors.toList());

        Map<Long, TestCase> testCaseMap =
                testCaseRepository.findAllById(testCaseIds).stream()
                        .collect(Collectors.toMap(TestCase::getId, Function.identity()));

        List<SubmissionResult> toSave = new ArrayList<>();

        for (RunnerResultDTO.TestResultDTO tr : dto.getResults()) {

            TestCase tc = testCaseMap.get(tr.getTestCaseId());
            if (tc == null) continue;

            SubmissionResult sr = new SubmissionResult();
            sr.setSubmissionId(submission.getId());
            sr.setTestCaseId(tr.getTestCaseId());
            sr.setStdout(tr.getStdout());
            sr.setStderr(tr.getStderr());
            sr.setExecTimeMs(tr.getExecTimeMs());
            sr.setMemoryKb(tr.getMemoryKb());
            sr.setInputData(tc.getInputData());
            sr.setExpectedOutput(tc.getExpectedOutput());

            if ("TLE".equals(tr.getStatus())) sr.setStatus("TLE");
            else if ("CE".equals(dto.getStatus())) sr.setStatus("CE");
            else {
                String expected = tc.getExpectedOutput().trim();
                String actual = (tr.getStdout() != null ? tr.getStdout().trim() : "");
                sr.setStatus(expected.equals(actual) ? "AC" : "WA");
            }

            toSave.add(sr);
        }

        submissionResultRepository.saveAll(toSave);

        long passed = toSave.stream().filter(r -> "AC".equals(r.getStatus())).count();
        long total = testCaseRepository.countByQuestionId(submission.getQuestionId());
        int score = (total > 0) ? (int) ((double) passed / total * 100) : 0;
        submission.setScore(score);

        submissionRepository.save(submission);
    }
}
