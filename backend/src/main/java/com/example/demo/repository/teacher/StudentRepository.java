package com.example.demo.repository.teacher;

import org.springframework.data.jpa.repository.JpaRepository;
import com.example.demo.entity.teacher.Student;

import java.util.List;
import java.util.Optional;

public interface StudentRepository extends JpaRepository<Student, Long> {
    // Fetch all students belonging to a specific test
    List<Student> findByTestId(Long testId);
    Optional<Student> findByEmailAndTestId(String email, Long testId);
}