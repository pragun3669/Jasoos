// studentTest/StudentTestEditor.jsx

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import { Send, Loader2 } from "lucide-react";

// ── Hooks ─────────────────────────────────────────────────────────────────────
import { codeKey }       from "./utils/localStorageUtils";
import useTimer          from "./hooks/useTimer";
import useCompiler       from "./hooks/useCompiler";
import useTabMonitoring  from "./hooks/useTabMonitoring";
import useProctoring     from "./hooks/useProctoring";
import useQuestionState  from "./hooks/useQuestionState";

// ── Components ────────────────────────────────────────────────────────────────
import TestHeader        from "./components/TestHeader";
import TabWarningOverlay from "./components/TabWarningOverlay";
import QuestionNavigator from "./components/QuestionNavigator";
import QuestionPanel     from "./components/QuestionPanel";
import CodeEditorPanel   from "./components/CodeEditorPanel";
import TestCasesPanel    from "./components/TestCasesPanel";
import ConsoleOutput     from "./components/ConsoleOutput";
import SubmitModal       from "./components/SubmitModal";
import ProctoringFeed    from "./components/ProctoringFeed";

// ─────────────────────────────────────────────────────────────────────────────

const StudentTestEditor = () => {
  const location  = useLocation();
  const navigate  = useNavigate();
  const { theme } = useTheme();
  const { user }  = useAuth();

  const {
    test,
    student,
    proctoringStarted,
    proctoringBackend,
    proctoringEnabled,
  } = location.state || {};

  const authToken = user?.token;
  const editorContainerRef  = useRef(null);
  // Forward-declare so timer/tab hooks can call the latest handleFinalSubmit
  // without a stale closure — wired via useEffect after the fn is defined
  const handleAutoSubmitRef = useRef(null);

  // ── Local UI state ──────────────────────────────────────────────────────────
  const [showSubmitModal,   setShowSubmitModal]   = useState(false);
  const [isSubmitting,      setIsSubmitting]      = useState(false);
  const [copyPasteAttempts, setCopyPasteAttempts] = useState(0);

  // ── Question state (code per question, switching, persistence) ─────────────
  // ⚠️ ALL hooks must be called unconditionally — guard render is at the END
  const {
    currentQuestionIndex,
    switchQuestion,
    code,
    setCode,
    questionStatuses: questionStateStatuses,
    markQuestionStatus,
    isTransitioning,
  } = useQuestionState({ test });

  // ── Timer ───────────────────────────────────────────────────────────────────
  const {
    timeRemaining,
    formatTime,
    clearStoredTime,
  } = useTimer({
    durationSeconds: (test?.duration || 0) * 60,
    testId: test?._id || test?.id || "",
    enabled: true,
    onExpire: () => handleAutoSubmitRef.current?.(),
  });

  // ── Compiler ────────────────────────────────────────────────────────────────
  const {
    runCode,
    testResults,
    compilerOutput,
    errorType,
    isRunning,
    questionStatuses: compilerStatuses,
    clearConsole,
  } = useCompiler({ test, student, authToken });

  // Sync compiler results into question state
  useEffect(() => {
    Object.entries(compilerStatuses).forEach(([idx, status]) => {
      markQuestionStatus(Number(idx), status);
    });
  }, [compilerStatuses, markQuestionStatus]);

  // Merged statuses — memoised so it doesn't cause useCallback churn
  const questionStatuses = useMemo(
    () => ({ ...questionStateStatuses, ...compilerStatuses }),
    [questionStateStatuses, compilerStatuses]
  );

  // ── Tab monitoring + fullscreen ─────────────────────────────────────────────
  const {
    tabSwitchCount,
    isFullscreen,
    showWarning,
    warningMessage,
    enterFullscreen,
    clearStoredCount,
    MAX_TAB_SWITCHES,
  } = useTabMonitoring(
    test?._id || test?.id || "",
    () => handleAutoSubmitRef.current?.()
  );

  // ── Proctoring ──────────────────────────────────────────────────────────────
  const {
    videoRef,
    canvasRef,
    isProctoringActive,
    showViolationAlert,
    violationMessage,
    violationType,
  } = useProctoring({
    proctoringEnabled: proctoringEnabled ?? true,
    proctoringBackend,
    proctoringStarted,
  });

  // ── Copy / paste blocker (outside editor) ───────────────────────────────────
  useEffect(() => {
    const isInsideEditor = (target) =>
      editorContainerRef.current?.contains(target);

    const blockCopyCut = (e) => {
      if (!isInsideEditor(e.target)) {
        e.preventDefault();
        setCopyPasteAttempts((p) => p + 1);
      }
    };
    const blockPaste = (e) => {
      if (!isInsideEditor(e.target)) {
        e.preventDefault();
        setCopyPasteAttempts((p) => p + 1);
      }
    };
    const blockContextMenu = (e) => {
      if (!isInsideEditor(e.target)) e.preventDefault();
    };
    const blockKeyboard = (e) => {
      if (
        (e.ctrlKey || e.metaKey) &&
        ["c", "v", "x"].includes(e.key.toLowerCase()) &&
        !isInsideEditor(document.activeElement)
      ) {
        e.preventDefault();
        setCopyPasteAttempts((p) => p + 1);
      }
    };

    document.addEventListener("copy",        blockCopyCut);
    document.addEventListener("cut",         blockCopyCut);
    document.addEventListener("paste",       blockPaste);
    document.addEventListener("contextmenu", blockContextMenu);
    document.addEventListener("keydown",     blockKeyboard, { capture: true });

    return () => {
      document.removeEventListener("copy",        blockCopyCut);
      document.removeEventListener("cut",         blockCopyCut);
      document.removeEventListener("paste",       blockPaste);
      document.removeEventListener("contextmenu", blockContextMenu);
      document.removeEventListener("keydown",     blockKeyboard, { capture: true });
    };
  }, []);

  // ── Run current question ────────────────────────────────────────────────────
  const currentQuestion = test?.questions?.[currentQuestionIndex];

  const handleRun = useCallback(() => {
    if (!currentQuestion || isRunning) return;
    runCode(code, "cpp", currentQuestionIndex, currentQuestion.testCases || []);
  }, [code, currentQuestion, currentQuestionIndex, isRunning, runCode]);

  // ── Run all questions before final submit ───────────────────────────────────
  const runAllBeforeSubmit = useCallback(async () => {
    if (!test?.questions) return;
    for (let i = 0; i < test.questions.length; i++) {
      const q = test.questions[i];
      let saved = "";
      try {
        saved = localStorage.getItem(codeKey(test._id || test.id, i)) || "";
      } catch { /* ignore */ }
      if (!saved.trim()) continue;
      await runCode(saved, "cpp", i, q.testCases || []);
    }
  }, [test, runCode]);

  // ── Final submit ────────────────────────────────────────────────────────────
  const handleFinalSubmit = useCallback(async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setShowSubmitModal(false);

    try {
      await runAllBeforeSubmit();
      clearStoredTime();
      clearStoredCount();

      navigate("/test-complete", {
        state: {
          test,
          student,
          questionStatuses,
          tabSwitchCount,
          copyPasteAttempts,
        },
      });
    } catch (err) {
      console.error("Submit error:", err);
      setIsSubmitting(false);
    }
  }, [
    isSubmitting,
    runAllBeforeSubmit,
    clearStoredTime,
    clearStoredCount,
    navigate,
    test,
    student,
    questionStatuses,
    tabSwitchCount,
    copyPasteAttempts,
  ]);

  // Wire the ref so timer/tab hooks always call the latest version
  useEffect(() => {
    handleAutoSubmitRef.current = handleFinalSubmit;
  }, [handleFinalSubmit]);

  // ── Guard: render nothing useful without test + student ────────────────────
  // This MUST come after all hooks above — hooks cannot be conditional
  if (!test || !student) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-950 text-gray-400 text-sm">
        No test data found. Please return to the dashboard.
      </div>
    );
  }

  // ── Derived ─────────────────────────────────────────────────────────────────
  const showConsole = !!(errorType || (isRunning && testResults.length === 0));

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gray-950 select-none">

      {/* ── 1. Fullscreen / tab-switch blocking overlay (highest z) ─────── */}
      <TabWarningOverlay
        showWarning={showWarning}
        warningMessage={warningMessage}
        tabSwitchCount={tabSwitchCount}
        maxTabSwitches={MAX_TAB_SWITCHES}
        isFullscreen={isFullscreen}
        onReturnToTest={enterFullscreen}
      />

      {/* ── 2. Sticky header ─────────────────────────────────────────────── */}
      <TestHeader
        testTitle={test.title}
        student={student}
        timeRemaining={timeRemaining}
        formatTime={formatTime}
        tabSwitchCount={tabSwitchCount}
        maxTabSwitches={MAX_TAB_SWITCHES}
        copyPasteAttempts={copyPasteAttempts}
        isProctoringActive={isProctoringActive}
      />

      {/* ── 3. Main workspace ────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── 3a. Question navigator sidebar ─────────────────────────────── */}
        <QuestionNavigator
          questions={test.questions}
          currentIndex={currentQuestionIndex}
          switchQuestion={switchQuestion}
          questionStatuses={questionStatuses}
          isTransitioning={isTransitioning}
        />

        {/* ── 3b. Question description panel ─────────────────────────────── */}
        <div className="w-[30%] min-w-[260px] max-w-[420px] flex flex-col
                        border-r border-gray-700/60 overflow-hidden">
          <QuestionPanel
            question={currentQuestion}
            questionIndex={currentQuestionIndex}
            totalQuestions={test.questions.length}
            isTransitioning={isTransitioning}
          />
        </div>

        {/* ── 3c. Editor + bottom panel column ───────────────────────────── */}
        <div className="flex flex-col flex-1 overflow-hidden">

          {/* Code editor */}
          <div
            ref={editorContainerRef}
            className="flex-1 overflow-hidden min-h-0"
          >
            <CodeEditorPanel
              code={code}
              setCode={setCode}
              language="cpp"
              onRun={handleRun}
              isRunning={isRunning}
              isTransitioning={isTransitioning}
              editorTheme={theme === "dark" ? "vs-dark" : "vs-light"}
            />
          </div>

          {/* ── Bottom panel ─────────────────────────────────────────────── */}
          <div className="flex-shrink-0 h-64 border-t border-gray-700/60
                          overflow-hidden flex flex-col">

            {/* Panel tab bar + submit button */}
            <div className="flex-shrink-0 flex items-center justify-between
                            px-4 border-b border-gray-700/60 bg-gray-900">
              <div className="flex">
                <span
                  className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors
                    ${showConsole
                      ? "border-transparent text-gray-500"
                      : "border-blue-400 text-white"
                    }`}
                >
                  Test Cases
                </span>
                {showConsole && (
                  <span className="px-4 py-2.5 text-xs font-semibold
                                   border-b-2 border-red-400 text-red-400">
                    Console
                  </span>
                )}
              </div>

              {/* Submit button — always visible */}
              <button
                disabled={isSubmitting}
                onClick={() => setShowSubmitModal(true)}
                className="flex items-center gap-2 px-4 py-1.5 my-1.5 rounded-lg
                           text-xs font-bold text-white
                           bg-emerald-600 hover:bg-emerald-500
                           border border-emerald-500/50
                           shadow-md shadow-emerald-900/30
                           transition-all duration-150 active:scale-95
                           disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={12} className="animate-spin" />
                    Submitting…
                  </>
                ) : (
                  <>
                    <Send size={12} />
                    Submit Test
                  </>
                )}
              </button>
            </div>

            {/* Panel body */}
            <div className="flex-1 overflow-hidden">
              {showConsole ? (
                <ConsoleOutput
                  compilerOutput={compilerOutput}
                  errorType={errorType}
                  isRunning={isRunning}
                  onClear={clearConsole}
                />
              ) : (
                <TestCasesPanel
                  testCases={currentQuestion?.testCases}
                  testResults={testResults}
                  isRunning={isRunning}
                  questionIndex={currentQuestionIndex}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── 4. Submit modal ──────────────────────────────────────────────── */}
      <SubmitModal
        show={showSubmitModal}
        onCancel={() => setShowSubmitModal(false)}
        onConfirm={handleFinalSubmit}
        isSubmitting={isSubmitting}
        questions={test.questions}
        questionStatuses={questionStatuses}
        timeRemaining={timeRemaining}
        formatTime={formatTime}
      />

      {/* ── 5. Proctoring feed (fixed bottom-right) ───────────────────────── */}
      <ProctoringFeed
        videoRef={videoRef}
        canvasRef={canvasRef}
        isProctoringActive={isProctoringActive}
        showViolationAlert={showViolationAlert}
        violationMessage={violationMessage}
        violationType={violationType}
      />

    </div>
  );
};

export default StudentTestEditor;