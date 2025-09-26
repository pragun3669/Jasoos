package com.example.demo.service;


import com.example.demo.entity.Admin;
import com.example.demo.entity.Teacher;
import com.example.demo.repository.admin.AdminRepository;
import com.example.demo.repository.teacher.TeacherRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    @Autowired
    private TeacherRepository teacherRepository;

    @Autowired
    private AdminRepository adminRepository;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        // Try to find in Teacher database
        Teacher teacher = teacherRepository.findByUsername(username);
        if (teacher != null) {
            return new CustomUserDetails(teacher.getUsername(), teacher.getPassword(), teacher.getRole());
        }

        // Try to find in Admin database
        Admin admin = adminRepository.findByUsername(username);
        if (admin != null) {
            return new CustomUserDetails(admin.getUsername(), admin.getPassword(), admin.getRole());
        }

        throw new UsernameNotFoundException("User not found: " + username);
    }
}