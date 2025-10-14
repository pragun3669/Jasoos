package com.example.demo.repository.admin;

import com.example.demo.entity.admin.Admin;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AdminRepository extends JpaRepository<Admin, Long> { // Change String to Long
    Admin findByUsername(String username);
}