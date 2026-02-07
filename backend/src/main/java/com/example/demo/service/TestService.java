package com.example.demo.service;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.Map;
import java.util.HashMap;
import java.util.Optional;
import java.net.NetworkInterface;
import java.net.InetAddress;
import java.net.Inet4Address;
import java.util.Enumeration;


import jakarta.transaction.Transactional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.example.demo.dto.CreateTestDTO;
import com.example.demo.dto.TestResponseDTO;
import com.example.demo.dto.TestDetailsDTO;
import com.example.demo.dto.QuestionDetailsDTO;
import com.example.demo.dto.TestCaseDetailsDTO;
import com.example.demo.dto.StudentDTO;
import com.example.demo.dto.StudentResultDTO;
import com.example.demo.dto.FinalSubmitDTO;
import com.example.demo.entity.teacher.Question;
import com.example.demo.entity.teacher.Test;
import com.example.demo.entity.teacher.TestCase;
import com.example.demo.entity.teacher.TestLink;
import com.example.demo.entity.teacher.Student;
import com.example.demo.entity.teacher.Submission;
import com.example.demo.entity.teacher.SubmissionResult;
import com.example.demo.repository.teacher.TestRepository;
import com.example.demo.repository.teacher.TestLinkRepository;
import com.example.demo.repository.teacher.StudentRepository;
import com.example.demo.repository.teacher.SubmissionRepository;
import com.example.demo.repository.teacher.SubmissionResultRepository;

import com.example.demo.controller.PlagiarismController; // <-- expect this bean to exist

@Service
public class TestService {

    private final TestRepository testRepository;
    private final TestLinkRepository testLinkRepository;
    private final StudentRepository studentRepository;
    private final SubmissionRepository submissionRepository;
    private final SubmissionResultRepository submissionResultRepository;
    private final ScoreCalculationService scoreCalculationService;
    private final PlagiarismController plagiarismController;

    public TestService(
            TestRepository testRepository,
            TestLinkRepository testLinkRepository,
            StudentRepository studentRepository,
            SubmissionRepository submissionRepository,
            SubmissionResultRepository submissionResultRepository,
            ScoreCalculationService scoreCalculationService,
            PlagiarismController plagiarismController
    ) {
        this.testRepository = testRepository;
        this.testLinkRepository = testLinkRepository;
        this.studentRepository = studentRepository;
        this.submissionRepository = submissionRepository;
        this.submissionResultRepository = submissionResultRepository;
        this.scoreCalculationService = scoreCalculationService;
        this.plagiarismController = plagiarismController;
    }

    @Autowired
    private AICodeGeneratorService aiCodeGeneratorService;
    

    // --- CREATE TEST ---
    @Transactional
    public TestResponseDTO createTest(CreateTestDTO dto) {
        Test test = new Test();
        test.setTitle(dto.getTitle());
        test.setDuration(dto.getDuration());
        test.setCreatedBy(dto.getCreatedBy());
        test.setStatus("draft");

        dto.getQuestions().forEach(qdto -> {
            Question question = mapToQuestionEntity(qdto, test);
            test.addQuestion(question);
        });

        Test saved = testRepository.save(test);
        String link = "/exam/" + saved.getId();

        return new TestResponseDTO(saved.getId(), link);
    }

    private Question mapToQuestionEntity(CreateTestDTO.QuestionDTO qdto, Test parentTest) {
        Question q = new Question();
        q.setDescription(qdto.getDescription());
        q.setMarks(qdto.getMarks());
        q.setTest(parentTest);

        q.setMaxInputSize(qdto.getMaxInputSize());
        q.setComplexity(qdto.getComplexity());
        q.setBaseTimeLimit(qdto.getBaseTimeLimit() != null ? qdto.getBaseTimeLimit() : 1.0);

        double finalTimeLimit = calculateTimeLimit(q.getMaxInputSize(), q.getComplexity(), q.getBaseTimeLimit());
        q.setTimeLimitSec(finalTimeLimit);

        //  ✅ FIXED: AI Code Generation (correct variable: q instead of question)
        try {
            String aiCode = aiCodeGeneratorService.generateSolution(qdto.getDescription());
            q.setAiGeneratedSolution(aiCode);
        } catch (Exception e) {
            System.out.println("AI generation failed for question: " + qdto.getDescription());
            q.setAiGeneratedSolution("// AI generation failed");
        }

        qdto.getTestCases().forEach(tcDto -> {
            TestCase testCase = mapToTestCaseEntity(tcDto, q);
            q.addTestCase(testCase);
        });

        return q;
    }

