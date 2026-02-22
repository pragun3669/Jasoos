import React from "react";
import { AlertTriangle, Maximize2 } from "lucide-react";

/**
 * TabWarningOverlay
 *
 * Full-screen-blocking overlay shown when the student leaves fullscreen
 * or switches tabs. Forces them to click "Return to Test" before continuing.
 *
 * Props:
 *  showWarning     boolean
 *  warningMessage  string
 *  tabSwitchCount  number
 *  maxTabSwitches  number
 *  isFullscreen    boolean
 *  onReturnToTest  () => void   — should call enterFullscreen() then hide overlay
 */
const TabWarningOverlay = ({
  showWarning,
  warningMessage,
  tabSwitchCount,
  maxTabSwitches,
  isFullscreen,
  onReturnToTest,
}) => {
  // Show overlay if: explicit warning fired  OR  fullscreen was exited
  const visible = showWarning || !isFullscreen;
  if (!visible) return null;

  const isCritical = tabSwitchCount >= maxTabSwitches * 0.8;
  const remaining  = maxTabSwitches - tabSwitchCount;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div
        className={`
          mx-4 w-full max-w-md rounded-2xl border-2 p-8 shadow-2xl text-center
          ${isCritical
            ? "bg-red-950 border-red-500"
            : "bg-gray-900 border-amber-500"}
        `}
      >
        {/* Icon */}
        <div
          className={`
            mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full
            ${isCritical ? "bg-red-500/20" : "bg-amber-500/20"}
          `}
        >
          <AlertTriangle
            size={32}
            className={isCritical ? "text-red-400" : "text-amber-400"}
          />
        </div>

        {/* Heading */}
        <h2
          className={`mb-2 text-xl font-bold ${isCritical ? "text-red-300" : "text-amber-300"}`}
        >
          {!isFullscreen ? "Fullscreen Exited" : "Tab Switch Detected"}
        </h2>

        {/* Message */}
        <p className="mb-1 text-gray-300 text-sm">
          {warningMessage || "You have left the test environment."}
        </p>

        {/* Counter */}
        <p
          className={`mb-6 text-sm font-semibold ${isCritical ? "text-red-400" : "text-amber-400"}`}
        >
          Violations: {tabSwitchCount} / {maxTabSwitches}
          {remaining <= 5 && remaining > 0 && (
            <span className="ml-2 text-red-400">
              — {remaining} remaining before auto-submit!
            </span>
          )}
        </p>

        {/* CTA */}
        <button
          onClick={onReturnToTest}
          className={`
            w-full flex items-center justify-center gap-2
            rounded-xl px-6 py-3 font-bold text-white
            transition-all duration-200 active:scale-95
            ${isCritical
              ? "bg-red-600 hover:bg-red-500"
              : "bg-amber-600 hover:bg-amber-500"}
          `}
        >
          <Maximize2 size={18} />
          Return to Test (Fullscreen)
        </button>

        <p className="mt-3 text-xs text-gray-500">
          Repeated violations may result in automatic submission.
        </p>
      </div>
    </div>
  );
};

export default TabWarningOverlay;