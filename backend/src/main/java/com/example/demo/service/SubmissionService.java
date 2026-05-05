package com.example.demo.service;

import com.example.demo.dto.RunnerResultDTO;
import com.example.demo.dto.SubmissionRequest;
import com.example.demo.entity.teacher.*;
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
    // CREATE SUBMISSION
    // =========================
    public Submission createSubmission(Long testId, SubmissionRequest request, Long studentId) {

        Test test = testRepository.findById(testId)
                .orElseThrow(() -> new RuntimeException("Test not found: " + testId));

        Submission submission = new Submission();
        submission.setTest(test);
        submission.setTestId(testId);
        submission.setStudentId(studentId);
        submission.setQuestionId(request.getQuestionId());
        submission.setFilename(request.getFilename());
        submission.setLanguage(request.getLanguage());
        submission.setSource(request.getSource());
        submission.setStdin(request.getStdin());
        submission.setStatus("PENDING");

        submission.setTabSwitchCount(
            request.getTabSwitchCount() != null ? request.getTabSwitchCount() : 0
        );

        submission.setCopyPasteAttempts(
            request.getCopyPasteAttempts() != null ? request.getCopyPasteAttempts() : 0
        );

        Submission saved = submissionRepository.save(submission);
        sendToRunner(saved);

        return saved;
    }

    // =========================
    // SEND CODE TO RUNNER
    // =========================
    private void sendToRunner(Submission s) {
        try {
            Question question = questionRepository.findById(s.getQuestionId())
                    .orElseThrow(() -> new EntityNotFoundException("Question not found"));

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

            restTemplate.postForEntity(runnerUrl, job, String.class);

        } catch (Exception e) {
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
                .orElseThrow(() -> new EntityNotFoundException("Submission not found"));

        submission.setCompileOutput(dto.getCompileOutput());

        // If compilation error → stop immediately
        if ("CE".equals(dto.getStatus())) {
            submission.setStatus("CE");
            submission.setScore(0);
            submissionRepository.save(submission);
            return;
        }

        List<Long> testCaseIds = dto.getResults().stream()
                .map(RunnerResultDTO.TestResultDTO::getTestCaseId)
                .collect(Collectors.toList());

        Map<Long, TestCase> testCaseMap =
                testCaseRepository.findAllById(testCaseIds).stream()
                        .collect(Collectors.toMap(TestCase::getId, Function.identity()));

        List<SubmissionResult> toSave = new ArrayList<>();

        boolean allPassed = true;

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

            String finalStatus;

            if ("TLE".equals(tr.getStatus())) {
                finalStatus = "TLE";
                allPassed = false;
            } else if ("RTE".equals(tr.getStatus())) {
                finalStatus = "RTE";
                allPassed = false;
            } else {
                String expected = normalize(tc.getExpectedOutput());
                String actual = normalize(tr.getStdout());

                if (expected.equals(actual)) {
                    finalStatus = "AC";
                } else {
                    finalStatus = "WA";
                    allPassed = false;
                }
            }

            sr.setStatus(finalStatus);
            toSave.add(sr);
        }

        submissionResultRepository.saveAll(toSave);

        long passed = toSave.stream()
                .filter(r -> "AC".equals(r.getStatus()))
                .count();

        long total = toSave.size();
        int score = (total > 0) ? (int) ((double) passed / total * 100) : 0;

        submission.setScore(score);
        submission.setStatus(allPassed ? "AC" : "FAILED");

        submissionRepository.save(submission);
    }
    // =========================
// GET SINGLE SUBMISSION
// =========================
public Submission getSubmission(Long id) {
    return submissionRepository.findById(id)
            .orElseThrow(() ->
                    new EntityNotFoundException("Submission not found with id: " + id));
}


// =========================
// GET RESULTS FOR SUBMISSION
// =========================
public List<SubmissionResult> getResultsForSubmission(Long submissionId) {
    return submissionResultRepository.findBySubmissionId(submissionId);
}


// =========================
// GET ALL SUBMISSIONS FOR STUDENT IN TEST
// =========================
public List<Submission> getSubmissionsForStudent(Long testId, Long studentId) {
    return submissionRepository.findByStudentIdAndTestId(studentId, testId);
}

    // =========================
    // OUTPUT NORMALIZER (IMPORTANT)
    // =========================
    private String normalize(String s) {
        if (s == null) return "";
        return s.trim()
                .replace("\r", "")
                .replaceAll("[ \t]+", " ")
                .replaceAll("\n+", "\n");
    }
}