    private double calculateTimeLimit(Long maxInputSize, String complexity, Double baseTimeLimit) {
        if (maxInputSize == null || complexity == null || baseTimeLimit == null || maxInputSize <= 0) {
            return 2.0;
        }

        double ops = switch (complexity) {
            case "O(N)" -> (double) maxInputSize;
            case "O(NlogN)" -> maxInputSize * (Math.log(maxInputSize) / Math.log(2));
            case "O(N^2)" -> Math.pow(maxInputSize, 2);
            case "O(N^3)" -> Math.pow(maxInputSize, 3);
            default -> (double) maxInputSize;
        };

        double recommendedTime = ops / 1e8;
        return Math.max(baseTimeLimit, 1.5 * recommendedTime);
    }

    private TestCase mapToTestCaseEntity(CreateTestDTO.TestCaseDTO tcDto, Question parentQuestion) {
        TestCase tc = new TestCase();
        tc.setInputData(tcDto.getInputData());
        tc.setExpectedOutput(tcDto.getExpectedOutput());
        tc.setExampleCase(tcDto.isExampleCase());
        tc.setQuestion(parentQuestion);
        return tc;
    }
    @Transactional
    public void softDeleteTest(Long testId) {
        Test test = testRepository.findById(testId)
                .orElseThrow(() -> new RuntimeException("Test not found with ID: " + testId));

        test.setDeleted(true);
        testRepository.save(test);
    }


    // --- GET TEST ---
    public Test getTest(Long id) {
        return testRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Test not found with ID: " + id));
    }

    private TestDetailsDTO mapToTestDetailsDTO(Test test) {
        List<QuestionDetailsDTO> questions = test.getQuestions().stream()
                .map(q -> {
                    List<TestCaseDetailsDTO> testCases = q.getTestCases().stream()
                            .map(tc -> new TestCaseDetailsDTO(
                                    tc.getId(),
                                    tc.getInputData(),
                                    tc.getExpectedOutput(),
                                    tc.isExampleCase()
                            ))
                            .collect(Collectors.toList());

                    return new QuestionDetailsDTO(
                            q.getId(),
                            q.getDescription(),
                            q.getMarks(),
                            testCases,
                            q.getAiGeneratedSolution()
                    );
                })
                .collect(Collectors.toList());

        return new TestDetailsDTO(
                test.getId(),
                test.getTitle(),
                test.getDuration(),
                test.getCreatedBy(),
                test.getStatus(),
                questions
        );
    }

    public TestDetailsDTO getTestDetails(Long id) {
        return testRepository.findById(id)
                .map(this::mapToTestDetailsDTO)
                .orElse(null);
    }

    public List<TestDetailsDTO> getTestsByTeacher(Long teacherId) {
        return testRepository.findByCreatedBy(teacherId).stream()
                .map(this::mapToTestDetailsDTO)
                .collect(Collectors.toList());
    }
    // Add these methods to your TestService.java

    public void startTest(Long testId) {
        Test test = testRepository.findById(testId)
            .orElseThrow(() -> new RuntimeException("Test not found"));

        test.setStatus("active");
        testRepository.save(test);
    }

    public void stopTest(Long testId) {
        Test test = testRepository.findById(testId)
            .orElseThrow(() -> new RuntimeException("Test not found"));

        test.setStatus("completed");
        testRepository.save(test);
    }
    // --- GENERATE TEST LINK ---
@Transactional
public String generateTestLink(Long testId) {
    Test test = testRepository.findById(testId)
            .orElseThrow(() -> new RuntimeException("Test not found with ID: " + testId));

    String token = UUID.randomUUID().toString();

    TestLink link = new TestLink();
    link.setTest(test);
    link.setLinkToken(token);
    testLinkRepository.save(link);

    return "http://localhost:3000/test/" + token;
}

    public TestDetailsDTO getTestByLinkToken(String token) {
        TestLink link = testLinkRepository.findByLinkToken(token.trim())
                .orElseThrow(() -> new RuntimeException("Invalid test link: " + token));
        return mapToTestDetailsDTO(link.getTest());
    }

