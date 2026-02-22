import React, { useEffect } from "react";
import { AlertTriangle, Clock, CheckCircle, XCircle, Send, X } from "lucide-react";

/**
 * SubmitModal
 *
 * Props:
 *  show            boolean
 *  onCancel        fn
 *  onConfirm       fn
 *  isSubmitting    boolean  — disables button while API call is in flight
 *  questions       array    — full questions array
 *  questionStatuses object  — { [index]: { attempted, correct } }
 *  timeRemaining   number   — seconds
 *  formatTime      fn
 */
const SubmitModal = ({
  show,
  onCancel,
  onConfirm,
  isSubmitting = false,
  questions = [],
  questionStatuses = {},
  timeRemaining,
  formatTime,
}) => {
  // Block scroll while open
  useEffect(() => {
    if (show) document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, [show]);

  // Close on Escape
  useEffect(() => {
    if (!show) return;
    const handler = (e) => { if (e.key === "Escape" && !isSubmitting) onCancel(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [show, isSubmitting, onCancel]);

  if (!show) return null;

  const total    = questions.length;
  const solved   = Object.values(questionStatuses).filter((s) => s.attempted && s.correct).length;
  const attempted = Object.values(questionStatuses).filter((s) => s.attempted).length;
  const unattempted = total - attempted;

  const isLowTime = timeRemaining !== undefined && timeRemaining <= 120;

  return (
    <div
      className="fixed inset-0 z-[9998] flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget && !isSubmitting) onCancel(); }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative w-full max-w-md rounded-2xl border border-gray-700/60
                      bg-gray-900 shadow-2xl shadow-black/60 overflow-hidden">

        {/* ── Top accent bar ─────────────────────────────────────────────── */}
        <div className="h-1 w-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500" />

        {/* ── Header ────────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-gray-700/60">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-amber-500/15 border border-amber-500/30
                            flex items-center justify-center">
              <AlertTriangle size={20} className="text-amber-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Submit Test?</h2>
              <p className="text-xs text-gray-500 mt-0.5">This action cannot be undone.</p>
            </div>
          </div>

          {!isSubmitting && (
            <button
              onClick={onCancel}
              className="text-gray-600 hover:text-gray-300 transition-colors p-1 rounded-md hover:bg-gray-800"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* ── Stats grid ────────────────────────────────────────────────── */}
        <div className="px-6 py-4 grid grid-cols-3 gap-3">
          <StatCard
            value={solved}
            label="Solved"
            color="emerald"
            icon={<CheckCircle size={15} />}
          />
          <StatCard
            value={attempted - solved}
            label="Attempted"
            color="amber"
            icon={<AlertTriangle size={15} />}
          />
          <StatCard
            value={unattempted}
            label="Skipped"
            color="gray"
            icon={<XCircle size={15} />}
          />
        </div>

        {/* ── Per-question status list ───────────────────────────────────── */}
        <div className="px-6 pb-4 space-y-1.5 max-h-44 overflow-y-auto">
          {questions.map((q, idx) => {
            const s = questionStatuses[idx];
            const statusConfig = !s?.attempted
              ? { label: "Not attempted", dot: "bg-gray-600", text: "text-gray-500" }
              : s.correct
              ? { label: "Solved",        dot: "bg-emerald-400", text: "text-emerald-400" }
              : { label: "Attempted",     dot: "bg-amber-400",   text: "text-amber-400"   };

            return (
              <div
                key={idx}
                className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-gray-800/50"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="flex-shrink-0 w-5 h-5 rounded-md bg-gray-700 flex items-center
                                   justify-center text-xs font-bold text-gray-400">
                    {idx + 1}
                  </span>
                  <span className="text-xs text-gray-300 truncate">
                    {q.title || `Question ${idx + 1}`}
                  </span>
                </div>
                <div className={`flex items-center gap-1.5 flex-shrink-0 ${statusConfig.text}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`} />
                  <span className="text-xs">{statusConfig.label}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Time remaining banner ──────────────────────────────────────── */}
        {timeRemaining !== undefined && (
          <div className={`
            mx-6 mb-4 flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium
            ${isLowTime
              ? "bg-red-500/10 border-red-500/30 text-red-400"
              : "bg-gray-800/60 border-gray-700/50 text-gray-400"
            }
          `}>
            <Clock size={13} className={isLowTime ? "text-red-400" : "text-gray-500"} />
            <span>
              Time remaining:{" "}
              <span className={`font-mono font-bold ${isLowTime ? "text-red-300" : "text-white"}`}>
                {formatTime ? formatTime(timeRemaining) : timeRemaining}
              </span>
            </span>
            {isLowTime && (
              <span className="ml-auto text-red-500 font-semibold">Low!</span>
            )}
          </div>
        )}

        {/* ── Unattempted warning ────────────────────────────────────────── */}
        {unattempted > 0 && (
          <div className="mx-6 mb-4 flex items-start gap-2 px-3 py-2 rounded-lg
                          bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs">
            <AlertTriangle size={13} className="flex-shrink-0 mt-0.5" />
            <span>
              You have <strong>{unattempted}</strong> unattempted{" "}
              {unattempted === 1 ? "question" : "questions"}.
              You can still go back and attempt {unattempted === 1 ? "it" : "them"}.
            </span>
          </div>
        )}

        {/* ── Actions ───────────────────────────────────────────────────── */}
        <div className="flex items-center gap-3 px-6 pb-6">
          <button
            onClick={onCancel}
            disabled={isSubmitting}
            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-700 text-sm font-semibold
                       text-gray-300 bg-gray-800 hover:bg-gray-700 hover:border-gray-600
                       transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Cancel
          </button>

          <button
            onClick={onConfirm}
            disabled={isSubmitting}
            className="flex-1 flex items-center justify-center gap-2
                       px-4 py-2.5 rounded-xl text-sm font-bold text-white
                       bg-emerald-600 hover:bg-emerald-500
                       border border-emerald-500/50
                       shadow-lg shadow-emerald-900/30
                       transition-all duration-150 active:scale-95
                       disabled:opacity-60 disabled:cursor-not-allowed
                       disabled:shadow-none disabled:scale-100"
          >
            {isSubmitting ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white
                                 rounded-full animate-spin" />
                Submitting…
              </>
            ) : (
              <>
                <Send size={14} />
                Submit Test
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Small stat card ──────────────────────────────────────────────────────────
const colorMap = {
  emerald: { text: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
  amber:   { text: "text-amber-400",   bg: "bg-amber-500/10",   border: "border-amber-500/20"   },
  gray:    { text: "text-gray-400",    bg: "bg-gray-800/60",    border: "border-gray-700/50"    },
};

const StatCard = ({ value, label, color, icon }) => {
  const c = colorMap[color] || colorMap.gray;
  return (
    <div className={`flex flex-col items-center gap-1 py-3 rounded-xl border ${c.bg} ${c.border}`}>
      <div className={`flex items-center gap-1 ${c.text}`}>
        {icon}
        <span className="text-xl font-bold font-mono">{value}</span>
      </div>
      <span className="text-xs text-gray-500">{label}</span>
    </div>
  );
};

export default SubmitModal;