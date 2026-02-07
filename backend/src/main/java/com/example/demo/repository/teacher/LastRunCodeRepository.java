package com.example.demo.repository.teacher;

import com.example.demo.entity.teacher.LastRunCode;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LastRunCodeRepository extends JpaRepository<LastRunCode, Long> {
    Optional<LastRunCode> findByStudentIdAndTestIdAndQuestionId(Long studentId, Long testId, Long questionId);
    List<LastRunCode> findByStudentIdAndTestId(Long studentId, Long testId);
    void deleteByStudentIdAndTestId(Long studentId, Long testId);
    void deleteByStudentIdAndTestIdAndQuestionId(Long studentId, Long testId, Long questionId);
}
