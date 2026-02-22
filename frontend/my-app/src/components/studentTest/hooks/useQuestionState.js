import { useState, useEffect, useCallback, useRef } from "react";
import { getDefaultCode } from "../utils/codeTemplates";
import { saveCode, loadCode } from "../utils/localStorageUtils";

export default function useQuestionState({ test }) {
  const [currentQuestionIndex, setCurrentQuestionIndexRaw] = useState(0);
  const [questionStates, setQuestionStates] = useState({});
  const [isTransitioning, setIsTransitioning] = useState(false);

  const currentIndexRef = useRef(0);
  const testId = test?._id || test?.id || "";

  // ── Bootstrap: load all saved codes on mount ──────────────────────────────
  useEffect(() => {
    if (!test?.questions) return;

    const initial = {};
    test.questions.forEach((_, idx) => {
      const saved = loadCode(testId, idx);
      initial[idx] = {
        code:      saved || getDefaultCode("cpp"),
        attempted: false,
        correct:   false,
      };
    });
    setQuestionStates(initial);
  }, [testId, test?.questions]);

  // ── Current code (derived) ────────────────────────────────────────────────
  const code = questionStates[currentQuestionIndex]?.code ?? getDefaultCode("cpp");

  // ── Update code + persist immediately ────────────────────────────────────
  const setCode = useCallback((newCode) => {
    const idx = currentIndexRef.current;
    setQuestionStates((prev) => ({
      ...prev,
      [idx]: { ...prev[idx], code: newCode },
    }));
    saveCode(testId, idx, newCode);
  }, [testId]);

  // ── Switch question with save + fade transition ───────────────────────────
  const switchQuestion = useCallback((newIndex) => {
    if (newIndex === currentIndexRef.current) return;

    // Save current before leaving
    const currentIdx = currentIndexRef.current;
    setQuestionStates((prev) => {
      if (prev[currentIdx]) saveCode(testId, currentIdx, prev[currentIdx].code);
      return prev;
    });

    setIsTransitioning(true);
    setTimeout(() => {
      currentIndexRef.current = newIndex;
      setCurrentQuestionIndexRaw(newIndex);
      setIsTransitioning(false);
    }, 150);
  }, [testId]);

  // ── Mark attempted/correct after a run ───────────────────────────────────
  const markQuestionStatus = useCallback((index, { attempted, correct }) => {
    setQuestionStates((prev) => ({
      ...prev,
      [index]: { ...prev[index], attempted, correct },
    }));
  }, []);

  const questionStatuses = Object.fromEntries(
    Object.entries(questionStates).map(([idx, s]) => [
      idx,
      { attempted: s.attempted, correct: s.correct },
    ])
  );

  return {
    currentQuestionIndex,
    switchQuestion,
    code,
    setCode,
    questionStatuses,
    markQuestionStatus,
    isTransitioning,
    questionStates,
  };
}