package com.example.demo.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

@Service
public class AICodeGeneratorService {

    @Value("${groq.api.key}")
    private String groqApiKey;

    private static final String GROQ_URL =
            "https://api.groq.com/openai/v1/chat/completions";

    public String generateSolution(String questionDescription) {

        try {
            RestTemplate restTemplate = new RestTemplate();

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("Authorization", "Bearer " + groqApiKey);

            // Input message for model
            Map<String, Object> message = new HashMap<>();
            message.put("role", "user");
            message.put("content",
                    "Write an optimal C++ solution to this programming question. " +
                    "Return ONLY clean C++ code. No explanation, no comments.\n\n" +
                    questionDescription
            );

            // Request body (Groq/OpenAI format)
            Map<String, Object> body = new HashMap<>();
            body.put("model", "llama-3.1-8b-instant");   // ✔ FINAL WORKING MODEL
            body.put("messages", new Object[]{message});
            body.put("temperature", 0.2);
            body.put("max_tokens", 800);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

            ResponseEntity<Map> response =
                    restTemplate.exchange(GROQ_URL, HttpMethod.POST, entity, Map.class);

            Map<String, Object> responseBody = response.getBody();

            if (responseBody != null && responseBody.containsKey("choices")) {
                var choices = (java.util.List<Map<String, Object>>) responseBody.get("choices");

                if (!choices.isEmpty()) {
                    Map<String, Object> msg =
                            (Map<String, Object>) choices.get(0).get("message");

                    return msg.get("content").toString();
                }
            }

        } catch (Exception e) {
            return "// AI generation error: " + e.getMessage();
        }

        return "// AI failed to generate code";
    }
}
