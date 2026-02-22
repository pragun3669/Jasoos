package com.example.demo.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import jakarta.transaction.Transactional;

import org.springframework.stereotype.Service;

import com.example.demo.controller.PlagiarismController;
import com.example.demo.dto.CreateTestDTO;
import com.example.demo.dto.FinalSubmitDTO;
import com.example.demo.dto.QuestionDetailsDTO;
import com.example.demo.dto.StudentDTO;
import com.example.demo.dto.StudentResultDTO;
import com.example.demo.dto.TestCaseDetailsDTO;
import com.example.demo.dto.TestDetailsDTO;
import com.example.demo.dto.TestResponseDTO;
import com.example.demo.entity.teacher.Question;
import com.example.demo.entity.teacher.Student;
import com.example.demo.entity.teacher.Submission;
import com.example.demo.entity.teacher.SubmissionResult;
import com.example.demo.entity.teacher.Test;
import com.example.demo.entity.teacher.TestCase;
import com.example.demo.entity.teacher.TestLink;
import com.example.demo.repository.teacher.StudentRepository;
import com.example.demo.repository.teacher.SubmissionRepository;
import com.example.demo.repository.teacher.SubmissionResultRepository;
import com.example.demo.repository.teacher.TestLinkRepository;
import com.example.demo.repository.teacher.TestRepository;

@Service
public class TestService {

