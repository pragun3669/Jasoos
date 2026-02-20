package com.example.demo.service;

import com.example.demo.dto.AITestGenerationRequestDTO;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
public class AITestService {

    private static final String FASTAPI_URL =
            "http://localhost:8000/ai/generate";

            public Object generateTest(AITestGenerationRequestDTO request) {

                RestTemplate restTemplate = new RestTemplate();
            
                HttpHeaders headers = new HttpHeaders();
                headers.setContentType(MediaType.APPLICATION_JSON);
            
                HttpEntity<AITestGenerationRequestDTO> entity =
                        new HttpEntity<>(request, headers);
            
                ResponseEntity<Object> response =
                        restTemplate.exchange(
                                FASTAPI_URL,
                                HttpMethod.POST,
                                entity,
                                Object.class
                        );
            
                return response.getBody();
            }
}
