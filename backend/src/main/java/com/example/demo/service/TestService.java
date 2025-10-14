package com.example.demo.service;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import java.time.LocalDateTime;

import jakarta.transaction.Transactional;
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

@Service
public class TestService {

    private final TestRepository testRepository;
    private final TestLinkRepository testLinkRepository;
    private final StudentRepository studentRepository;
    private final SubmissionRepository submissionRepository;
    private final SubmissionResultRepository submissionResultRepository;
    private final ScoreCalculationService scoreCalculationService;

    public TestService(
            TestRepository testRepository,
            TestLinkRepository testLinkRepository,
            StudentRepository studentRepository,
            SubmissionRepository submissionRepository,
            SubmissionResultRepository submissionResultRepository,
            ScoreCalculationService scoreCalculationService
    ) {
        this.testRepository = testRepository;
        this.testLinkRepository = testLinkRepository;
        this.studentRepository = studentRepository;
        this.submissionRepository = submissionRepository;
        this.submissionResultRepository = submissionResultRepository;
        this.scoreCalculationService = scoreCalculationService;
    }

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
                            testCases
                    );
                })
                .collect(Collectors.toList());

        return new TestDetailsDTO(
                test.getId(),
                test.getTitle(),
                test.getDuration(),
                test.getCreatedBy(),
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
            dto.setSubmissionTime(student.getSubmittedAt());
            dto.setTotalMarks(totalMarks);
            dto.setScore(student.getScore() != null ? student.getScore() : 0);
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
                return qDto;
            }
    
            // Latest submission
            Submission latestSub = questionSubs.get(questionSubs.size() - 1);
            
            // ✅ ADD THESE TWO LINES:
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
    
            return qDto;
        }).collect(Collectors.toList());
    }
}