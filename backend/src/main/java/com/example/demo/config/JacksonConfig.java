package com.example.demo.config;

import com.fasterxml.jackson.core.StreamWriteConstraints;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.context.annotation.Bean;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.context.annotation.Configuration;

@Configuration
public class JacksonConfig {

    @Bean
    public ObjectMapper objectMapper() {
        ObjectMapper mapper = new ObjectMapper();
        // Increase max nesting depth (default 1000)
        mapper.registerModule(new JavaTimeModule()); 
        mapper.getFactory().setStreamWriteConstraints(
            StreamWriteConstraints.builder().maxNestingDepth(5000).build()
        );
        return mapper;
    }
}
