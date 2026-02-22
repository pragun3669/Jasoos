import React from "react";
import { CheckCircle, AlertCircle, Circle, ChevronRight } from "lucide-react";

/**
 * QuestionNavigator — vertical sidebar
 *
 * Props:
 *  questions         array
 *  currentIndex      number
 *  switchQuestion    (index) => void
 *  questionStatuses  { [index]: { attempted, correct } }
 *  isTransitioning   boolean
 */
const QuestionNavigator = ({
  questions = [],
  currentIndex,
  switchQuestion,
  questionStatuses = {},
  isTransitioning = false,
}) => {
  const getStatus = (index) => questionStatuses[index] || { attempted: false, correct: false };

  const getItemStyle = (index) => {
    const isCurrent = index === currentIndex;
    const { attempted, correct } = getStatus(index);

    if (isCurrent)
      return {
        wrapper: "bg-blue-500/15 border-blue-500/60 text-white",
        badge:   "bg-blue-500 text-white shadow-lg shadow-blue-500/30",
        indicator: "bg-blue-400",
      };
    if (attempted && correct)
      return {
        wrapper: "bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/15",
        badge:   "bg-emerald-500/20 text-emerald-400",
        indicator: "bg-emerald-400",
      };
    if (attempted && !correct)
      return {
        wrapper: "bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/15",
        badge:   "bg-amber-500/20 text-amber-400",
        indicator: "bg-amber-400",
      };
    return {
      wrapper: "bg-gray-800/50 border-gray-700/50 text-gray-400 hover:bg-gray-700/60 hover:text-gray-200",
      badge:   "bg-gray-700 text-gray-400",
      indicator: "bg-gray-600",
    };
  };

  const StatusIcon = ({ index }) => {
    const { attempted, correct } = getStatus(index);
    if (!attempted) return <Circle size={14} className="text-gray-600" />;
    if (correct)    return <CheckCircle size={14} className="text-emerald-400" />;
    return <AlertCircle size={14} className="text-amber-400" />;
  };

  return (
    <aside className="flex flex-col w-52 flex-shrink-0 bg-gray-900 border-r border-gray-700/60 h-full">

      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-700/60">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-500">
          Questions
        </h2>
        <p className="text-xs text-gray-600 mt-0.5">
          {questions.length} total ·{" "}
          {Object.values(questionStatuses).filter((s) => s.attempted && s.correct).length} solved
        </p>
      </div>

      {/* Question list */}
      <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-1">
        {questions.map((q, index) => {
          const style = getItemStyle(index);
          const isCurrent = index === currentIndex;

          return (
            <button
              key={index}
              onClick={() => !isTransitioning && switchQuestion(index)}
              disabled={isTransitioning}
              className={`
                group relative w-full flex items-center gap-3 px-3 py-2.5
                rounded-lg border text-left
                transition-all duration-200
                ${style.wrapper}
                ${isCurrent ? "ring-1 ring-blue-500/40" : ""}
                disabled:cursor-wait
              `}
            >
              {/* Active indicator bar */}
              {isCurrent && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-blue-400 rounded-full" />
              )}

              {/* Badge */}
              <span
                className={`
                  flex-shrink-0 w-7 h-7 rounded-md flex items-center justify-center
                  text-xs font-bold transition-colors duration-200
                  ${style.badge}
                `}
              >
                {index + 1}
              </span>

              {/* Title */}
              <span className="flex-1 text-xs font-medium truncate leading-tight">
                {q.title || `Question ${index + 1}`}
              </span>

              {/* Status icon */}
              <span className="flex-shrink-0">
                {isCurrent
                  ? <ChevronRight size={14} className="text-blue-400" />
                  : <StatusIcon index={index} />
                }
              </span>
            </button>
          );
        })}
      </nav>

      {/* Footer legend */}
      <div className="px-4 py-3 border-t border-gray-700/60 space-y-1.5">
        {[
          { color: "bg-blue-400",    label: "Current" },
          { color: "bg-emerald-400", label: "Solved" },
          { color: "bg-amber-400",   label: "Attempted" },
          { color: "bg-gray-600",    label: "Unseen" },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${color}`} />
            <span className="text-xs text-gray-500">{label}</span>
          </div>
        ))}
      </div>
    </aside>
  );
};

export default QuestionNavigator;