package com.example.demo.service;

import com.example.demo.dto.StudentResultDTO;
import com.example.demo.entity.teacher.*;
import com.example.demo.repository.teacher.*;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.ResponseEntity;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class PlagiarismService {

    private final TestRepository testRepository;
    private final SubmissionRepository submissionRepository;
    private final StudentRepository studentRepository;

    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${ai.base.url}")
    private String aiBaseUrl;

    public PlagiarismService(
            TestRepository testRepository,
            SubmissionRepository submissionRepository,
            StudentRepository studentRepository
    ) {
        this.testRepository = testRepository;
        this.submissionRepository = submissionRepository;
        this.studentRepository = studentRepository;
    }

    // ==========================================================
    // MAIN METHOD (AI vs Student for full test)
    // ==========================================================

    @Transactional
    public List<StudentResultDTO> getTestPlagiarismResults(Long testId) {

        Test test = testRepository.findById(testId)
                .orElseThrow(() -> new RuntimeException("Test not found"));

        List<Submission> allSubmissions =
                submissionRepository.findByTestId(testId);

        Map<Long, List<Submission>> subsByStudent =
                allSubmissions.stream()
                        .collect(Collectors.groupingBy(Submission::getStudentId));

        List<Student> students =
                studentRepository.findByTestId(testId);

        return students.stream().map(student -> {

            StudentResultDTO dto = new StudentResultDTO();

            dto.setStudentId(student.getId());
            dto.setName(student.getName());
            dto.setEmail(student.getEmail());
            dto.setBatch(student.getBatch());
            dto.setStatus("Checked");

            List<Submission> mySubs =
                    subsByStudent.getOrDefault(student.getId(), List.of());

            Map<Long, List<Submission>> byQuestion =
                    mySubs.stream()
                            .collect(Collectors.groupingBy(Submission::getQuestionId));

            List<StudentResultDTO.QuestionResultDTO> questionResults =
                    test.getQuestions().stream().map(question -> {

                        StudentResultDTO.QuestionResultDTO qDto =
                                new StudentResultDTO.QuestionResultDTO();

                        qDto.setQuestionId(question.getId());
                        qDto.setQuestionDescription(question.getDescription());
                        qDto.setAiGeneratedSolution(question.getAiGeneratedSolution());

                        List<Submission> questionSubs =
                                byQuestion.getOrDefault(question.getId(), List.of());

                        if (questionSubs.isEmpty()) {
                            qDto.setPlagiarismScore(0.0);
                            qDto.setSubmittedCode(null);
                            return qDto;
                        }

                        Submission latest =
                                questionSubs.get(questionSubs.size() - 1);

                        String studentCode = latest.getSource();
                        String aiCode = question.getAiGeneratedSolution();

                        Double score = callAI(studentCode, aiCode);

                        qDto.setSubmittedCode(studentCode);
                        qDto.setPlagiarismScore(score);

                        return qDto;

                    }).collect(Collectors.toList());

            dto.setQuestionResults(questionResults);

            return dto;

        }).collect(Collectors.toList());
    }

    // ==========================================================
    // CALL FASTAPI
    // ==========================================================

    private Double callAI(String codeA, String codeB) {

        try {

            String url = aiBaseUrl + "/plagiarism/predict";

            Map<String, Object> payload = new HashMap<>();
            payload.put("codeA", codeA);
            payload.put("codeB", codeB);

            ResponseEntity<Map> response =
                    restTemplate.postForEntity(url, payload, Map.class);

            if (!response.getStatusCode().is2xxSuccessful()
                    || response.getBody() == null) {
                return 0.0;
            }

            Object scoreObj =
                    response.getBody().get("plagiarism_score");

            return (scoreObj instanceof Number)
                    ? ((Number) scoreObj).doubleValue()
                    : 0.0;

        } catch (Exception e) {
            return 0.0;
        }
    }
}