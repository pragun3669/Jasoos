import { useEffect, useRef, useState, useCallback } from "react";

const TAB_SWITCH_KEY = "studentTest_tabSwitches_";
const MAX_TAB_SWITCHES = 45;

/**
 * useTabMonitoring
 *
 * Features:
 *  - Counts every tab-switch / window-blur / visibility-hidden event
 *  - Persists count to localStorage → survives page reload
 *  - Enforces fullscreen on mount and re-enters it after accidental exit
 *  - Shows a warning overlay every time the student leaves fullscreen / switches tabs
 *  - Calls onMaxViolation() exactly once when the limit is hit
 *
 * @param {string}   testId          - unique test id (used as storage key suffix)
 * @param {function} onMaxViolation  - callback fired when tab switches hit MAX
 */
export default function useTabMonitoring(testId = "", onMaxViolation) {
  const storageKey    = `${TAB_SWITCH_KEY}${testId}`;
  const onMaxRef      = useRef(onMaxViolation);
  const firedMaxRef   = useRef(false);
  const fsRetryRef    = useRef(null);

  useEffect(() => { onMaxRef.current = onMaxViolation; }, [onMaxViolation]);

  // ── Persist helpers ────────────────────────────────────────────────────────
  const readCount = useCallback(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw === null) return 0;
      const val = parseInt(raw, 10);
      return isNaN(val) || val < 0 ? 0 : val;
    } catch { return 0; }
  }, [storageKey]);

  const writeCount = useCallback((n) => {
    try { localStorage.setItem(storageKey, String(n)); } catch { /* ignore */ }
  }, [storageKey]);

  // ── State ──────────────────────────────────────────────────────────────────
  const [tabSwitchCount, setTabSwitchCount] = useState(() => readCount());
  const [isFullscreen,   setIsFullscreen]   = useState(false);
  const [showWarning,    setShowWarning]     = useState(false);
  const [warningMessage, setWarningMessage] = useState("");

  // ── Fullscreen helpers ─────────────────────────────────────────────────────
  const enterFullscreen = useCallback(async () => {
    const el = document.documentElement;
    try {
      if (el.requestFullscreen)            await el.requestFullscreen();
      else if (el.webkitRequestFullscreen) await el.webkitRequestFullscreen();
      else if (el.mozRequestFullScreen)    await el.mozRequestFullScreen();
      else if (el.msRequestFullscreen)     await el.msRequestFullscreen();
      setIsFullscreen(true);
    } catch (err) {
      console.warn("Fullscreen request failed:", err);
    }
  }, []);

  const isCurrentlyFullscreen = useCallback(() =>
    !!(
      document.fullscreenElement       ||
      document.webkitFullscreenElement ||
      document.mozFullScreenElement    ||
      document.msFullscreenElement
    ), []);

  // ── Record a violation ─────────────────────────────────────────────────────
  const recordViolation = useCallback((message) => {
    setTabSwitchCount((prev) => {
      const next = prev + 1;
      writeCount(next);

      setWarningMessage(message);
      setShowWarning(true);
      setTimeout(() => setShowWarning(false), 4000);

      if (next >= MAX_TAB_SWITCHES && !firedMaxRef.current) {
        firedMaxRef.current = true;
        setTimeout(() => onMaxRef.current?.(), 0);
      }

      return next;
    });
  }, [writeCount]);

  // ── Fullscreen-change listener ─────────────────────────────────────────────
  useEffect(() => {
    const handleFsChange = () => {
      const inFs = isCurrentlyFullscreen();
      setIsFullscreen(inFs);

      if (!inFs) {
        recordViolation("⚠️ Fullscreen exited — please return to fullscreen");

        // Try to re-enter after a short delay (gives browser time to settle)
        clearTimeout(fsRetryRef.current);
        fsRetryRef.current = setTimeout(() => enterFullscreen(), 1500);
      }
    };

    document.addEventListener("fullscreenchange",       handleFsChange);
    document.addEventListener("webkitfullscreenchange", handleFsChange);
    document.addEventListener("mozfullscreenchange",    handleFsChange);
    document.addEventListener("MSFullscreenChange",     handleFsChange);

    return () => {
      document.removeEventListener("fullscreenchange",       handleFsChange);
      document.removeEventListener("webkitfullscreenchange", handleFsChange);
      document.removeEventListener("mozfullscreenchange",    handleFsChange);
      document.removeEventListener("MSFullscreenChange",     handleFsChange);
      clearTimeout(fsRetryRef.current);
    };
  }, [isCurrentlyFullscreen, enterFullscreen, recordViolation]);

  // ── Visibility-change listener (alt+tab, cmd+tab, new tab, etc.) ──────────
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) {
        recordViolation("⚠️ Tab switch detected — return to the test");
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [recordViolation]);

  // ── Window blur (clicking outside browser, task-switching) ────────────────
  useEffect(() => {
    const handleBlur = () => {
      // Only fire if not already counted by visibilitychange
      if (!document.hidden) {
        recordViolation("⚠️ Window focus lost — return to the test");
      }
    };
    window.addEventListener("blur", handleBlur);
    return () => window.removeEventListener("blur", handleBlur);
  }, [recordViolation]);

  // ── Block keyboard shortcuts that escape fullscreen / switch context ───────
  useEffect(() => {
    const handleKeyDown = (e) => {
      const blocked =
        e.key === "F11"                                   || // toggle fullscreen
        (e.altKey && e.key === "Tab")                     || // alt+tab
        (e.metaKey && e.key === "Tab")                    || // cmd+tab (mac)
        (e.ctrlKey && (e.key === "w" || e.key === "W"))   || // close tab
        (e.ctrlKey && (e.key === "t" || e.key === "T"))   || // new tab
        (e.ctrlKey && (e.key === "n" || e.key === "N"))   || // new window
        (e.metaKey && (e.key === "w" || e.key === "W"))   || // mac close tab
        (e.metaKey && (e.key === "t" || e.key === "T"))   || // mac new tab
        (e.metaKey && (e.key === "n" || e.key === "N"));     // mac new window

      if (blocked) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    window.addEventListener("keydown", handleKeyDown, { capture: true });
    return () => window.removeEventListener("keydown", handleKeyDown, { capture: true });
  }, []);

  // ── Enter fullscreen on first mount ───────────────────────────────────────
  useEffect(() => {
    // Small delay so the page is interactive before the FS request
    const t = setTimeout(() => enterFullscreen(), 300);
    return () => clearTimeout(t);
  }, [enterFullscreen]);

  // ── clearStoredCount (call on submit) ──────────────────────────────────────
  const clearStoredCount = useCallback(() => {
    try { localStorage.removeItem(storageKey); } catch { /* ignore */ }
  }, [storageKey]);

  return {
    tabSwitchCount,
    isFullscreen,
    showWarning,
    warningMessage,
    enterFullscreen,
    clearStoredCount,
    MAX_TAB_SWITCHES,
  };
}