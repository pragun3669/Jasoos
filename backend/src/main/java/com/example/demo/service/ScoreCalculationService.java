package com.example.demo.service;

import org.springframework.stereotype.Service;
import com.example.demo.dto.FinalSubmitDTO;

@Service
public class ScoreCalculationService {

    /**
     * SIMPLE PURE BACKEND SCORE (0–100)
     * --------------------------------------------------
     * This version ignores DTO test-case results
     * (because backend now uses actual judged results).
     *
     * Logic:
     * - Each question = 100 / totalQuestions
     * - Score earned = average of all backend submissions
     *
     * NOTE:
     * TestService will NOT use this anymore for final scoring.
     * But we keep it for compatibility.
     */
    public Integer calculateScore(FinalSubmitDTO dto, int totalQuestions) {
        if (totalQuestions <= 0) return 0;

        // Simple fallback: give full score for each attempted question
        double pointsPerQuestion = 100.0 / totalQuestions;
        double totalScore = 0.0;

        if (dto.getQuestionResults() != null) {
            long attempted = dto.getQuestionResults().stream()
                    .filter(q -> q.getResults() != null && !q.getResults().isEmpty())
                    .count();

            totalScore = attempted * pointsPerQuestion;
        }

        return (int) Math.round(Math.min(100, totalScore));
    }

    /**
     * REMOVE PENALTIES, KEEP SAME FUNCTION NAME
     * ------------------------------------------
     * Just returns calculateScore() with NO deductions.
     */
    public Integer calculateScoreWithPenalties(FinalSubmitDTO dto, int totalQuestions) {
        return calculateScore(dto, totalQuestions);
    }

    /**
     * Breakdown is kept ONLY for compatibility.
     * But logic is simplified: each attempted question gets full credit.
     */
    public ScoringBreakdown getDetailedBreakdown(FinalSubmitDTO dto, int totalQuestions) {

        ScoringBreakdown breakdown = new ScoringBreakdown();
        if (totalQuestions <= 0) return breakdown;

        double perQ = 100.0 / totalQuestions;

        if (dto.getQuestionResults() != null) {
            int qNum = 1;
            for (var q : dto.getQuestionResults()) {
                QuestionScore score = new QuestionScore();
                score.questionNumber = qNum++;
                score.questionId = q.getQuestionId();
                score.maxPoints = perQ;

                if (q.getResults() != null && !q.getResults().isEmpty()) {
                    score.earnedPoints = perQ; // full marks for attempted
                    score.passedTestCases = q.getResults().size();
                    score.totalTestCases = q.getResults().size();
                } else {
                    score.earnedPoints = 0;
                    score.passedTestCases = 0;
                    score.totalTestCases = 0;
                }

                breakdown.totalScore += score.earnedPoints;
                breakdown.questionScores.add(score);
            }
        }

        // Clamp totalScore to 100
        breakdown.totalScore = Math.min(100, breakdown.totalScore);
        return breakdown;
    }

    // ------------------ Inner Classes --------------------

    public static class ScoringBreakdown {
        public java.util.List<QuestionScore> questionScores = new java.util.ArrayList<>();
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
