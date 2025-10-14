package com.example.demo.service;

import org.springframework.stereotype.Service;
import com.example.demo.dto.FinalSubmitDTO;
import com.example.demo.dto.FinalSubmitDTO.QuestionResultDTO;
import com.example.demo.dto.FinalSubmitDTO.TestCaseResult;

import java.util.List;

@Service
public class ScoreCalculationService {

    /**
     * Calculate total score based on test case results
     * Score is distributed equally across all questions
     * Within each question, score is based on passed test cases
     */
    public Integer calculateScore(FinalSubmitDTO dto, int totalQuestions) {
        List<QuestionResultDTO> questionResults = dto.getQuestionResults();
        
        if (questionResults == null || questionResults.isEmpty() || totalQuestions == 0) {
            return 0;
        }

        double pointsPerQuestion = 100.0 / totalQuestions;
        double totalScore = 0.0;

        for (QuestionResultDTO question : questionResults) {
            List<TestCaseResult> testCases = question.getResults();
            
            if (testCases == null || testCases.isEmpty()) {
                continue;
            }

            int totalTestCases = testCases.size();
            double pointsPerTestCase = pointsPerQuestion / totalTestCases;

            long passedCount = testCases.stream()
                .filter(tc -> "passed".equalsIgnoreCase(tc.getStatus()))
                .count();

            totalScore += passedCount * pointsPerTestCase;
        }

        return (int) Math.round(totalScore);
    }

    /**
     * Calculate score with penalties for violations
     */
    public Integer calculateScoreWithPenalties(FinalSubmitDTO dto, int totalQuestions) {
        int baseScore = calculateScore(dto, totalQuestions);
        
        int tabSwitchPenalty = (dto.getTabSwitchCount() != null) 
            ? Math.min(dto.getTabSwitchCount() * 2, 10) // Max 10 points penalty
            : 0;
        
        int copyPastePenalty = (dto.getCopyPasteAttempts() != null) 
            ? Math.min(dto.getCopyPasteAttempts() * 1, 5) // Max 5 points penalty
            : 0;
        
        int finalScore = baseScore - tabSwitchPenalty - copyPastePenalty;
        
        return Math.max(0, finalScore);
    }

    /**
     * Get detailed scoring breakdown per question
     */
    public ScoringBreakdown getDetailedBreakdown(FinalSubmitDTO dto, int totalQuestions) {
        List<QuestionResultDTO> questionResults = dto.getQuestionResults();
        ScoringBreakdown breakdown = new ScoringBreakdown();
        
        if (questionResults == null || questionResults.isEmpty() || totalQuestions == 0) {
            return breakdown;
        }

        double pointsPerQuestion = 100.0 / totalQuestions;

        for (int i = 0; i < questionResults.size(); i++) {
            QuestionResultDTO question = questionResults.get(i);
            List<TestCaseResult> testCases = question.getResults();
            
            QuestionScore qScore = new QuestionScore();
            qScore.questionNumber = i + 1;
            qScore.maxPoints = pointsPerQuestion;
            qScore.questionId = question.getQuestionId();
            
            if (testCases != null && !testCases.isEmpty()) {
                int totalTestCases = testCases.size();
                long passedCount = testCases.stream()
                    .filter(tc -> "passed".equalsIgnoreCase(tc.getStatus()))
                    .count();
                
                qScore.passedTestCases = (int) passedCount;
                qScore.totalTestCases = totalTestCases;
                qScore.earnedPoints = (passedCount * pointsPerQuestion) / totalTestCases;
            }
            
            breakdown.questionScores.add(qScore);
            breakdown.totalScore += qScore.earnedPoints;
        }
        
        breakdown.totalScore = Math.round(breakdown.totalScore * 100.0) / 100.0;
        return breakdown;
    }

    public static class ScoringBreakdown {
        public List<QuestionScore> questionScores = new java.util.ArrayList<>();
        public double totalScore = 0.0;
    }

    public static class QuestionScore {
        public int questionNumber;
        public Long questionId;
        public double maxPoints;
        public double earnedPoints;
        public int passedTestCases;
        public int totalTestCases;
    }
}