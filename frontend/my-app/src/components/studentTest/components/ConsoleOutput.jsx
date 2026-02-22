import React, { useRef, useEffect } from "react";
import { Terminal, X, AlertTriangle, AlertOctagon } from "lucide-react";

/**
 * ConsoleOutput
 *
 * LeetCode-style: only visible when there is a compile/runtime error.
 * When code runs cleanly, test cases panel takes over — this stays hidden.
 *
 * Props:
 *  compilerOutput   string   — raw stdout / error string from runner
 *  errorType        string   — "compile_error" | "runtime_error" | "timeout" | null
 *  isRunning        boolean
 *  onClear          fn
 */
const ConsoleOutput = ({ compilerOutput, errorType, isRunning, onClear }) => {
  const bodyRef = useRef(null);

  // Auto-scroll to bottom on new output
  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [compilerOutput]);

  // Only show when there's an actual error (not just "Passed X/Y")
  const hasError = !!errorType || (
    compilerOutput &&
    !compilerOutput.startsWith("Passed") &&
    !compilerOutput.startsWith("Running")
  );

  if (!hasError && !isRunning) return null;

  const errorConfig = {
    compile_error: {
      label: "Compile Error",
      icon: <AlertOctagon size={14} />,
      headerBg: "bg-red-950/80",
      headerBorder: "border-red-800/60",
      headerText: "text-red-400",
      bodyBg: "bg-red-950/30",
      textColor: "text-red-300",
      badge: "bg-red-500/20 text-red-400 border-red-500/30",
    },
    runtime_error: {
      label: "Runtime Error",
      icon: <AlertTriangle size={14} />,
      headerBg: "bg-orange-950/80",
      headerBorder: "border-orange-800/60",
      headerText: "text-orange-400",
      bodyBg: "bg-orange-950/20",
      textColor: "text-orange-300",
      badge: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    },
    timeout: {
      label: "Time Limit Exceeded",
      icon: <AlertTriangle size={14} />,
      headerBg: "bg-yellow-950/80",
      headerBorder: "border-yellow-800/60",
      headerText: "text-yellow-400",
      bodyBg: "bg-yellow-950/20",
      textColor: "text-yellow-300",
      badge: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    },
  };

  const cfg = errorConfig[errorType] || {
    label: "Error",
    icon: <AlertOctagon size={14} />,
    headerBg: "bg-red-950/80",
    headerBorder: "border-red-800/60",
    headerText: "text-red-400",
    bodyBg: "bg-red-950/30",
    textColor: "text-red-300",
    badge: "bg-red-500/20 text-red-400 border-red-500/30",
  };

  // Clean up the output — strip redundant prefixes runners sometimes add
  const cleanOutput = (compilerOutput || "")
    .replace(/^(ERROR:|error:|COMPILE ERROR:|Runtime Error:)\s*/i, "")
    .trim();

  return (
    <div className="flex flex-col border border-gray-700/60 rounded-xl overflow-hidden bg-gray-900 shadow-xl">

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className={`
        flex-shrink-0 flex items-center justify-between
        px-4 py-2.5 border-b
        ${errorType ? `${cfg.headerBg} ${cfg.headerBorder}` : "bg-gray-800/80 border-gray-700/60"}
      `}>
        <div className="flex items-center gap-2.5">
          <Terminal size={14} className={errorType ? cfg.headerText : "text-gray-400"} />
          <span className={`text-xs font-semibold uppercase tracking-widest ${errorType ? cfg.headerText : "text-gray-400"}`}>
            Console
          </span>
          {errorType && (
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${cfg.badge}`}>
              {cfg.icon}
              {cfg.label}
            </span>
          )}
        </div>

        {onClear && (
          <button
            onClick={onClear}
            className="flex items-center gap-1 px-2 py-1 rounded-md text-xs text-gray-500
                       hover:text-gray-300 hover:bg-gray-700/50 transition-all duration-150"
          >
            <X size={12} />
            Clear
          </button>
        )}
      </div>

      {/* ── Body ──────────────────────────────────────────────────────────── */}
      <div
        ref={bodyRef}
        className={`
          flex-1 overflow-y-auto p-4 max-h-52
          font-mono text-xs leading-relaxed
          ${errorType ? cfg.bodyBg : "bg-gray-900"}
          ${errorType ? cfg.textColor : "text-gray-300"}
        `}
      >
        {isRunning && !compilerOutput ? (
          <div className="flex items-center gap-2 text-gray-500">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: "0ms" }} />
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: "150ms" }} />
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: "300ms" }} />
            <span className="ml-1">Compiling…</span>
          </div>
        ) : (
          <pre className="whitespace-pre-wrap break-all">{cleanOutput || "No output."}</pre>
        )}
      </div>
    </div>
  );
};

export default ConsoleOutput;