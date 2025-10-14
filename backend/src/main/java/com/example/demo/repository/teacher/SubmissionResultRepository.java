package com.example.demo.repository.teacher;

import com.example.demo.entity.teacher.SubmissionResult;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface SubmissionResultRepository extends JpaRepository<SubmissionResult, Long> {
    // Fetch all submission results for a given submission
    List<SubmissionResult> findBySubmissionId(Long submissionId);
}
