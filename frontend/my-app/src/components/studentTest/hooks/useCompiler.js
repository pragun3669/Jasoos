import { useState, useCallback} from "react";

const SUBMISSION_API = "http://localhost:8081/api/submissions";

/**
 * useCompiler
 *
 * Matches the original StudentTestEditor's handleRunCode exactly:
 *  - POST to /api/submissions?testId=...&studentId=...
 *  - Poll /api/submissions/:id until not PENDING/RUNNING (max 60s)
 *  - Fetch /api/submissions/:id/results
 *  - subId = submissionData.id || submissionData.submissionId  ← original fix
 *  - No Authorization header (original didn't send one for run)
 *
 * LeetCode-style routing:
 *  - Compile/runtime error → errorType + compilerOutput set, testResults empty
 *  - Success → testResults populated, console hidden
 */
export default function useCompiler({ test, student, authToken }) {
  const [testResults,      setTestResults]      = useState([]);
  const [compilerOutput,   setCompilerOutput]   = useState("");
  const [errorType,        setErrorType]        = useState(null);
  const [isRunning,        setIsRunning]        = useState(false);
  const [questionStatuses, setQuestionStatuses] = useState({});

  const clearConsole = useCallback(() => {
    setCompilerOutput("");
    setErrorType(null);
  }, []);

  // ── Poll until done ────────────────────────────────────────────────────────
  const pollSubmission = useCallback(async (subId) => {
    let status  = "PENDING";
    let attempts = 0;

    while ((status === "PENDING" || status === "RUNNING") && attempts < 60) {
      await new Promise((res) => setTimeout(res, 1000));

      const resp = await fetch(`${SUBMISSION_API}/${subId}`);
      if (!resp.ok) throw new Error(`Failed to fetch status: ${resp.status}`);

      const data = await resp.json();
      status = data.status;
      attempts++;
    }

    return status;
  }, []);

  // ── Main run ───────────────────────────────────────────────────────────────
  const runCode = useCallback(async (
    code,
    language = "cpp",
    questionIndex,
    testCases = []
  ) => {
    if (!student) {
      setErrorType("runtime_error");
      setCompilerOutput("⚠️ Error: Student information missing.");
      return;
    }
    if (!test?.questions?.[questionIndex]) {
      setErrorType("runtime_error");
      setCompilerOutput("⚠️ Error: Question data missing.");
      return;
    }

    setIsRunning(true);
    setTestResults([]);
    setCompilerOutput("");
    setErrorType(null);

    try {
      const question = test.questions[questionIndex];

      // ── 1. Submit ──────────────────────────────────────────────────────────
      const extMap     = { cpp: "cpp", c: "c", python: "py", java: "java" };
      const filename   = `Solution.${extMap[language] || "cpp"}`;
      const testId     = test._id  || test.id;
      const studentId  = student._id || student.id;
      const questionId = question._id || question.id;

      const submitResp = await fetch(
        `${SUBMISSION_API}?testId=${testId}&studentId=${studentId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            language,
            source:     code,
            filename,
            stdin:      "",
            questionId,
            studentId,
          }),
        }
      );

      if (!submitResp.ok) {
        throw new Error(`Submission failed: ${submitResp.status}`);
      }

      const submissionData = await submitResp.json();

      // ✅ Match original exactly — try both id and submissionId
      const subId = submissionData.id || submissionData.submissionId;
      if (!subId) {
        console.error("Submission response:", submissionData);
        throw new Error("Submission ID missing from response. Check console for response shape.");
      }

      // ── 2. Poll ────────────────────────────────────────────────────────────
      const finalStatus = await pollSubmission(subId);

      // ── 3. Fetch results ───────────────────────────────────────────────────
      const resultsResp = await fetch(`${SUBMISSION_API}/${subId}/results`);
      if (!resultsResp.ok) throw new Error(`Failed to fetch results: ${resultsResp.status}`);
      const apiResults = await resultsResp.json();

      // ── 4. Map results ─────────────────────────────────────────────────────
      const formatted = apiResults.map((r, idx) => {
        const tc     = testCases[idx] || {};
        const passed = r.status === "AC";

        return {
          testCaseNumber: idx + 1,
          passed,
          status:         r.status,
          // Support both shapes: { inputData, expectedOutput } and { input, output }
          inputData:      tc.inputData      || tc.input  || "",
          expectedOutput: tc.expectedOutput || tc.output || "",
          actualOutput:   r.stdout          || r.output  || "",
          executionTime:  r.time            || r.executionTime || null,
          error:          r.stderr          || null,
          // Preserve original isExample flag for display filtering
          isExample:      tc.exampleCase    || tc.isExample || false,
        };
      });

      // ── 5. Check for compile / runtime errors ──────────────────────────────
      //    Original used r.stderr to detect errors
      const firstWithError  = formatted.find((r) => r.error && !r.passed);
      const allFailed       = formatted.length > 0 && formatted.every((r) => !r.passed);
      const isCompileError  = finalStatus === "COMPILE_ERROR" || finalStatus === "CE";

      if (isCompileError) {
        const errMsg = apiResults[0]?.stderr || apiResults[0]?.compileError ||
          "Compilation failed. Check your syntax.";
        setErrorType("compile_error");
        setCompilerOutput(errMsg);
        return;
      }

      if (allFailed && firstWithError) {
        setErrorType("runtime_error");
        setCompilerOutput(firstWithError.error);
        return;
      }

      // ── 6. Success path ────────────────────────────────────────────────────
      setTestResults(formatted);
      setErrorType(null);
      setCompilerOutput("");

      const passedCount = formatted.filter((r) => r.passed).length;
      const total       = formatted.length;

      setQuestionStatuses((prev) => ({
        ...prev,
        [questionIndex]: {
          attempted: true,
          passed:    passedCount,
          total,
          correct:   passedCount === total,
          allPassed: passedCount === total,
          attempts:  (prev[questionIndex]?.attempts || 0) + 1,
          // Keep original shape so handleFinalSubmit payload still works
          output:    formatted,
          results:   formatted.map((r) => ({
            status:         r.passed ? "passed" : "failed",
            input:          r.inputData,
            expectedOutput: r.expectedOutput,
            actualOutput:   r.actualOutput,
          })),
        },
      }));

    } catch (err) {
      console.error("Compiler error:", err);
      setErrorType("runtime_error");
      setCompilerOutput(err.message || "An unexpected error occurred.");
    } finally {
      setIsRunning(false);
    }
  }, [test, student, pollSubmission]);

  return {
    runCode,
    testResults,
    compilerOutput,
    errorType,
    isRunning,
    questionStatuses,
    setQuestionStatuses,
    clearConsole,
    // Legacy alias so old code using setCompilerOutput still works during migration
    setCompilerOutput,
  };
}