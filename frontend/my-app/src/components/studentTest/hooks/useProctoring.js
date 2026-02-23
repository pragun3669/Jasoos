import { useEffect, useRef, useState, useCallback } from "react";
import { AI_SERVICE_URL } from "../../../config";
const WARNING_COOLDOWN = 15000; // 15 seconds between warnings

export default function useProctoring({
  proctoringEnabled,
  proctoringBackend,
  proctoringStarted,
}) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const intervalRef = useRef(null);
  const lastWarningTimeRef = useRef(0);

  const [isProctoringActive, setIsProctoringActive] = useState(false);
  const [proctoringReady, setProctoringReady] = useState(false);
  const [showViolationAlert, setShowViolationAlert] = useState(false);
  const [violationMessage, setViolationMessage] = useState("");
  const [violationType, setViolationType] = useState("");

  const PROCTORING_BACKEND =
    proctoringBackend || `${AI_SERVICE_URL}/proctoring`;

  // ─── Draw bounding boxes on overlay canvas ────────────────────────────────
  const drawLiveBoundingBoxes = useCallback((canvas, video, data) => {
    if (!canvas || !video) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const videoWidth = video.videoWidth || video.clientWidth;
    const videoHeight = video.videoHeight || video.clientHeight;
    if (videoWidth === 0 || videoHeight === 0) return;

    canvas.width = videoWidth;
    canvas.height = videoHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!data?.reference_face_bbox) return;

    const [x1, y1, x2, y2] = data.reference_face_bbox;

    const scaleX = canvas.width / videoWidth;
    const scaleY = canvas.height / videoHeight;

    const scaledX1 = x1 * scaleX;
    const scaledY1 = y1 * scaleY;
    const scaledX2 = x2 * scaleX;
    const scaledY2 = y2 * scaleY;
    const width = scaledX2 - scaledX1;
    const height = scaledY2 - scaledY1;
    const centerX = scaledX1 + width / 2;
    const centerY = scaledY1 + height / 2;

    // Determine colour based on status
    let mainBoxColor = "#10B981";
    let boxLabel = "GOOD POSITION";

    if (data.status === "no_face") {
      mainBoxColor = "#EF4444";
      boxLabel = "NO FACE DETECTED";
    } else if (data.status === "face_moved") {
      mainBoxColor = "#F59E0B";
      boxLabel = "ADJUST POSITION";
    } else if (data.status === "eyes_closed") {
      mainBoxColor = "#F59E0B";
      boxLabel = "EYES CLOSED";
    } else if (data.status === "looking_away") {
      mainBoxColor = "#F59E0B";
      boxLabel = "LOOK AT SCREEN";
    } else if (data.status === "unauthorized_object") {
      mainBoxColor = "#EF4444";
      boxLabel = "OBJECT DETECTED";
    } else if (data.warnings?.length > 0) {
      mainBoxColor = "#F59E0B";
      boxLabel = "WARNING";
    }

    // Main bounding box
    ctx.strokeStyle = mainBoxColor;
    ctx.lineWidth = 3;
    ctx.setLineDash([]);
    ctx.strokeRect(scaledX1, scaledY1, width, height);

    // Corner brackets
    const cornerLength = 25;
    ctx.lineWidth = 3;

    // Top-left
    ctx.beginPath();
    ctx.moveTo(scaledX1, scaledY1 + cornerLength);
    ctx.lineTo(scaledX1, scaledY1);
    ctx.lineTo(scaledX1 + cornerLength, scaledY1);
    ctx.stroke();

    // Top-right
    ctx.beginPath();
    ctx.moveTo(scaledX2 - cornerLength, scaledY1);
    ctx.lineTo(scaledX2, scaledY1);
    ctx.lineTo(scaledX2, scaledY1 + cornerLength);
    ctx.stroke();

    // Bottom-left
    ctx.beginPath();
    ctx.moveTo(scaledX1, scaledY2 - cornerLength);
    ctx.lineTo(scaledX1, scaledY2);
    ctx.lineTo(scaledX1 + cornerLength, scaledY2);
    ctx.stroke();

    // Bottom-right
    ctx.beginPath();
    ctx.moveTo(scaledX2 - cornerLength, scaledY2);
    ctx.lineTo(scaledX2, scaledY2);
    ctx.lineTo(scaledX2, scaledY2 - cornerLength);
    ctx.stroke();

    // Warning zone (dashed yellow)
    const warningPadding = 40;
    ctx.strokeStyle = "#F59E0B";
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 4]);
    ctx.strokeRect(
      scaledX1 - warningPadding,
      scaledY1 - warningPadding,
      width + warningPadding * 2,
      height + warningPadding * 2
    );

    // Danger zone (dashed red)
    const dangerPadding = 70;
    ctx.strokeStyle = "#EF4444";
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.strokeRect(
      scaledX1 - dangerPadding,
      scaledY1 - dangerPadding,
      width + dangerPadding * 2,
      height + dangerPadding * 2
    );

    // Center crosshair
    ctx.strokeStyle = mainBoxColor;
    ctx.lineWidth = 2;
    ctx.setLineDash([]);
    const crossSize = 15;
    ctx.beginPath();
    ctx.moveTo(centerX - crossSize, centerY);
    ctx.lineTo(centerX + crossSize, centerY);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(centerX, centerY - crossSize);
    ctx.lineTo(centerX, centerY + crossSize);
    ctx.stroke();
    ctx.fillStyle = mainBoxColor;
    ctx.beginPath();
    ctx.arc(centerX, centerY, 3, 0, 2 * Math.PI);
    ctx.fill();

    // Current face bbox (dashed, semi-transparent)
    if (data.face_bbox) {
      const [fx1, fy1, fx2, fy2] = data.face_bbox;
      ctx.strokeStyle = mainBoxColor;
      ctx.lineWidth = 2;
      ctx.setLineDash([3, 3]);
      ctx.globalAlpha = 0.7;
      ctx.strokeRect(
        fx1 * scaleX,
        fy1 * scaleY,
        (fx2 - fx1) * scaleX,
        (fy2 - fy1) * scaleY
      );
      ctx.globalAlpha = 1.0;
    }

    // Status label
    const labelWidth = 180;
    const labelHeight = 30;
    ctx.setLineDash([]);
    ctx.fillStyle =
      mainBoxColor === "#10B981"
        ? "rgba(16, 185, 129, 0.9)"
        : mainBoxColor === "#F59E0B"
        ? "rgba(245, 158, 11, 0.9)"
        : "rgba(239, 68, 68, 0.9)";
    ctx.fillRect(10, 10, labelWidth, labelHeight);
    ctx.fillStyle = "white";
    ctx.font = "bold 12px Arial";
    ctx.fillText(boxLabel, 20, 28);
  }, []);

  // ─── Process one frame ────────────────────────────────────────────────────
  const processContinuousFrames = useCallback(async () => {
    if (!videoRef.current || !proctoringReady) return;

    const video = videoRef.current;
    if (!video.videoWidth || video.paused || video.ended) return;

    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = video.videoWidth;
    tempCanvas.height = video.videoHeight;
    const ctx = tempCanvas.getContext("2d");
    ctx.drawImage(video, 0, 0);
    const frameDataURL = tempCanvas.toDataURL("image/jpeg", 0.6);

    try {
      const response = await fetch(`${PROCTORING_BACKEND}/process-frame`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ frame: frameDataURL }),
      });

      if (!response.ok) return;

      const data = await response.json();

      // Draw bounding boxes
      if (canvasRef.current) {
        drawLiveBoundingBoxes(canvasRef.current, video, data);
      }

      // Violation alerts with cooldown
      const now = Date.now();
      if (now - lastWarningTimeRef.current < WARNING_COOLDOWN) return;

      const violationMap = {
        no_face: {
          type: "no_face",
          msg: "⚠️ No face detected - Please position yourself in the frame",
        },
        face_moved: {
          type: "face_moved",
          msg: "⚠️ Face moved - Please stay within the green box",
        },
        eyes_closed: {
          type: "eyes_closed",
          msg: "⚠️ Eyes closed - Keep your eyes open",
        },
        looking_away: {
          type: "looking_away",
          msg: "⚠️ Looking away - Focus on the screen",
        },
        unauthorized_object: {
          type: "unauthorized_object",
          msg: "🚨 Unauthorized object detected - Remove it immediately",
        },
      };

      const violation = violationMap[data.status];
      if (violation) {
        setViolationType(violation.type);
        setViolationMessage(violation.msg);
        setShowViolationAlert(true);
        lastWarningTimeRef.current = now;
        setTimeout(() => setShowViolationAlert(false), 5000);
      } else if (data.warnings?.length > 0) {
        setViolationType("warning");
        setViolationMessage(`⚠️ ${data.warnings[0]}`);
        setShowViolationAlert(true);
        lastWarningTimeRef.current = now;
        setTimeout(() => setShowViolationAlert(false), 5000);
      }
    } catch (error) {
      if (error.name !== "AbortError") {
        console.error("Frame processing error:", error);
      }
    }
  }, [PROCTORING_BACKEND, proctoringReady, drawLiveBoundingBoxes]);

  // ─── Start proctoring ─────────────────────────────────────────────────────
  const initializeProctoring = useCallback(async () => {
    if (!proctoringEnabled) return;

    try {
      console.log("🎥 Initializing proctoring...");

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 } },
        audio: true,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current
            .play()
            .catch((err) => console.error("Video play error:", err));
        };
      }

      setIsProctoringActive(true);
      console.log("✅ Camera stream initialized");

      // Start backend if needed
      if (!proctoringStarted) {
        try {
          const startResp = await fetch(
            `${PROCTORING_BACKEND}/start-proctoring`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
            }
          );
          if (startResp.ok) console.log("✅ Proctoring backend started");
        } catch (err) {
          console.warn("⚠️ Proctoring backend not available:", err);
        }
      }

      // Give video a moment to stabilise then begin frame loop
      setTimeout(() => {
        setProctoringReady(true);
        intervalRef.current = setInterval(processContinuousFrames, 2000);
        console.log("✅ Continuous proctoring started");
      }, 1000);
    } catch (error) {
      console.error("❌ Proctoring initialization error:", error);
      setIsProctoringActive(false);
    }
  }, [
    proctoringEnabled,
    proctoringStarted,
    PROCTORING_BACKEND,
    processContinuousFrames,
  ]);

  // ─── Lifecycle ────────────────────────────────────────────────────────────
  useEffect(() => {
    initializeProctoring();

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (streamRef.current)
        streamRef.current.getTracks().forEach((t) => t.stop());
    };
  }, [initializeProctoring]);

  return {
    videoRef,
    canvasRef,
    isProctoringActive,
    proctoringReady,
    showViolationAlert,
    violationMessage,
    violationType,
  };
}