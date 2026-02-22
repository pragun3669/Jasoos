import { useEffect, useRef, useState, useCallback } from "react";

const STORAGE_KEY_PREFIX = "studentTest_timer_";

/**
 * useTimer
 *
 * Bulletproof persistent countdown timer.
 * - Saves remaining time to localStorage every second.
 * - On reload, resumes from saved time — NEVER restarts from full duration.
 * - Falls back to durationSeconds only on the very first load (no saved value).
 * - Uses wall-clock (Date.now) delta to correct for tab-sleep / throttling drift.
 *
 * @param {object}   params
 * @param {number}   params.durationSeconds  - total test duration in seconds
 * @param {string}   params.testId           - unique id used as localStorage key
 * @param {boolean}  params.enabled          - begin ticking when true
 * @param {function} params.onExpire         - called exactly once when timer hits 0
 */
export default function useTimer({
  durationSeconds = 0,
  testId = "",
  enabled = true,
  onExpire,
}) {
  const storageKey = `${STORAGE_KEY_PREFIX}${testId}`;
  const intervalRef  = useRef(null);
  const lastTickRef  = useRef(null);   // wall-clock ms of last tick
  const onExpireRef  = useRef(onExpire);
  const expiredRef   = useRef(false);  // guard: fire onExpire only once

  // Keep the callback ref current without affecting the interval effect
  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  // ── localStorage helpers ───────────────────────────────────────────────────
  const readStoredTime = useCallback(() => {
    if (!testId) return null;
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw === null) return null;
      const val = parseInt(raw, 10);
      return isNaN(val) || val < 0 ? null : val;
    } catch {
      return null;
    }
  }, [testId, storageKey]);

  const writeStoredTime = useCallback(
    (seconds) => {
      if (!testId) return;
      try {
        localStorage.setItem(storageKey, String(Math.max(0, seconds)));
      } catch {
        // ignore quota / private-mode errors
      }
    },
    [testId, storageKey]
  );

  // ── State (null = not yet initialised) ────────────────────────────────────
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [isInitialized, setIsInitialized]  = useState(false);
  const [isRunning, setIsRunning]          = useState(false);

  // ── Initialise ONCE when durationSeconds becomes available ────────────────
  useEffect(() => {
    if (durationSeconds <= 0 || isInitialized) return;

    const stored = readStoredTime();

    if (stored !== null) {
      // ✅ RELOAD PATH — resume from exactly where the student left off
      setTimeRemaining(stored);
    } else {
      // ✅ FIRST LOAD — start from full duration and persist immediately
      setTimeRemaining(durationSeconds);
      writeStoredTime(durationSeconds);
    }

    setIsInitialized(true);
  }, [durationSeconds, isInitialized, readStoredTime, writeStoredTime]);

  // ── Tick loop ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!enabled || !isInitialized || timeRemaining === null) return;
    if (timeRemaining <= 0) {
      // Already expired (e.g. loaded from storage at 0)
      if (!expiredRef.current) {
        expiredRef.current = true;
        setTimeout(() => onExpireRef.current?.(), 0);
      }
      return;
    }

    setIsRunning(true);
    lastTickRef.current = Date.now();

    intervalRef.current = setInterval(() => {
      const now     = Date.now();
      // Use actual wall-clock delta so sleep/throttle doesn't slow the timer
      const elapsed = Math.max(1, Math.round((now - lastTickRef.current) / 1000));
      lastTickRef.current = now;

      setTimeRemaining((prev) => {
        if (prev === null) return prev;
        const next = Math.max(0, prev - elapsed);

        // Persist every tick
        writeStoredTime(next);

        if (next <= 0 && !expiredRef.current) {
          expiredRef.current = true;
          clearInterval(intervalRef.current);
          setIsRunning(false);
          setTimeout(() => onExpireRef.current?.(), 0);
        }

        return next;
      });
    }, 1000);

    return () => {
      clearInterval(intervalRef.current);
      setIsRunning(false);
    };
    // ⚠️  Intentionally omitting `timeRemaining` from deps so the interval
    //     is only created once per initialisation, not reset on every second.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, isInitialized]);

  // ── Public helpers ─────────────────────────────────────────────────────────

  /** Format seconds → "MM:SS"  or  "H:MM:SS" for tests over an hour */
  const formatTime = useCallback((seconds) => {
    if (seconds === null || seconds === undefined || isNaN(seconds)) return "--:--";
    const s   = Math.max(0, Math.floor(seconds));
    const h   = Math.floor(s / 3600);
    const m   = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    const mm  = String(m).padStart(2, "0");
    const ss  = String(sec).padStart(2, "0");
    return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
  }, []);

  /**
   * Call this after a successful final submit.
   * Clears the stored value so the next test starts fresh.
   */
  const clearStoredTime = useCallback(() => {
    try { localStorage.removeItem(storageKey); } catch { /* ignore */ }
    expiredRef.current = true;
    clearInterval(intervalRef.current);
    setIsRunning(false);
  }, [storageKey]);

  return {
    timeRemaining: timeRemaining ?? 0,
    isRunning,
    isInitialized,
    formatTime,
    clearStoredTime,
  };
}