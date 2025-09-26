package com.example.demo.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.example.demo.dto.CreateTestDTO;
import com.example.demo.dto.TestResponseDTO;
import com.example.demo.dto.TestDetailsDTO;
import com.example.demo.dto.QuestionDetailsDTO;
import com.example.demo.dto.TestCaseDetailsDTO;
import com.example.demo.entity.Question;
import com.example.demo.entity.Test;
import com.example.demo.entity.TestCase;
import com.example.demo.repository.teacher.TestRepository;

@Service
public class TestService {

    private final TestRepository testRepository;

    public TestService(TestRepository testRepository) {
        this.testRepository = testRepository;
    }

    // --- CREATE TEST ---
    public TestResponseDTO createTest(CreateTestDTO dto) {
        Test test = new Test();
        test.setTitle(dto.getTitle());
        test.setDuration(dto.getDuration());
        test.setCreatedBy(dto.getCreatedBy());
        test.setStatus("draft"); // default status

        // map questions and set the parent reference
        List<Question> questions = dto.getQuestions().stream()
                .map(qdto -> mapToQuestionEntity(qdto, test))
                .collect(Collectors.toList());
        test.setQuestions(questions);

        Test saved = testRepository.save(test);
        String link = "/exam/" + saved.getId();

        return new TestResponseDTO(saved.getId(), link);
    }

    // --- MAP QUESTION DTO TO ENTITY ---
    private Question mapToQuestionEntity(CreateTestDTO.QuestionDTO qdto, Test parentTest) {
        Question q = new Question();
        q.setDescription(qdto.description);
        q.setMarks(qdto.marks);
        q.setTest(parentTest); // 🔑 set back-reference

        // map test cases and set parent reference
        List<TestCase> testCases = qdto.testCases.stream()
                .map(tcDto -> mapToTestCaseEntity(tcDto, q))
                .collect(Collectors.toList());
        q.setTestCases(testCases);

        return q;
    }

    // --- MAP TEST CASE DTO TO ENTITY ---
    private TestCase mapToTestCaseEntity(CreateTestDTO.TestCaseDTO tcDto, Question parentQuestion) {
        TestCase tc = new TestCase();
        tc.setInputData(tcDto.inputData);
        tc.setExpectedOutput(tcDto.expectedOutput);
        tc.setExampleCase(tcDto.exampleCase);
        tc.setQuestion(parentQuestion); // 🔑 set back-reference
        return tc;
    }

    // --- GET RAW TEST ENTITY ---
    public Test getTest(Long id) {
        return testRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Test not found"));
    }

    // --- MAP TEST ENTITY TO DTO ---
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

                    return new QuestionDetailsDTO(q.getId(), q.getDescription(), q.getMarks(), testCases);
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

    // --- GET TEST DETAILS BY ID ---
    public TestDetailsDTO getTestDetails(Long id) {
        Test test = testRepository.findById(id).orElse(null);
        if (test == null) return null;
        return mapToTestDetailsDTO(test);
    }

    // --- GET ALL TESTS CREATED BY A TEACHER ---
    public List<TestDetailsDTO> getTestsByTeacher(Long teacherId) {
        List<Test> tests = testRepository.findByCreatedBy(teacherId);
        return tests.stream()
                .map(this::mapToTestDetailsDTO)
                .collect(Collectors.toList());
    }
}
