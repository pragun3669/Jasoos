import { useEffect, useRef, useState, useCallback } from "react";
import { FaceMesh } from "@mediapipe/face_mesh";
import { Camera } from "@mediapipe/camera_utils";
import { AI_SERVICE_URL } from "../../../config";

const WARNING_COOLDOWN = 15000;
const SEND_INTERVAL = 3000;

const LEFT_EYE  = [33, 160, 158, 133, 153, 144];
const RIGHT_EYE = [362, 385, 387, 263, 373, 380];

// Safe-zone bounds as fractions of video dimensions (centred)
const SAFE_ZONE = { x: 0.2, y: 0.15, w: 0.6, h: 0.7 };

// ─── Pure utility functions (module-scope = stable references, no dep warnings) ──
const distance = (a, b) =>
  Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);

const calculateEAR = (landmarks, indices) => {
  const p  = indices.map((i) => landmarks[i]);
  const v1 = distance(p[1], p[5]);
  const v2 = distance(p[2], p[4]);
  const h  = distance(p[0], p[3]);
  return (v1 + v2) / (2.0 * h);
};

const getHeadPose = (landmarks) => {
  const nose     = landmarks[1];
  const leftEye  = landmarks[33];
  const rightEye = landmarks[263];
  const chin     = landmarks[152];

  const eyeWidth    = distance(leftEye, rightEye);
  const noseToLeft  = distance(nose, leftEye);
  const noseToRight = distance(nose, rightEye);
  const yaw =
    ((Math.atan2(noseToRight - noseToLeft, eyeWidth) * 180) / Math.PI) * 0.5;

  const eyeCenter = {
    x: (leftEye.x + rightEye.x) / 2,
    y: (leftEye.y + rightEye.y) / 2,
  };
  const faceHeight = distance(chin, eyeCenter);
  const noseToEye  = distance(nose, eyeCenter);
  const pitch =
    (((Math.atan2(noseToEye, faceHeight) * 180) / Math.PI) - 90) * 0.3;

  return { yaw, pitch };
};

const calculateGazeDeviation = (landmarks) => {
  const eyeCenter = {
    x: (landmarks[33].x + landmarks[133].x) / 2,
    y: (landmarks[33].y + landmarks[133].y) / 2,
  };
  const irisCenter = {
    x:
      (landmarks[468].x + landmarks[469].x + landmarks[470].x +
        landmarks[471].x + landmarks[472].x) / 5,
    y:
      (landmarks[468].y + landmarks[469].y + landmarks[470].y +
        landmarks[471].y + landmarks[472].y) / 5,
  };
  return distance(eyeCenter, irisCenter);
};

