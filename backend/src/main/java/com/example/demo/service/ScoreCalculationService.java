package com.example.demo.service;

import org.springframework.stereotype.Service;
import com.example.demo.dto.FinalSubmitDTO;

@Service
public class ScoreCalculationService {

    /**
     * SCORE CALCULATION — Based on actual test-case pass rate per question.
     *
     * Formula:
     *   - Each question contributes equally: (100 / totalQuestions) points max.
     *   - Points earned for a question = maxPoints × (passedTestCases / totalTestCases).
     *   - If a question has no test cases, it is skipped (contributes 0).
     *
     * This means:
     *   - Q passes ALL test cases  → gets full (100/N) points  → shows "Correct"  ✅
     *   - Q passes SOME test cases → gets partial points        → shows "Incorrect" ❌ (partial)
     *   - Q passes NO test cases   → gets 0 points             → shows "Incorrect" ❌
     *
     * Previously the service gave full marks for any attempt, which caused
     * "Incorrect" labels on questions that actually passed all test cases.
     */
    public Integer calculateScore(FinalSubmitDTO dto, int totalQuestions) {
        if (totalQuestions <= 0) return 0;
        if (dto.getQuestionResults() == null) return 0;

        double pointsPerQuestion = 100.0 / totalQuestions;
        double totalScore = 0.0;

        for (var q : dto.getQuestionResults()) {
            if (q.getResults() == null || q.getResults().isEmpty()) continue;

            long passed = q.getResults().stream()
                    .filter(r -> "passed".equalsIgnoreCase(r.getStatus()))
                    .count();
            long total  = q.getResults().size();

            // Partial credit proportional to test cases passed
            double ratio = (double) passed / total;
            totalScore += pointsPerQuestion * ratio;
        }

        return (int) Math.round(Math.min(100, totalScore));
    }

    /**
     * No penalties — delegates to calculateScore().
     */
    public Integer calculateScoreWithPenalties(FinalSubmitDTO dto, int totalQuestions) {
        return calculateScore(dto, totalQuestions);
    }

    /**
     * Detailed per-question breakdown with accurate test case pass rates.
     */
    public ScoringBreakdown getDetailedBreakdown(FinalSubmitDTO dto, int totalQuestions) {

        ScoringBreakdown breakdown = new ScoringBreakdown();
        if (totalQuestions <= 0 || dto.getQuestionResults() == null) return breakdown;

        double perQ = 100.0 / totalQuestions;
        int qNum = 1;

        for (var q : dto.getQuestionResults()) {
            QuestionScore score = new QuestionScore();
            score.questionNumber = qNum++;
            score.questionId    = q.getQuestionId();
            score.maxPoints     = perQ;

            if (q.getResults() != null && !q.getResults().isEmpty()) {
                long passed = q.getResults().stream()
                        .filter(r -> "passed".equalsIgnoreCase(r.getStatus()))
                        .count();
                long total = q.getResults().size();

                score.passedTestCases = (int) passed;
                score.totalTestCases  = (int) total;

                // Proportional: full marks only if ALL test cases pass
                double ratio = (double) passed / total;
                score.earnedPoints = perQ * ratio;
            } else {
                score.earnedPoints    = 0;
                score.passedTestCases = 0;
                score.totalTestCases  = 0;
            }

            breakdown.totalScore += score.earnedPoints;
            breakdown.questionScores.add(score);
        }

        breakdown.totalScore = Math.min(100, breakdown.totalScore);
        return breakdown;
    }

    // ─────────────────────── Inner Classes ───────────────────────

    public static class ScoringBreakdown {
        public java.util.List<QuestionScore> questionScores = new java.util.ArrayList<>();
        public double totalScore = 0.0;
    }

    public static class QuestionScore {
        public int    questionNumber;
        public Long   questionId;
        public double maxPoints;
        public double earnedPoints;
        public int    passedTestCases;
        public int    totalTestCases;
    }
}