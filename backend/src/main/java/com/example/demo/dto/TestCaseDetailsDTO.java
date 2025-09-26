package com.example.demo.dto;

public class TestCaseDetailsDTO {
    private Long id;
    private String inputData;
    private String expectedOutput;
    private boolean exampleCase;

    public TestCaseDetailsDTO(Long id, String inputData, String expectedOutput, boolean exampleCase) {
        this.id = id;
        this.inputData = inputData;
        this.expectedOutput = expectedOutput;
        this.exampleCase = exampleCase;
    }

    // Getters
    public Long getId() { return id; }
    public String getInputData() { return inputData; }
    public String getExpectedOutput() { return expectedOutput; }
    public boolean isExampleCase() { return exampleCase; }
}
