package com.example.demo.repository.teacher;


import org.springframework.data.jpa.repository.JpaRepository;

import com.example.demo.entity.teacher.TestCase;

import java.util.List;

public interface TestCaseRepository extends JpaRepository<TestCase, Long> {
    /**
     * Finds all TestCase entities associated with a given question ID.
     * Spring Data JPA automatically implements this method by looking for
     * the 'question' field in the TestCase entity and matching its 'id'.
     *
     * @param questionId The ID of the Question to find test cases for.
     * @return A list of matching TestCase entities.
     */
    List<TestCase> findByQuestionId(Long questionId);

    long countByQuestionId(Long questionId);
}