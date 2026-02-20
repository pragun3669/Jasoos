package com.example.demo.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/plagiarism")
public class PlagiarismController {

    private final RestTemplate restTemplate;

    @Autowired
    public PlagiarismController(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    /**
     * INTERNAL METHOD FOR SERVICES
     * Calls Python microservice to compute plagiarism score.
     *
     * @param codeA first student's code
     * @param codeB second student's code
     * @return plagiarism score (0-100 scale) or null if failed
     */
    public Double callPlagiarismService(String codeA, String codeB) {
        try {
            String url = "http://localhost:8000/plagiarism/predict";
    
            Map<String, Object> payload = new HashMap<>();
            payload.put("codeA", codeA);
            payload.put("codeB", codeB);
    
            ResponseEntity<Map> resp = restTemplate.postForEntity(url, payload, Map.class);
    
            if (!resp.getStatusCode().is2xxSuccessful() || resp.getBody() == null) {
                return 0.0;
            }
    
            Object scoreObj = resp.getBody().get("plagiarism_score");
    
            return (scoreObj instanceof Number) 
                    ? ((Number) scoreObj).doubleValue() 
                    : 0.0;
    
        } catch (Exception e) {
            return 0.0;
        }
    }
    

    /**
     * OPTIONAL PUBLIC ENDPOINT FOR TESTING
     */
    @PostMapping("/test")
    public Map<String, Object> testPair(@RequestBody Map<String, String> body) {
        String codeA = body.getOrDefault("codeA", "");
        String codeB = body.getOrDefault("codeB", "");

        Double score = callPlagiarismService(codeA, codeB);

        Map<String, Object> result = new HashMap<>();
        result.put("score", score);
        return result;
    }
}
