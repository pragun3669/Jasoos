import React, { useEffect, useRef } from "react";
import { Tag, BarChart2, BookOpen } from "lucide-react";

/**
 * QuestionPanel
 *
 * Props:
 *  question        object  — current question
 *  questionIndex   number
 *  totalQuestions  number
 *  isTransitioning boolean — drives the slide animation
 */
const QuestionPanel = ({
  question,
  questionIndex,
  totalQuestions,
  isTransitioning = false,
}) => {
  const scrollRef = useRef(null);

  // Scroll to top whenever question changes
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [questionIndex]);

  if (!question) {
    return (
      <div className="flex flex-col h-full items-center justify-center text-gray-500 gap-3">
        <BookOpen size={32} className="opacity-30" />
        <p className="text-sm">No question selected</p>
      </div>
    );
  }

  const difficultyConfig = {
    easy:   { label: "Easy",   color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30" },
    medium: { label: "Medium", color: "text-amber-400   bg-amber-500/10   border-amber-500/30"   },
    hard:   { label: "Hard",   color: "text-red-400     bg-red-500/10     border-red-500/30"     },
  };
  const diff = difficultyConfig[(question.difficulty || "").toLowerCase()] || difficultyConfig.medium;

  return (
    <div
      className={`
        flex flex-col h-full
        transition-all duration-150 ease-in-out
        ${isTransitioning ? "opacity-0 translate-x-2" : "opacity-100 translate-x-0"}
      `}
    >
      {/* ── Question meta bar ─────────────────────────────────────────────── */}
      <div className="flex-shrink-0 px-5 pt-4 pb-3 border-b border-gray-700/60 flex items-start justify-between gap-3">
        <div className="min-w-0">
          {/* Q index pill */}
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
              Q{questionIndex + 1}
              <span className="text-gray-700"> / {totalQuestions}</span>
            </span>
          </div>

          <h2 className="text-base font-semibold text-white leading-snug">
            {question.title || `Question ${questionIndex + 1}`}
          </h2>
        </div>

        {/* Difficulty badge */}
        <span
          className={`
            flex-shrink-0 mt-0.5 inline-flex items-center gap-1 px-2.5 py-1
            text-xs font-semibold rounded-md border
            ${diff.color}
          `}
        >
          <BarChart2 size={11} />
          {diff.label}
        </span>
      </div>

      {/* ── Scrollable body ───────────────────────────────────────────────── */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-5 text-sm text-gray-300 leading-relaxed">

        {/* Description */}
        <p className="whitespace-pre-wrap">{question.description}</p>

        {/* Examples */}
        {question.examples?.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-500">
              Examples
            </h3>
            {question.examples.map((ex, i) => (
              <div
                key={i}
                className="rounded-lg border border-gray-700/60 bg-gray-800/50 overflow-hidden"
              >
                <div className="px-3 py-1.5 border-b border-gray-700/40 text-xs text-gray-500 font-medium">
                  Example {i + 1}
                </div>
                <div className="px-3 py-2.5 space-y-1.5 font-mono text-xs">
                  {ex.input !== undefined && (
                    <div>
                      <span className="text-gray-500">Input:  </span>
                      <span className="text-gray-200">{String(ex.input)}</span>
                    </div>
                  )}
                  {ex.output !== undefined && (
                    <div>
                      <span className="text-gray-500">Output: </span>
                      <span className="text-emerald-300">{String(ex.output)}</span>
                    </div>
                  )}
                  {ex.explanation && (
                    <div className="pt-1 text-gray-400 font-sans">
                      {ex.explanation}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Constraints */}
        {question.constraints?.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-500">
              Constraints
            </h3>
            <ul className="space-y-1">
              {question.constraints.map((c, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="mt-1.5 w-1 h-1 rounded-full bg-gray-600 flex-shrink-0" />
                  <span className="font-mono text-xs text-gray-400">{c}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Tags */}
        {question.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {question.tags.map((tag, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full
                           text-xs bg-gray-700/50 text-gray-400 border border-gray-700/50"
              >
                <Tag size={9} />
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default QuestionPanel;