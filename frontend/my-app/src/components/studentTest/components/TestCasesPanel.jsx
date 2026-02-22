import React, { useState } from "react";
import { CheckCircle, XCircle, Clock, Hash } from "lucide-react";

/**
 * TestCasesPanel
 *
 * Shows ONLY public/example test cases (tc.isPublic || tc.exampleCase).
 * Hidden test cases are never rendered.
 *
 * Props:
 *  testCases     array   — all test cases for the question
 *  testResults   array   — results after running code, indexed by public case position
 *  isRunning     boolean — show skeleton while compiling
 *  questionIndex number  — resets expanded state on question switch
 */
const TestCasesPanel = ({
  testCases = [],
  testResults = [],
  isRunning = false,
  questionIndex,
}) => {
  const [expandedIndex, setExpandedIndex] = useState(0);

  // ── Only show public / example cases ────────────────────────────────────
  // FIX: removed originalIndex mapping — results are now indexed by public
  // case position (0, 1, 2…), NOT by position in the full testCases array.
  // Using originalIndex caused Q1's results to bleed into Q2's panel when
  // the parent passed a fresh per-question results array starting at index 0.
  const publicCases = testCases.filter((tc) => tc.isPublic || tc.exampleCase);

  // Reset expanded when question changes
  React.useEffect(() => {
    setExpandedIndex(0);
  }, [questionIndex]);

  // ── Result for a given public case index (0-based within public cases) ───
  const getResult = (publicIdx) => testResults[publicIdx] || null;

  const getStatusStyle = (result) => {
    if (!result) return { icon: null, border: "border-gray-700/50", header: "bg-gray-800/60" };
    if (result.passed)
      return {
        icon: <CheckCircle size={13} className="text-emerald-400" />,
        border: "border-emerald-500/40",
        header: "bg-emerald-500/10",
        label: <span className="text-xs font-semibold text-emerald-400">Passed</span>,
      };
    return {
      icon: <XCircle size={13} className="text-red-400" />,
      border: "border-red-500/40",
      header: "bg-red-500/10",
      label: <span className="text-xs font-semibold text-red-400">Failed</span>,
    };
  };

  // ── Empty state ──────────────────────────────────────────────────────────
  if (publicCases.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-10 gap-2 text-gray-600">
        <Hash size={24} className="opacity-40" />
        <p className="text-sm">No example test cases</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">

      {/* ── Header row ──────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 py-2.5 border-b border-gray-700/60">
        <div className="flex items-center gap-2">
          <Hash size={13} className="text-gray-500" />
          <span className="text-xs font-semibold uppercase tracking-widest text-gray-500">
            Test Cases
          </span>
          <span className="text-xs text-gray-600">({publicCases.length} public)</span>
        </div>

        {/* Run summary badges */}
        {testResults.length > 0 && !isRunning && (() => {
          const passed = publicCases.filter((_, idx) => getResult(idx)?.passed).length;
          const failed = publicCases.length - passed;
          return (
            <div className="flex items-center gap-2">
              {passed > 0 && (
                <span className="flex items-center gap-1 text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  <CheckCircle size={11} /> {passed}
                </span>
              )}
              {failed > 0 && (
                <span className="flex items-center gap-1 text-xs font-semibold text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20">
                  <XCircle size={11} /> {failed}
                </span>
              )}
            </div>
          );
        })()}
      </div>

      {/* ── Tab strip ───────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 flex items-center gap-1 px-3 pt-2 pb-0 overflow-x-auto">
        {publicCases.map((tc, idx) => {
          const result = getResult(idx);
          const isCurrent = expandedIndex === idx;
          const dotColor = !result
            ? "bg-gray-600"
            : result.passed
            ? "bg-emerald-400"
            : "bg-red-400";

          return (
            <button
              key={idx}
              onClick={() => setExpandedIndex(idx)}
              className={`
                flex items-center gap-1.5 px-3 py-1.5 rounded-t-md text-xs font-medium
                border-b-2 transition-all duration-150 whitespace-nowrap
                ${isCurrent
                  ? "border-blue-400 text-white bg-gray-800/60"
                  : "border-transparent text-gray-500 hover:text-gray-300 hover:bg-gray-800/30"
                }
              `}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
              Case {idx + 1}
            </button>
          );
        })}
      </div>

      {/* ── Active case body ─────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {isRunning ? (
          // Skeleton
          <div className="space-y-2 animate-pulse">
            {[1, 2].map((i) => (
              <div key={i} className="h-10 rounded-lg bg-gray-800/60" />
            ))}
          </div>
        ) : (
          (() => {
            const tc = publicCases[expandedIndex];
            if (!tc) return null;
            const result = getResult(expandedIndex);
            const style = getStatusStyle(result);

            return (
              <div className={`rounded-xl border overflow-hidden ${style.border}`}>

                {/* Case header */}
                <div className={`flex items-center justify-between px-3 py-2 ${style.header}`}>
                  <span className="text-xs font-semibold text-gray-400">
                    Case {expandedIndex + 1}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {result?.executionTime && (
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        <Clock size={11} />
                        {result.executionTime}ms
                      </span>
                    )}
                    {style.label}
                    {style.icon}
                  </div>
                </div>

                {/* Input / Expected / Got */}
                <div className="divide-y divide-gray-700/40">
                  <CaseRow label="Input" value={tc.inputData} />
                  <CaseRow label="Expected" value={tc.expectedOutput} accent="emerald" />

                  {result && (
                    <CaseRow
                      label="Your Output"
                      value={result.actualOutput ?? result.output ?? "—"}
                      accent={result.passed ? "emerald" : "red"}
                    />
                  )}

                  {result?.error && (
                    <CaseRow label="Error" value={result.error} accent="red" mono />
                  )}
                </div>
              </div>
            );
          })()
        )}
      </div>
    </div>
  );
};

// ── Small helper ────────────────────────────────────────────────────────────
const accentMap = {
  emerald: "text-emerald-300",
  red:     "text-red-300",
  default: "text-gray-200",
};

const CaseRow = ({ label, value, accent = "default", mono = false }) => (
  <div className="px-3 py-2.5 flex flex-col gap-1">
    <span className="text-xs text-gray-500 font-medium">{label}</span>
    <pre
      className={`
        text-xs leading-relaxed whitespace-pre-wrap break-all
        ${mono ? "font-mono" : "font-mono"}
        ${accentMap[accent] || accentMap.default}
      `}
    >
      {String(value ?? "")}
    </pre>
  </div>
);

export default TestCasesPanel;