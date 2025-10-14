package com.example.demo.controller;

import com.example.demo.dto.LoginDTO;
import com.example.demo.dto.SignupDTO;
import com.example.demo.entity.teacher.Teacher;
import com.example.demo.service.AuthService;
import com.example.demo.util.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final JwtUtil jwtUtil;

    @Autowired
    public AuthController(AuthService authService, JwtUtil jwtUtil) {
        this.authService = authService;
        this.jwtUtil = jwtUtil;
    }

    @PostMapping("/signup")
    public ResponseEntity<String> signup(@RequestBody SignupDTO signupDTO) {
        return ResponseEntity.ok(authService.signup(signupDTO));
    }

    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@RequestBody LoginDTO loginDTO) {
        Map<String, Object> response = new HashMap<>();
        try {
            // Authenticate teacher
            Teacher teacher = authService.loginTeacher(loginDTO.getUsername(), loginDTO.getPassword());

            // Generate JWT token
           // Generate JWT token
String token = jwtUtil.generateToken(
    teacher.getUsername(),
    teacher.getId(),
    teacher.getRole()
);


            // Return teacher info + token
            Map<String, Object> userData = new HashMap<>();
            userData.put("id", teacher.getId());
            userData.put("username", teacher.getUsername());
            userData.put("name", teacher.getName());
            userData.put("role", teacher.getRole());
            userData.put("token", token);  // <-- Add JWT token here

            response.put("success", true);
            response.put("message", "Login successful!");
            response.put("user", userData);

            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException e) {
            // Invalid credentials
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
        }
    }
}
