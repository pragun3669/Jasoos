package com.example.demo.repository.teacher;

import org.springframework.data.jpa.repository.JpaRepository;
import com.example.demo.entity.teacher.TestLink;

import java.util.Optional;

public interface TestLinkRepository extends JpaRepository<TestLink, Long> {
    Optional<TestLink> findByLinkToken(String token);
}