    // --- STUDENT INFO ---
    @Transactional
    public Student saveStudentInfo(String token, StudentDTO dto) {
        TestLink link = testLinkRepository.findByLinkToken(token.trim())
                .orElseThrow(() -> new RuntimeException("Invalid test link"));

        Student student = new Student();
        student.setName(dto.getName());
        student.setEmail(dto.getEmail());
        student.setPhone(dto.getPhone());
        student.setBatch(dto.getBatch());
        student.setTest(link.getTest());
        student.setSubmittedAt(LocalDateTime.now());

        return studentRepository.save(student);
    }

    // --- FINAL SUBMISSION ---
    @Transactional
    public Student saveFinalSubmission(String token, FinalSubmitDTO dto) {
        TestLink link = testLinkRepository.findByLinkToken(token.trim())
                .orElseThrow(() -> new RuntimeException("Invalid test link"));

        Test test = link.getTest();
        int totalQuestions = test.getQuestions().size();

        Student student = studentRepository.findByEmailAndTestId(dto.getEmail(), test.getId())
                .orElseGet(() -> {
                    Student newStudent = new Student();
                    newStudent.setTest(test);
                    newStudent.setEmail(dto.getEmail());
                    return newStudent;
                });

        student.setName(dto.getName());
        student.setBatch(dto.getBatch());
        student.setSubmittedAt(dto.getSubmittedAt() != null ? dto.getSubmittedAt() : LocalDateTime.now());
        student.setTabSwitchCount(dto.getTabSwitchCount());
        student.setCopyPasteAttempts(dto.getCopyPasteAttempts());

        // Calculate score
        Integer calculatedScore = scoreCalculationService.calculateScoreWithPenalties(dto, totalQuestions);
        student.setScore(calculatedScore);

        return studentRepository.save(student);
    }

    public List<Student> getStudentsByTest(Long testId) {
        return studentRepository.findByTestId(testId);
    }

    // --- GET RESULTS ---
    public List<StudentResultDTO> getTestResults(Long testId) {
        Test test = testRepository.findById(testId)
                .orElseThrow(() -> new RuntimeException("Test not found"));

        int totalMarks = test.getQuestions().stream()
                .mapToInt(Question::getMarks)
                .sum();

        List<Student> students = studentRepository.findByTestId(testId);

        return students.stream().map(student -> {
            StudentResultDTO dto = new StudentResultDTO();
            dto.setStudentId(student.getId());
            dto.setName(student.getName());
            dto.setEmail(student.getEmail());
            dto.setBatch(student.getBatch());
            dto.setStatus(student.getSubmittedAt() != null ? "Submitted" : "Not Attempted");
            dto.setSubmittedAt(student.getSubmittedAt());
            dto.setTotalMarks(totalMarks);
            dto.setScore(student.getScore() != null ? student.getScore() : 0);

            // Compute plagiarism details (score + metadata)
            PlagiarismResult pr = computePlagiarismResult(student, test);
            dto.setPlagiarismScore(pr.score);
            dto.setSubmittedCode(pr.studentSubmittedCode);
            dto.setAiGeneratedSolution(pr.aiMatchedCode);
            dto.setSimilarStudentCode(pr.similarStudentCode);
            dto.setSimilaritySource(pr.similaritySource);

            dto.setTabSwitchCount(student.getTabSwitchCount());
            dto.setCopyPasteAttempts(student.getCopyPasteAttempts());

            // Question-level results
            List<Submission> submissions = submissionRepository.findByStudentIdAndTestId(student.getId(), testId);
            List<StudentResultDTO.QuestionResultDTO> questionResults = buildQuestionResults(submissions, test);
            dto.setQuestionResults(questionResults);

            return dto;
        }).collect(Collectors.toList());
    }

