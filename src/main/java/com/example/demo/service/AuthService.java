package com.example.demo.service;

import com.example.demo.dto.SignupDTO;
import com.example.demo.entity.Admin;
import com.example.demo.entity.Teacher;
import com.example.demo.repository.admin.AdminRepository;
import com.example.demo.repository.teacher.TeacherRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {
    private static final Logger logger = LoggerFactory.getLogger(AuthService.class);

    private final TeacherRepository teacherRepository;
    private final AdminRepository adminRepository;
    private final PasswordEncoder passwordEncoder;

    // Constructor injection is a best practice, so we'll keep it.
    public AuthService(TeacherRepository teacherRepository, AdminRepository adminRepository, PasswordEncoder passwordEncoder) {
        this.teacherRepository = teacherRepository;
        this.adminRepository = adminRepository;
        this.passwordEncoder = passwordEncoder;
    }

    /**
     * Main public-facing signup method.
     * It now explicitly blocks any attempt to create an Admin.
     */
    public String signup(SignupDTO signupDTO) {
        logger.info("Attempting signup for username: {}", signupDTO.getUsername());
        String role = signupDTO.getRole().toUpperCase();

        if ("TEACHER".equals(role)) {
            return signupTeacher(signupDTO);
        } else if ("ADMIN".equals(role)) {
            // --- FIX: Block Admin creation from the public signup endpoint ---
            logger.warn("Blocked attempt to create an ADMIN account for username: {}", signupDTO.getUsername());
            throw new IllegalArgumentException("Admin account creation is not allowed via this endpoint.");
        } else {
            logger.error("Invalid role specified during signup: {}", role);
            throw new IllegalArgumentException("Invalid role specified: " + role);
        }
    }

    /**
     *  Handles teacher signup within a transaction linked to the 'teacher' database.
     *  This method remains unchanged.
     */
    @Transactional("teacherTransactionManager")
    public String signupTeacher(SignupDTO signupDTO) {
        logger.info("Checking for existing teacher: {}", signupDTO.getUsername());
        // A better practice is to use `existsByUsername` in the repository for efficiency.
        if (teacherRepository.findByUsername(signupDTO.getUsername()) != null) {
            logger.warn("Teacher signup failed, username already exists: {}", signupDTO.getUsername());
            throw new IllegalArgumentException("Username already taken");
        }

        Teacher teacher = new Teacher();
        teacher.setUsername(signupDTO.getUsername());
        teacher.setPassword(passwordEncoder.encode(signupDTO.getPassword()));
        teacher.setName(signupDTO.getName());
        teacher.setRole("TEACHER");

        logger.info("Saving new teacher: {}", signupDTO.getUsername());
        teacherRepository.save(teacher);
        logger.info("Teacher registered successfully: {}", signupDTO.getUsername());
        return "Teacher registered successfully!";
    }

    /**
     *  Handles admin signup. This method is now effectively internal and can only be
     *  called from other parts of the service, not from the public signup endpoint.
     */
    @Transactional("adminTransactionManager")
    public String signupAdmin(SignupDTO signupDTO) {
        logger.info("Checking for existing admin: {}", signupDTO.getUsername());
        if (adminRepository.findByUsername(signupDTO.getUsername()) != null) {
            logger.warn("Admin signup failed, username already exists: {}", signupDTO.getUsername());
            throw new IllegalArgumentException("Username already taken");
        }

        Admin admin = new Admin();
        admin.setUsername(signupDTO.getUsername());
        admin.setPassword(passwordEncoder.encode(signupDTO.getPassword()));
        admin.setName(signupDTO.getName());
        admin.setRole("ADMIN");

        logger.info("Saving new admin: {}", signupDTO.getUsername());
        adminRepository.save(admin);
        logger.info("Admin registered successfully: {}", signupDTO.getUsername());
        return "Admin registered successfully!";
    }
}