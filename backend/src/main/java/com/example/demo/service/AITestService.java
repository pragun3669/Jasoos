package com.example.demo.service;

import com.example.demo.dto.AITestGenerationRequestDTO;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
public class AITestService {

    private final RestTemplate restTemplate;

    @Value("${ai.base.url}")
    private String aiBaseUrl;

    public AITestService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    public Object generateTest(AITestGenerationRequestDTO request) {

        String url = aiBaseUrl + "/ai/generate";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<AITestGenerationRequestDTO> entity =
                new HttpEntity<>(request, headers);

        ResponseEntity<Object> response =
                restTemplate.exchange(
                        url,
                        HttpMethod.POST,
                        entity,
                        Object.class
                );

        return response.getBody();
    }
}