    private List<StudentResultDTO.QuestionResultDTO> buildQuestionResults(List<Submission> submissions, Test test) {
        return test.getQuestions().stream().map(question -> {
            StudentResultDTO.QuestionResultDTO qDto = new StudentResultDTO.QuestionResultDTO();
            qDto.setQuestionId(question.getId());
            qDto.setQuestionDescription(question.getDescription());
            qDto.setQuestionMarks(question.getMarks());

            // Filter submissions for this question
            List<Submission> questionSubs = submissions.stream()
                    .filter(sub -> question.getId().equals(sub.getQuestionId()))
                    .collect(Collectors.toList());

            if (questionSubs.isEmpty()) {
                qDto.setCorrect(false);
                qDto.setAttempts(0);
                qDto.setPassedTestCases(0);
                qDto.setTotalTestCases(question.getTestCases().size());
                qDto.setEarnedPoints(0.0);
                qDto.setTestCaseResults(List.of());
                qDto.setSubmittedCode(null);  // ✅ ADD THIS
                qDto.setLanguage(null);       // ✅ ADD THIS
                qDto.setAiGeneratedSolution(question.getAiGeneratedSolution()); // optional
                qDto.setPlagiarismScore(0.0);
                qDto.setSimilaritySource("unknown");
                return qDto;
            }

            // Latest submission
            Submission latestSub = questionSubs.get(questionSubs.size() - 1);

            // ✅ ADD THESE TWO LINES:
            qDto.setSubmittedCode(latestSub.getSource());
            qDto.setLanguage(latestSub.getLanguage());
            qDto.setAiGeneratedSolution(question.getAiGeneratedSolution());

            List<SubmissionResult> results = submissionResultRepository.findBySubmissionId(latestSub.getId());

            int totalTestCases = results.size();
            long passedCount = results.stream()
                    .filter(r -> "AC".equalsIgnoreCase(r.getStatus()))
                    .count();

            qDto.setCorrect(passedCount == totalTestCases && totalTestCases > 0);
            qDto.setAttempts(questionSubs.size());
            qDto.setPassedTestCases((int) passedCount);
            qDto.setTotalTestCases(totalTestCases);

            // Earned points
            double pointsPerQuestion = 100.0 / test.getQuestions().size();
            double earnedPoints = totalTestCases > 0
                    ? (passedCount * pointsPerQuestion) / totalTestCases
                    : 0.0;
            qDto.setEarnedPoints(Math.round(earnedPoints * 100.0) / 100.0);

            // Add test case-level details
            List<StudentResultDTO.TestCaseResultDTO> testCaseResults = results.stream()
                    .map(r -> {
                        StudentResultDTO.TestCaseResultDTO tcDto = new StudentResultDTO.TestCaseResultDTO();
                        tcDto.setPassed("AC".equalsIgnoreCase(r.getStatus()));
                        tcDto.setInput(r.getInputData() != null ? r.getInputData() : "");
                        tcDto.setExpectedOutput(r.getExpectedOutput() != null ? r.getExpectedOutput() : "");
                        tcDto.setActualOutput(r.getStdout() != null ? r.getStdout() : "");
                        tcDto.setExecutionTime(r.getExecTimeMs());
                        tcDto.setError(r.getStderr());
                        return tcDto;
                    }).collect(Collectors.toList());

            qDto.setTestCaseResults(testCaseResults);

            // Per-question plagiarism (optional): compute highest of AI / others / self
            try {
                double perQScore = 0.0;
                String perQSource = "unknown";

                // Compare with AI
                double aiScore = 0.0;
                if (question.getAiGeneratedSolution() != null && !question.getAiGeneratedSolution().isBlank()) {
                    Double tmp = plagiarismController.callPlagiarismService(latestSub.getSource(), question.getAiGeneratedSolution());
                    aiScore = tmp != null ? tmp : 0.0;
                }

                // Compare with other students latest submissions for same question
                List<Submission> others = submissionRepository.findByTestId(test.getId()).stream()
                        .filter(s -> question.getId().equals(s.getQuestionId()))
                        .filter(s -> !s.getStudentId().equals(latestSub.getStudentId()))
                        .collect(Collectors.toList());

                double bestOther = 0.0;
                for (Submission o : others) {
                    if (o.getSource() == null || o.getSource().isBlank()) continue;
                    Double tmp = plagiarismController.callPlagiarismService(latestSub.getSource(), o.getSource());
                    double val = tmp != null ? tmp : 0.0;
                    if (val > bestOther) {
                        bestOther = val;
                    }
                }

                // Self check (previous attempt)
                double selfScore = 0.0;
                List<Submission> allForQ = submissionRepository.findByTestId(test.getId()).stream()
                        .filter(s -> question.getId().equals(s.getQuestionId()))
                        .filter(s -> s.getStudentId().equals(latestSub.getStudentId()))
                        .sorted(Comparator.comparing(Submission::getCreatedAt))
                        .collect(Collectors.toList());
                if (allForQ.size() > 1) {
                    Submission prev = allForQ.get(allForQ.size() - 2);
                    Double tmp = plagiarismController.callPlagiarismService(latestSub.getSource(), prev.getSource());
                    selfScore = tmp != null ? tmp : 0.0;
                }

                // Weighted combine (same weights as top-level)
                double combined = (aiScore * 0.40) + (bestOther * 0.50) + (selfScore * 0.10);
                perQScore = combined;
                if (aiScore >= bestOther && aiScore >= selfScore && aiScore > 0) perQSource = "ai";
                else if (bestOther >= aiScore && bestOther >= selfScore && bestOther > 0) perQSource = "other_student";
                else if (selfScore > 0) perQSource = "self";
                else perQSource = "unknown";

                qDto.setPlagiarismScore(Math.round(perQScore * 100.0) / 100.0);
                qDto.setSimilaritySource(perQSource);
            } catch (Exception e) {
                qDto.setPlagiarismScore(0.0);
                qDto.setSimilaritySource("unknown");
            }

            return qDto;
        }).collect(Collectors.toList());
    }

