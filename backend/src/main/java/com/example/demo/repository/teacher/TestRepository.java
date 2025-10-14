package com.example.demo.repository.teacher;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import com.example.demo.entity.teacher.Test;

public interface TestRepository extends JpaRepository<Test, Long> {

    // Add this method to fetch all tests by a teacher
    List<Test> findByCreatedBy(Long createdBy);
}
