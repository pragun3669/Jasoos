package com.example.demo.repository.teacher;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.example.demo.entity.teacher.Submission;

import java.util.List;

@Repository
public interface SubmissionRepository extends JpaRepository<Submission, Long> {
    List<Submission> findByStudentId(Long studentId);
    List<Submission> findByTestId(Long testId);
    
    // New method to fetch submissions of a student for a specific test
    List<Submission> findByStudentIdAndTestId(Long studentId, Long testId);
}