    /**
     * Internal helper that returns a numeric score + metadata to be sent to DTO.
     */
    private static class PlagiarismResult {
        double score;
        String studentSubmittedCode;
        String aiMatchedCode;
        String similarStudentCode;
        String similaritySource;

        PlagiarismResult() {
            this.score = 0.0;
            this.studentSubmittedCode = null;
            this.aiMatchedCode = null;
            this.similarStudentCode = null;
            this.similaritySource = "unknown";
        }
    }

    /**
     * Compute plagiarism score and metadata (student submitted code, best-matching student code,
     * ai match, and similarity source). Defensive against nulls and service failures.
     */
   /**
 * NEW simplified plagiarism logic:
 * - Compare against AI solution
 * - Compare against other students
 * - Do NOT compare against own previous attempts
 * - Final Score < 60 → treated as "pass"
 */
private PlagiarismResult computePlagiarismResult(Student student, Test test) {

    PlagiarismResult out = new PlagiarismResult();

    try {
        // ------------------------------------------
        // 1) Get student code
        // ------------------------------------------
        List<Submission> mySubs =
                submissionRepository.findByStudentIdAndTestId(student.getId(), test.getId());

        if (mySubs == null || mySubs.isEmpty()) {
            out.score = 0.0;
            out.similaritySource = "pass";
            return out;
        }

        String myCode = mySubs.get(0).getSource();
        if (myCode == null || myCode.isBlank()) {
            out.score = 0.0;
            out.similaritySource = "pass";
            return out;
        }

        out.studentSubmittedCode = myCode;

        // ------------------------------------------
        // 2) Variables for best matches
        // ------------------------------------------
        double aiScore = 0.0;
        double studentScore = 0.0;

        // ===========================================================
        // 3️⃣ AI SIMILARITY CHECK  (student ↔ aiGeneratedSolution)
        // ===========================================================
        for (Question q : test.getQuestions()) {

            String aiCode = q.getAiGeneratedSolution();
            if (aiCode == null || aiCode.isBlank()) continue;

            Double score = plagiarismController.callPlagiarismService(myCode, aiCode);
            double val = (score != null) ? score : 0.0;

            if (val > aiScore) {
                aiScore = val;
                out.aiMatchedCode = aiCode;  // save the strongest AI match
            }
        }

        // ===========================================================
        // 4️⃣ STUDENT SIMILARITY CHECK  (student ↔ other student)
        // ===========================================================
        List<Student> allStudents = studentRepository.findByTestId(test.getId());

        for (Student other : allStudents) {
            if (other.getId().equals(student.getId())) continue;

            List<Submission> otherSubs =
                    submissionRepository.findByStudentIdAndTestId(other.getId(), test.getId());
            if (otherSubs == null || otherSubs.isEmpty()) continue;

            String otherCode = otherSubs.get(0).getSource();
            if (otherCode == null || otherCode.isBlank()) continue;

            Double score = plagiarismController.callPlagiarismService(myCode, otherCode);
            double val = (score != null) ? score : 0.0;

            if (val > studentScore) {
                studentScore = val;
                out.similarStudentCode = otherCode;  // save best matching student code
            }
        }

        // ===========================================================
        // 5️⃣ FINAL PLAGIARISM DECISION (no combine logic!)
        // ===========================================================
        double finalScore = Math.max(aiScore, studentScore);
        out.score = Math.round(finalScore * 100.0) / 100.0;

        if (studentScore >= 70) {
            out.similaritySource = "other_student";
        }
        else if (aiScore >= 70) {
            out.similaritySource = "ai";
        }
        else {
            out.similaritySource = "pass";  // no plagiarism detected
        }

        return out;

    } catch (Exception e) {
        out.score = 0.0;
        out.similaritySource = "pass";
        return out;
    }
}

}
