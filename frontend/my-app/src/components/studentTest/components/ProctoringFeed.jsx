import React, { useRef, useState, useEffect, useCallback } from "react";
import { GripHorizontal } from "lucide-react";

const PADDING = 12; // min distance from viewport edge

const ProctoringFeed = ({
  videoRef,
  canvasRef,
  isProctoringActive,
  showViolationAlert,
  violationMessage,
  violationType,
}) => {
  // Default position: bottom-right
  const [pos, setPos] = useState({ x: null, y: null });
  const [dragging, setDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const containerRef = useRef(null);

  // Set initial position once mounted (we need window dimensions)
  useEffect(() => {
    const W = window.innerWidth;
    const H = window.innerHeight;
    setPos({ x: W - 208 - PADDING, y: H - 160 - PADDING });
  }, []);

  // ── Drag handlers ──────────────────────────────────────────────────────────
  const onMouseDown = useCallback((e) => {
    e.preventDefault();
    const rect = containerRef.current.getBoundingClientRect();
    dragOffset.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
    setDragging(true);
  }, []);

  const onMouseMove = useCallback((e) => {
    if (!dragging) return;
    const W = window.innerWidth;
    const H = window.innerHeight;
    const el = containerRef.current;
    const elW = el?.offsetWidth  || 208;
    const elH = el?.offsetHeight || 160;

    const rawX = e.clientX - dragOffset.current.x;
    const rawY = e.clientY - dragOffset.current.y;

    setPos({
      x: Math.max(PADDING, Math.min(rawX, W - elW - PADDING)),
      y: Math.max(PADDING, Math.min(rawY, H - elH - PADDING)),
    });
  }, [dragging]);

  const onMouseUp = useCallback(() => setDragging(false), []);

  // Touch support
  const onTouchStart = useCallback((e) => {
    const touch = e.touches[0];
    const rect = containerRef.current.getBoundingClientRect();
    dragOffset.current = {
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top,
    };
    setDragging(true);
  }, []);

  const onTouchMove = useCallback((e) => {
    if (!dragging) return;
    e.preventDefault();
    const touch = e.touches[0];
    const W = window.innerWidth;
    const H = window.innerHeight;
    const el = containerRef.current;
    const elW = el?.offsetWidth  || 208;
    const elH = el?.offsetHeight || 160;

    const rawX = touch.clientX - dragOffset.current.x;
    const rawY = touch.clientY - dragOffset.current.y;

    setPos({
      x: Math.max(PADDING, Math.min(rawX, W - elW - PADDING)),
      y: Math.max(PADDING, Math.min(rawY, H - elH - PADDING)),
    });
  }, [dragging]);

  useEffect(() => {
    if (dragging) {
      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup",   onMouseUp);
      window.addEventListener("touchmove", onTouchMove, { passive: false });
      window.addEventListener("touchend",  onMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup",   onMouseUp);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend",  onMouseUp);
    };
  }, [dragging, onMouseMove, onMouseUp, onTouchMove]);

  // Don't render until initial position is calculated
  if (pos.x === null) return null;

  return (
    <>
      {/* ── Draggable camera widget ──────────────────────────────────────── */}
      <div
        ref={containerRef}
        style={{ left: pos.x, top: pos.y }}
        className={`
          fixed z-50 w-48 rounded-xl overflow-hidden
          shadow-2xl shadow-black/60
          border-2 transition-colors duration-300
          ${isProctoringActive ? "border-emerald-500/70" : "border-gray-600"}
          ${dragging ? "cursor-grabbing scale-105 shadow-black/80" : "cursor-grab"}
          select-none
        `}
      >
        {/* Drag handle */}
        <div
          onMouseDown={onMouseDown}
          onTouchStart={onTouchStart}
          className={`
            flex items-center justify-between px-2 py-1
            bg-gray-900 border-b border-gray-700/60
            ${dragging ? "cursor-grabbing" : "cursor-grab"}
          `}
        >
          <div className="flex items-center gap-1.5">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isProctoringActive ? "bg-emerald-400 animate-pulse" : "bg-gray-600"
              }`}
            />
            <span className="text-xs font-semibold text-gray-400">
              {isProctoringActive ? "LIVE" : "OFF"}
            </span>
          </div>
          <GripHorizontal size={12} className="text-gray-600" />
        </div>

        {/* Video */}
        <div className="relative bg-black">
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-36 object-cover block"
          />

          {/* Canvas overlay for bounding boxes */}
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full pointer-events-none"
          />

          {/* "Keep face in green box" hint */}
          {isProctoringActive && (
            <div className="absolute bottom-1.5 left-1.5 right-1.5">
              <div className="bg-black/70 backdrop-blur-sm text-white text-[10px]
                              text-center px-2 py-1 rounded-md leading-tight">
                Keep face in green box
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Violation alert (centered top, not tied to camera position) ─── */}
      {showViolationAlert && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[9997]
                        pointer-events-none w-full max-w-md px-4">
          <div
            className={`
              px-6 py-4 rounded-xl shadow-2xl font-bold border-2 text-center
              animate-bounce
              ${violationType === "unauthorized_object" || violationType === "no_face"
                ? "bg-red-500 border-red-600 text-white"
                : "bg-yellow-500 border-yellow-600 text-black"
              }
            `}
          >
            <div className="text-base">{violationMessage}</div>
            <div className="text-xs mt-1 opacity-75 font-normal">
              Adjust within 15 seconds
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ProctoringFeed;