    // --- Constants ---
    private static final double PLAGIARISM_FLAG_THRESHOLD = 70.0;
    private static final double OPS_PER_SECOND = 1e8;
    private static final double DEFAULT_TIME_LIMIT_SEC = 2.0;
    private static final double TIME_LIMIT_SAFETY_FACTOR = 1.5;



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
            PlagiarismController plagiarismController) {
        this.testRepository = testRepository;
        this.testLinkRepository = testLinkRepository;
        this.studentRepository = studentRepository;
        this.submissionRepository = submissionRepository;
        this.submissionResultRepository = submissionResultRepository;
        this.scoreCalculationService = scoreCalculationService;
        this.plagiarismController = plagiarismController;
    }

    // =========================================================================
    // CREATE TEST
    // =========================================================================

    @Transactional
    public TestResponseDTO createTest(CreateTestDTO dto) {
        Test test = new Test();
        test.setTitle(dto.getTitle());
        test.setDuration(dto.getDuration());
        test.setCreatedBy(dto.getCreatedBy());
        test.setStatus("draft");

        dto.getQuestions().forEach(qdto -> test.addQuestion(mapToQuestionEntity(qdto, test)));

        Test saved = testRepository.save(test);
        return new TestResponseDTO(saved.getId(), "/exam/" + saved.getId());
    }

    private Question mapToQuestionEntity(CreateTestDTO.QuestionDTO qdto, Test parentTest) {
        Question q = new Question();
        q.setDescription(qdto.getDescription());
        q.setMarks(qdto.getMarks());
        q.setTest(parentTest);
        q.setMaxInputSize(qdto.getMaxInputSize());
        q.setComplexity(qdto.getComplexity());
        q.setBaseTimeLimit(qdto.getBaseTimeLimit() != null ? qdto.getBaseTimeLimit() : 1.0);
        q.setTimeLimitSec(calculateTimeLimit(q.getMaxInputSize(), q.getComplexity(), q.getBaseTimeLimit()));
        q.setAiGeneratedSolution(qdto.getAiSolution());
        qdto.getTestCases().forEach(tcDto -> q.addTestCase(mapToTestCaseEntity(tcDto, q)));
        return q;
    }

    private double calculateTimeLimit(Long maxInputSize, String complexity, Double baseTimeLimit) {
        if (maxInputSize == null || complexity == null || baseTimeLimit == null || maxInputSize <= 0) {
            return DEFAULT_TIME_LIMIT_SEC;
        }

        double ops = switch (complexity) {
            case "O(N)"     -> (double) maxInputSize;
            case "O(NlogN)" -> maxInputSize * (Math.log(maxInputSize) / Math.log(2));
            case "O(N^2)"   -> Math.pow(maxInputSize, 2);
            case "O(N^3)"   -> Math.pow(maxInputSize, 3);
            default         -> (double) maxInputSize;
        };

        return Math.max(baseTimeLimit, TIME_LIMIT_SAFETY_FACTOR * (ops / OPS_PER_SECOND));
    }

    private TestCase mapToTestCaseEntity(CreateTestDTO.TestCaseDTO tcDto, Question parentQuestion) {
        TestCase tc = new TestCase();
        tc.setInputData(tcDto.getInputData());
        tc.setExpectedOutput(tcDto.getExpectedOutput());
        tc.setExampleCase(tcDto.isExampleCase());
        tc.setQuestion(parentQuestion);
        return tc;
    }

    // =========================================================================
    // READ / QUERY
    // =========================================================================

    public Test getTest(Long id) {
        return testRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Test not found with ID: " + id));
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

    public TestDetailsDTO getTestByLinkToken(String token) {
        TestLink link = testLinkRepository.findByLinkToken(token.trim())
                .orElseThrow(() -> new RuntimeException("Invalid test link: " + token));
        return mapToTestDetailsDTO(link.getTest());
    }

    private TestDetailsDTO mapToTestDetailsDTO(Test test) {
        List<QuestionDetailsDTO> questions = test.getQuestions().stream()
                .map(q -> {
                    List<TestCaseDetailsDTO> testCases = q.getTestCases().stream()
                            .map(tc -> new TestCaseDetailsDTO(
                                    tc.getId(), tc.getInputData(), tc.getExpectedOutput(), tc.isExampleCase()))
                            .collect(Collectors.toList());

                    return new QuestionDetailsDTO(
                            q.getId(), q.getDescription(), q.getMarks(), testCases, q.getAiGeneratedSolution());
                })
                .collect(Collectors.toList());

        return new TestDetailsDTO(
                test.getId(), test.getTitle(), test.getDuration(),
                test.getCreatedBy(), test.getStatus(), questions);
    }

    // =========================================================================
    // TEST LIFECYCLE
    // =========================================================================

    @Transactional
    public void softDeleteTest(Long testId) {
        Test test = testRepository.findById(testId)
                .orElseThrow(() -> new RuntimeException("Test not found with ID: " + testId));
        test.setDeleted(true);
        testRepository.save(test);
    }

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

    // =========================================================================
    // LINKS
    // =========================================================================

    @Transactional
    public String generateTestLink(Long testId) {
        Test test = testRepository.findById(testId)
                .orElseThrow(() -> new RuntimeException("Test not found with ID: " + testId));

        TestLink link = new TestLink();
        link.setTest(test);
        link.setLinkToken(UUID.randomUUID().toString());
        testLinkRepository.save(link);

        return "http://localhost:3000/test/" + link.getLinkToken();
    }

    // =========================================================================
    // STUDENT
    // =========================================================================

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

    @Transactional
    public Student saveFinalSubmission(String token, FinalSubmitDTO dto) {
        TestLink link = testLinkRepository.findByLinkToken(token.trim())
                .orElseThrow(() -> new RuntimeException("Invalid test link"));

        Test test = link.getTest();

        Student student = studentRepository.findByEmailAndTestId(dto.getEmail(), test.getId())
                .orElseGet(() -> {
                    Student s = new Student();
                    s.setTest(test);
                    s.setEmail(dto.getEmail());
                    return s;
                });

        student.setName(dto.getName());
        student.setBatch(dto.getBatch());
        student.setSubmittedAt(dto.getSubmittedAt() != null ? dto.getSubmittedAt() : LocalDateTime.now());
        student.setTabSwitchCount(dto.getTabSwitchCount());
        student.setCopyPasteAttempts(dto.getCopyPasteAttempts());
        student.setScore(scoreCalculationService.calculateScoreWithPenalties(dto, test.getQuestions().size()));

        return studentRepository.save(student);
    }

    public List<Student> getStudentsByTest(Long testId) {
        return studentRepository.findByTestId(testId);
    }

    // =========================================================================
    // RESULTS  (main optimization: bulk-fetch submissions once per test)
    // =========================================================================

    public List<StudentResultDTO> getTestResults(Long testId) {

        Test test = testRepository.findById(testId)
                .orElseThrow(() -> new RuntimeException("Test not found"));
    
        int totalMarks = test.getQuestions().stream()
                .mapToInt(Question::getMarks)
                .sum();
    
        // Bulk fetch ALL submissions once
        List<Submission> allSubmissions = submissionRepository.findByTestId(testId);
    
        // Group submissions by student
        Map<Long, List<Submission>> subsByStudent = allSubmissions.stream()
                .collect(Collectors.groupingBy(Submission::getStudentId));
    
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
            dto.setTabSwitchCount(student.getTabSwitchCount());
            dto.setCopyPasteAttempts(student.getCopyPasteAttempts());
    
            List<Submission> mySubmissions =
                    subsByStudent.getOrDefault(student.getId(), List.of());
    
            // Recompute score fresh from actual test case results (ignores stale stored value)
            List<StudentResultDTO.QuestionResultDTO> questionResults = buildQuestionResults(mySubmissions, test);
            int recomputedScore = questionResults.stream()
                    .mapToInt(q -> (int) Math.round(q.getEarnedPoints()))
                    .sum();
            dto.setScore(Math.min(100, recomputedScore));
    
            // 🔥 REMOVE PLAGIARISM COMPLETELY
            dto.setPlagiarismScore(null);
            dto.setSimilaritySource(null);
    
            // Keep student submitted code (latest submission if exists)
            if (!mySubmissions.isEmpty()) {
                Submission latest = mySubmissions.get(mySubmissions.size() - 1);
                dto.setSubmittedCode(latest.getSource());
            } else {
                dto.setSubmittedCode(null);
            }
    
            // Keep full question report (reuse already-built list)
            dto.setQuestionResults(questionResults);
    
            return dto;
    
        }).collect(Collectors.toList());
    }

    // =========================================================================
    // QUESTION-LEVEL RESULTS
    // =========================================================================

    private List<StudentResultDTO.QuestionResultDTO> buildQuestionResults(
            List<Submission> mySubmissions,
            Test test) {

        // Index this student's submissions by questionId for O(1) lookup
        Map<Long, List<Submission>> mySubsByQuestion = mySubmissions.stream()
                .collect(Collectors.groupingBy(Submission::getQuestionId));

        return test.getQuestions().stream().map(question -> {
            StudentResultDTO.QuestionResultDTO qDto = new StudentResultDTO.QuestionResultDTO();
            qDto.setQuestionId(question.getId());
            qDto.setQuestionDescription(question.getDescription());
            qDto.setQuestionMarks(question.getMarks());
            qDto.setAiGeneratedSolution(question.getAiGeneratedSolution());

            List<Submission> questionSubs = mySubsByQuestion.getOrDefault(question.getId(), List.of());

            if (questionSubs.isEmpty()) {
                qDto.setCorrect(false);
                qDto.setAttempts(0);
                qDto.setPassedTestCases(0);
                qDto.setTotalTestCases(question.getTestCases().size());
                qDto.setEarnedPoints(0.0);
                qDto.setTestCaseResults(List.of());
                qDto.setSubmittedCode(null);
                qDto.setLanguage(null);
                qDto.setPlagiarismScore(0.0);
                qDto.setSimilaritySource("unknown");
                return qDto;
            }

            Submission latestSub = questionSubs.get(questionSubs.size() - 1);
            qDto.setSubmittedCode(latestSub.getSource());
            qDto.setLanguage(latestSub.getLanguage());

            List<SubmissionResult> results = submissionResultRepository.findBySubmissionId(latestSub.getId());
            int totalTestCases = results.size();
            long passedCount = results.stream()
                    .filter(r -> "AC".equalsIgnoreCase(r.getStatus()))
                    .count();

            qDto.setCorrect(passedCount == totalTestCases && totalTestCases > 0);
            qDto.setAttempts(questionSubs.size());
            qDto.setPassedTestCases((int) passedCount);
            qDto.setTotalTestCases(totalTestCases);

            double pointsPerQuestion = 100.0 / test.getQuestions().size();
            double earnedPoints = totalTestCases > 0
                    ? (passedCount * pointsPerQuestion) / totalTestCases
                    : 0.0;
            qDto.setEarnedPoints(Math.round(earnedPoints * 100.0) / 100.0);

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

            // Per-question plagiarism — AI only
            computePerQuestionPlagiarism(qDto, question, latestSub);

            return qDto;
        }).collect(Collectors.toList());
    }

    /**
     * Computes per-question plagiarism (AI only) and writes results into qDto.
     */
    private void computePerQuestionPlagiarism(
            StudentResultDTO.QuestionResultDTO qDto,
            Question question,
            Submission latestSub) {

        try {
            String myCode = latestSub.getSource();
            if (myCode == null || myCode.isBlank()) {
                qDto.setPlagiarismScore(0.0);
                qDto.setSimilaritySource("unknown");
                return;
            }

            // AI similarity only
            double aiScore = 0.0;
            String aiCode = question.getAiGeneratedSolution();
            if (aiCode != null && !aiCode.isBlank()) {
                Double tmp = plagiarismController.callPlagiarismService(myCode, aiCode);
                aiScore = tmp != null ? tmp : 0.0;
            }

            qDto.setPlagiarismScore(Math.round(aiScore * 100.0) / 100.0);
            qDto.setSimilaritySource(aiScore > 0 ? "ai" : "unknown");

        } catch (Exception e) {
            qDto.setPlagiarismScore(0.0);
            qDto.setSimilaritySource("unknown");
        }
    }

    // =========================================================================
    // TOP-LEVEL PLAGIARISM  (student vs AI only)
    // =========================================================================

    private static class PlagiarismResult {
        double score = 0.0;
        String studentSubmittedCode = null;
        String aiMatchedCode = null;
        String similaritySource = "unknown";
    }

    /**
     * Compares student's latest submission against each question's AI solution.
     * No student-vs-student comparison is performed.
     */
    private PlagiarismResult computePlagiarismResult(List<Submission> mySubmissions, Test test) {
        PlagiarismResult out = new PlagiarismResult();

        try {
            if (mySubmissions.isEmpty()) {
                out.similaritySource = "pass";
                return out;
            }

            // Use the student's latest submission
            String myCode = mySubmissions.get(mySubmissions.size() - 1).getSource();
            if (myCode == null || myCode.isBlank()) {
                out.similaritySource = "pass";
                return out;
            }
            out.studentSubmittedCode = myCode;

            // Compare against each question's AI solution; keep the highest score
            double bestAiScore = 0.0;
            for (Question q : test.getQuestions()) {
                String aiCode = q.getAiGeneratedSolution();
                if (aiCode == null || aiCode.isBlank()) continue;
                Double score = plagiarismController.callPlagiarismService(myCode, aiCode);
                double val = score != null ? score : 0.0;
                if (val > bestAiScore) {
                    bestAiScore = val;
                    out.aiMatchedCode = aiCode;
                }
            }

            out.score = Math.round(bestAiScore * 100.0) / 100.0;
            out.similaritySource = bestAiScore >= PLAGIARISM_FLAG_THRESHOLD ? "ai" : "pass";

        } catch (Exception e) {
            out.score = 0.0;
            out.similaritySource = "pass";
        }

        return out;
    }
}