export default function useProctoring({
  proctoringEnabled,
  proctoringBackend,
  proctoringStarted,
}) {
  const videoRef           = useRef(null);
  const canvasRef          = useRef(null);   // overlay canvas
  const streamRef          = useRef(null);
  const cameraRef          = useRef(null);
  const sendIntervalRef    = useRef(null);
  const lastWarningTimeRef = useRef(0);
  const referenceRef       = useRef(null);
  const lastLandmarksRef   = useRef(null);   // shared with RAF draw loop
  const animFrameRef       = useRef(null);

  const [isProctoringActive, setIsProctoringActive] = useState(false);
  const [showViolationAlert, setShowViolationAlert]  = useState(false);
  const [violationMessage,   setViolationMessage]    = useState("");
  const [violationType,      setViolationType]       = useState("");

  const PROCTORING_BACKEND = proctoringBackend || `${AI_SERVICE_URL}/proctoring`;

  const triggerViolationAlert = useCallback((type, msg) => {
    const now = Date.now();
    if (now - lastWarningTimeRef.current < WARNING_COOLDOWN) return;
    lastWarningTimeRef.current = now;
    setViolationType(type);
    setViolationMessage(msg);
    setShowViolationAlert(true);
    setTimeout(() => setShowViolationAlert(false), 5000);
  }, []);

  // ─── Canvas overlay drawing (RAF) ─────────────────────────────────────────
  const drawOverlay = useCallback(() => {
    const canvas = canvasRef.current;
    const video  = videoRef.current;
    if (!canvas || !video) return;

    const vw = video.videoWidth  || video.clientWidth  || 640;
    const vh = video.videoHeight || video.clientHeight || 480;
    if (!vw || !vh) return; 
    if (canvas.width !== vw || canvas.height !== vh) {
      canvas.width  = vw;
      canvas.height = vh;
    }

    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, vw, vh);

    const landmarks = lastLandmarksRef.current;

    // ── 1. Green positioning / safe zone ─────────────────────────────────
    const sz = {
      x: SAFE_ZONE.x * vw,
      y: SAFE_ZONE.y * vh,
      w: SAFE_ZONE.w * vw,
      h: SAFE_ZONE.h * vh,
    };

    // Dim outside the safe zone
    ctx.fillStyle = "rgba(0,0,0,0.28)";
    ctx.fillRect(0, 0, vw, sz.y);
    ctx.fillRect(0, sz.y, sz.x, sz.h);
    ctx.fillRect(sz.x + sz.w, sz.y, vw - (sz.x + sz.w), sz.h);
    ctx.fillRect(0, sz.y + sz.h, vw, vh - (sz.y + sz.h));

    // Pick zone colour based on face position
    let zoneColor = "#EF4444"; // red — no face
    if (landmarks) {
      const nose   = landmarks[1];
      const inZone =
        nose.x > SAFE_ZONE.x &&
        nose.x < SAFE_ZONE.x + SAFE_ZONE.w &&
        nose.y > SAFE_ZONE.y &&
        nose.y < SAFE_ZONE.y + SAFE_ZONE.h;
      zoneColor = inZone ? "#10B981" : "#F59E0B"; // green : amber
    }

    // Zone border
    ctx.strokeStyle = zoneColor;
    ctx.lineWidth   = 2.5;
    ctx.setLineDash([]);
    ctx.strokeRect(sz.x, sz.y, sz.w, sz.h);

    // Corner brackets
    const cl = 22;
    ctx.lineWidth = 3.5;
    [
      [sz.x,        sz.y,        cl,  cl ],
      [sz.x + sz.w, sz.y,       -cl,  cl ],
      [sz.x,        sz.y + sz.h, cl, -cl ],
      [sz.x + sz.w, sz.y + sz.h,-cl, -cl ],
    ].forEach(([ox, oy, dx, dy]) => {
      ctx.beginPath();
      ctx.moveTo(ox + dx, oy);
      ctx.lineTo(ox,      oy);
      ctx.lineTo(ox,      oy + dy);
      ctx.stroke();
    });

    // Zone status label
    const label   =
      !landmarks  ? "✗  NO FACE"
      : zoneColor === "#10B981" ? "✓  GOOD POSITION"
      : "⚠  ADJUST POSITION";
    const lw = ctx.measureText(label).width + 24;
    const lh = 26;
    ctx.fillStyle =
      zoneColor === "#10B981" ? "rgba(16,185,129,0.88)"
      : zoneColor === "#F59E0B" ? "rgba(245,158,11,0.88)"
      : "rgba(239,68,68,0.88)";
    ctx.fillRect(sz.x, sz.y - lh - 4, lw, lh);
    ctx.fillStyle = "#fff";
    ctx.font      = "bold 12px Arial";
    ctx.fillText(label, sz.x + 12, sz.y - 10);

    if (!landmarks) return;

    // ── 2. Face bounding box ──────────────────────────────────────────────
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    landmarks.forEach((lm) => {
      if (lm.x * vw < minX) minX = lm.x * vw;
      if (lm.y * vh < minY) minY = lm.y * vh;
      if (lm.x * vw > maxX) maxX = lm.x * vw;
      if (lm.y * vh > maxY) maxY = lm.y * vh;
    });

    const pad = 10;
    const fx  = minX - pad;
    const fy  = minY - pad;
    const fw  = (maxX - minX) + pad * 2;
    const fh  = (maxY - minY) + pad * 2;
    const fcx = fx + fw / 2;
    const fcy = fy + fh / 2;

    // Outer glow + solid box
    ctx.shadowColor = zoneColor;
    ctx.shadowBlur  = 10;
    ctx.strokeStyle = zoneColor;
    ctx.lineWidth   = 2;
    ctx.setLineDash([]);
    ctx.strokeRect(fx, fy, fw, fh);
    ctx.shadowBlur  = 0;

    // Inner dashed face box
    ctx.strokeStyle = zoneColor;
    ctx.lineWidth   = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.globalAlpha = 0.55;
    ctx.strokeRect(fx + 5, fy + 5, fw - 10, fh - 10);
    ctx.globalAlpha = 1;
    ctx.setLineDash([]);

    // Centre crosshair
    const cs = 12;
    ctx.strokeStyle = zoneColor;
    ctx.lineWidth   = 1.5;
    ctx.beginPath(); ctx.moveTo(fcx - cs, fcy); ctx.lineTo(fcx + cs, fcy); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(fcx, fcy - cs); ctx.lineTo(fcx, fcy + cs); ctx.stroke();
    ctx.fillStyle = zoneColor;
    ctx.beginPath(); ctx.arc(fcx, fcy, 3, 0, 2 * Math.PI); ctx.fill();

    // ── 3. Eye landmark dots ──────────────────────────────────────────────
    ctx.fillStyle = "rgba(99,220,255,0.85)";
    [...LEFT_EYE, ...RIGHT_EYE].forEach((i) => {
      ctx.beginPath();
      ctx.arc(landmarks[i].x * vw, landmarks[i].y * vh, 2, 0, 2 * Math.PI);
      ctx.fill();
    });

    // ── 4. Nose-tip dot ──────────────────────────────────────────────────
    const nose = landmarks[1];
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.beginPath();
    ctx.arc(nose.x * vw, nose.y * vh, 3, 0, 2 * Math.PI);
    ctx.fill();
  }, []);

  // RAF draw loop — decoupled from FaceMesh cadence for smooth rendering
  const startDrawLoop = useCallback(() => {
    const loop = () => {
      if (!canvasRef.current || !videoRef.current) return;
      drawOverlay();
      animFrameRef.current = requestAnimationFrame(loop);
    };
    animFrameRef.current = requestAnimationFrame(loop);
  }, [drawOverlay]);

  // ─── Initialize Proctoring ────────────────────────────────────────────────
  useEffect(() => {
    if (!proctoringEnabled) return;

    const initialize = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480 },
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

        startDrawLoop();

        const faceMesh = new FaceMesh({
          locateFile: (file) =>
            `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
        });

        faceMesh.setOptions({
          maxNumFaces: 1,
          refineLandmarks: true,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });

        faceMesh.onResults(async (results) => {
          const landmarks = results.multiFaceLandmarks?.[0] || null;
          lastLandmarksRef.current = landmarks; // RAF loop picks this up

          if (!landmarks) {
            triggerViolationAlert(
              "no_face",
              "⚠️ No face detected - Please position yourself properly"
            );
            window.currentProctoringData = { face_detected: false };
            return;
          }

          const ear =
            (calculateEAR(landmarks, LEFT_EYE) +
              calculateEAR(landmarks, RIGHT_EYE)) /
            2;

          const { yaw, pitch } = getHeadPose(landmarks);
          const gazeDeviation  = calculateGazeDeviation(landmarks);
          const faceCenter     = [landmarks[1].x * 640, landmarks[1].y * 480];

          // Capture reference on first detection
          if (!referenceRef.current) {
            referenceRef.current = {
              face_center: faceCenter,
              inter_eye_distance: distance(landmarks[33], landmarks[263]),
            };

            try {
              await fetch(`${PROCTORING_BACKEND}/reference-frame`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(referenceRef.current),
              });

              if (!proctoringStarted) {
                await fetch(`${PROCTORING_BACKEND}/start-proctoring`, {
                  method: "POST",
                });
              }
            } catch (err) {
              console.warn("Backend reference setup failed:", err);
            }
          }

          if (Math.abs(yaw) > 75)
            triggerViolationAlert(
              "looking_away",
              "⚠️ Do not turn your head sideways"
            );

          if (ear < 0.15)
            triggerViolationAlert("eyes_closed", "⚠️ Eyes closed detected");

          window.currentProctoringData = {
            face_detected: true,
            face_center: faceCenter,
            yaw,
            pitch,
            ear,
            gaze_deviation: gazeDeviation,
          };
        });

        const camera = new Camera(videoRef.current, {
          onFrame: async () => {
            await faceMesh.send({ image: videoRef.current });
          },
          width: 640,
          height: 480,
        });

        camera.start();
        cameraRef.current = camera;
        setIsProctoringActive(true);

        // Periodic lightweight data push to backend
        sendIntervalRef.current = setInterval(() => {
          if (!window.currentProctoringData) return;
          fetch(`${PROCTORING_BACKEND}/process-frame`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(window.currentProctoringData),
          }).catch(() => {});
        }, SEND_INTERVAL);
      } catch (err) {
        console.error("Proctoring initialization failed:", err);
      }
    };

    initialize();

    return () => {
      if (animFrameRef.current)    cancelAnimationFrame(animFrameRef.current);
      if (sendIntervalRef.current) clearInterval(sendIntervalRef.current);
      if (cameraRef.current)       cameraRef.current.stop();
      if (streamRef.current)
        streamRef.current.getTracks().forEach((t) => t.stop());
    };
  }, [proctoringEnabled, proctoringStarted, PROCTORING_BACKEND, triggerViolationAlert, startDrawLoop]);

  return {
    videoRef,
    canvasRef,     // ← mount this as an <canvas> absolutely over your <video>
    isProctoringActive,
    showViolationAlert,
    violationMessage,
    violationType,
  };
}