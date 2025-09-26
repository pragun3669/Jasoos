package com.example.demo.repository.teacher;


import org.springframework.data.jpa.repository.JpaRepository;

import com.example.demo.entity.TestCase;

public interface TestCaseRepository extends JpaRepository<TestCase, Long> {
}
