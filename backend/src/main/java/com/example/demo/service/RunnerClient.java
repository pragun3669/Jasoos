package com.example.demo.service;

import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

@Component
public class RunnerClient {

    private final RestTemplate restTemplate = new RestTemplate();

    // Runner service URL (Docker service name: "runner", port: 5000)
    private static final String RUNNER_URL = "http://runner:5000/run";

//    public void sendJob(Long submissionId, String language, String filename, String source) {
//        try {
//            // Build the payload
//            Map<String, Object> job = new HashMap<>();
//            job.put("submissionId", submissionId);
//            job.put("language", language);
//            job.put("filename", filename);
//            job.put("source", source);
//
//            // Send POST to runner
//            restTemplate.postForEntity(RUNNER_URL, job, String.class);
//
//            System.out.println("✅ Job sent to runner for submissionId=" + submissionId);
//
//        } catch (Exception e) {
//            System.err.println("❌ Error sending job to runner: " + e.getMessage());
//        }
//    }

}
