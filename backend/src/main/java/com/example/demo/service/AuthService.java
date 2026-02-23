package com.example.demo.service;

import com.example.demo.dto.SignupDTO;
import com.example.demo.entity.admin.Admin;
import com.example.demo.entity.teacher.Teacher;
import com.example.demo.repository.admin.AdminRepository;
import com.example.demo.repository.teacher.TeacherRepository;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.jackson2.JacksonFactory;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;

@Service
public class AuthService {

    private static final Logger logger = LoggerFactory.getLogger(AuthService.class);

    private final TeacherRepository teacherRepository;
    private final AdminRepository adminRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${google.client.id}")
    private String googleClientId;

    public AuthService(TeacherRepository teacherRepository,
                       AdminRepository adminRepository,
                       PasswordEncoder passwordEncoder) {
        this.teacherRepository = teacherRepository;
        this.adminRepository = adminRepository;
        this.passwordEncoder = passwordEncoder;
    }

    // =====================================================
    // PUBLIC SIGNUP
    // =====================================================

    public String signup(SignupDTO signupDTO) {

        logger.info("Attempting signup for username: {}", signupDTO.getUsername());

        String role = signupDTO.getRole().toUpperCase();

        if ("TEACHER".equals(role)) {
            return signupTeacher(signupDTO);
        } else if ("ADMIN".equals(role)) {
            logger.warn("Blocked attempt to create ADMIN account for username: {}", signupDTO.getUsername());
            throw new IllegalArgumentException("Admin account creation is not allowed via this endpoint.");
        } else {
            logger.error("Invalid role specified during signup: {}", role);
            throw new IllegalArgumentException("Invalid role specified: " + role);
        }
    }

    // =====================================================
    // TEACHER SIGNUP
    // =====================================================

    @Transactional("teacherTransactionManager")
    public String signupTeacher(SignupDTO signupDTO) {

        logger.info("Checking for existing teacher: {}", signupDTO.getUsername());

        if (teacherRepository.findByUsername(signupDTO.getUsername()) != null) {
            logger.warn("Teacher signup failed, username already exists: {}", signupDTO.getUsername());
            throw new IllegalArgumentException("Username already taken");
        }

        Teacher teacher = new Teacher();
        teacher.setUsername(signupDTO.getUsername());
        teacher.setPassword(passwordEncoder.encode(signupDTO.getPassword()));
        teacher.setName(signupDTO.getName());
        teacher.setRole("TEACHER");

        teacherRepository.save(teacher);

        logger.info("Teacher registered successfully: {}", signupDTO.getUsername());

        return "Teacher registered successfully!";
    }

    // =====================================================
    // TEACHER LOGIN
    // =====================================================

    @Transactional("teacherTransactionManager")
    public Teacher loginTeacher(String username, String rawPassword) {

        Teacher teacher = teacherRepository.findByUsername(username);

        if (teacher == null || !passwordEncoder.matches(rawPassword, teacher.getPassword())) {
            throw new IllegalArgumentException("Invalid username or password");
        }

        return teacher;
    }

    // =====================================================
    // GOOGLE LOGIN
    // =====================================================

    @Transactional("teacherTransactionManager")
    public Teacher loginWithGoogle(String idTokenString) throws Exception {

        GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(
                new NetHttpTransport(),
                new JacksonFactory())
                .setAudience(Collections.singletonList(googleClientId))
                .build();

        GoogleIdToken idToken = verifier.verify(idTokenString);

        if (idToken == null) {
            throw new IllegalArgumentException("Invalid Google token");
        }

        GoogleIdToken.Payload payload = idToken.getPayload();

        String email = payload.getEmail();
        String name = (String) payload.get("name");

        Teacher teacher = teacherRepository.findByUsername(email);

        if (teacher == null) {

            teacher = new Teacher();
            teacher.setUsername(email);
            teacher.setPassword(passwordEncoder.encode("GOOGLE_USER"));
            teacher.setName(name);
            teacher.setRole("TEACHER");

            teacherRepository.save(teacher);

            logger.info("New Google user registered: {}", email);
        }

        return teacher;
    }

    // =====================================================
    // ADMIN SIGNUP (INTERNAL USE)
    // =====================================================

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

        adminRepository.save(admin);

        logger.info("Admin registered successfully: {}", signupDTO.getUsername());

        return "Admin registered successfully!";
    }
}