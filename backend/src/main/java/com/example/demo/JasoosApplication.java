package com.example.demo;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;

@SpringBootApplication
@EntityScan(basePackages = {"com.example.demo.entity", "com.smartproctoring.entity"})
public class JasoosApplication {
	public static void main(String[] args) {
		SpringApplication.run(JasoosApplication.class, args);
	}
}