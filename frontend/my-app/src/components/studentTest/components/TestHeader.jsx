import React, { useMemo } from "react";
import { Clock, Camera, Mic, Eye, Shield, AlertTriangle } from "lucide-react";

/**
 * TestHeader
 *
 * Props:
 *  testTitle         string
 *  student           { name, email }
 *  timeRemaining     number  (seconds)
 *  formatTime        (seconds) => string
 *  tabSwitchCount    number
 *  maxTabSwitches    number  (default 45)
 *  copyPasteAttempts number  (default 0)
 *  isProctoringActive boolean
 */
const TestHeader = ({
  testTitle,
  student,
  timeRemaining,
  formatTime,
  tabSwitchCount = 0,
  maxTabSwitches = 45,
  copyPasteAttempts = 0,
  isProctoringActive = false,
}) => {
  // ── Timer urgency ──────────────────────────────────────────────────────────
  const timerState = useMemo(() => {
    if (!timeRemaining || timeRemaining <= 0)
      return { color: "text-red-500", bg: "bg-red-500/10", border: "border-red-500/30", pulse: true, label: "Time's up" };
    if (timeRemaining > 300)
      return { color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30", pulse: false, label: "Time remaining" };
    if (timeRemaining > 120)
      return { color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/30", pulse: false, label: "Running low" };
    return { color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/30", pulse: true, label: "Critical" };
  }, [timeRemaining]);

  // ── Tab switch urgency ─────────────────────────────────────────────────────
  const tabState = useMemo(() => {
    const ratio = tabSwitchCount / maxTabSwitches;
    if (ratio >= 1) return { color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/40" };
    if (ratio >= 0.6) return { color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/40" };
    return { color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/30" };
  }, [tabSwitchCount, maxTabSwitches]);

  return (
    <header className="sticky top-0 z-50 w-full">
      {/* Frosted glass bar */}
      <div className="bg-gray-900/95 backdrop-blur-md border-b border-white/10 shadow-xl shadow-black/30">
        <div className="max-w-[1600px] mx-auto px-4 h-14 flex items-center justify-between gap-4">

          {/* ── Left: branding + student ─────────────────────────────────── */}
          <div className="flex items-center gap-3 min-w-0">
            {/* accent bar */}
            <div className="hidden sm:block w-1 h-8 rounded-full bg-gradient-to-b from-blue-400 to-indigo-500 flex-shrink-0" />

            <div className="min-w-0">
              <h1 className="text-sm font-semibold text-white truncate leading-tight">
                {testTitle || "Untitled Test"}
              </h1>
              <p className="text-xs text-gray-400 truncate leading-tight">
                {student?.name}
                {student?.email && (
                  <span className="text-gray-500"> · {student.email}</span>
                )}
              </p>
            </div>
          </div>

          {/* ── Center: Timer ────────────────────────────────────────────── */}
          <div
            className={`
              flex items-center gap-2 px-4 py-1.5 rounded-lg border
              ${timerState.bg} ${timerState.border}
              transition-colors duration-500
            `}
          >
            <Clock
              size={16}
              className={`flex-shrink-0 ${timerState.color} ${timerState.pulse ? "animate-pulse" : ""}`}
            />
            <span
              className={`
                text-xl font-mono font-bold tracking-widest tabular-nums
                ${timerState.color}
                ${timerState.pulse ? "animate-pulse" : ""}
              `}
            >
              {formatTime ? formatTime(timeRemaining) : "--:--"}
            </span>
          </div>

          {/* ── Right: monitoring badges ──────────────────────────────────── */}
          <div className="flex items-center gap-2 flex-shrink-0">

            {/* Proctoring indicator */}
            <div
              className={`
                flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-medium
                transition-colors duration-300
                ${isProctoringActive
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                  : "bg-gray-800 border-gray-700 text-gray-500"
                }
              `}
              title={isProctoringActive ? "Proctoring active" : "Proctoring inactive"}
            >
              <Camera size={13} />
              <Mic size={13} />
              {isProctoringActive ? (
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="hidden sm:inline">LIVE</span>
                </span>
              ) : (
                <span className="hidden sm:inline">OFF</span>
              )}
            </div>

            {/* Tab switch counter – only when relevant */}
            {tabSwitchCount > 0 && (
              <div
                className={`
                  flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-medium
                  ${tabState.bg} ${tabState.border} ${tabState.color}
                `}
                title={`Tab switches: ${tabSwitchCount} / ${maxTabSwitches}`}
              >
                <Eye size={13} />
                <span className="font-mono tabular-nums">
                  {tabSwitchCount}
                  <span className="opacity-50">/{maxTabSwitches}</span>
                </span>
                {tabSwitchCount >= maxTabSwitches && (
                  <AlertTriangle size={12} className="flex-shrink-0" />
                )}
              </div>
            )}

            {/* Copy/paste counter – only when relevant */}
            {copyPasteAttempts > 0 && (
              <div
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-medium
                           bg-red-500/10 border-red-500/30 text-red-400"
                title={`Copy/paste attempts: ${copyPasteAttempts}`}
              >
                <Shield size={13} />
                <span className="font-mono tabular-nums">{copyPasteAttempts}</span>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Critical-time warning strip */}
      {timeRemaining > 0 && timeRemaining <= 120 && (
        <div className="h-0.5 w-full overflow-hidden bg-gray-800">
          <div
            className="h-full bg-gradient-to-r from-amber-500 via-red-500 to-red-600 transition-all duration-1000"
            style={{ width: `${(timeRemaining / 120) * 100}%` }}
          />
        </div>
      )}
    </header>
  );
};

export default TestHeader;