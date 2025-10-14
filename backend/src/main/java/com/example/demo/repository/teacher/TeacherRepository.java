package com.example.demo.repository.teacher;

import com.example.demo.entity.teacher.Teacher;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TeacherRepository extends JpaRepository<Teacher, Long> { // Change String to Long
    Teacher findByUsername(String username);
}