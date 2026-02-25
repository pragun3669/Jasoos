import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from "react-router-dom";
import { AI_SERVICE_URL } from "../config";
import {
  Camera,
  Mic,
  Eye,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  Shield,
  Monitor,
  User,
  X,
  Clock,
  Clipboard,
  Video,
  TabletSmartphone,
  Maximize,
  ChevronRight,
  BookOpen,
  AlertCircle,
  Code2
} from 'lucide-react';

// ─── Exam Guidelines Modal ────────────────────────────────────────────────────
const GuidelinesModal = ({ onAccept }) => {
  const [accepted, setAccepted] = useState(false);
  const [scrolledToBottom, setScrolledToBottom] = useState(false);
  const scrollRef = useRef(null);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 32;
    if (atBottom) setScrolledToBottom(true);
  };

  const guidelines = [
    {
      icon: Clock,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10 border-blue-500/30',
      title: 'Time-Based Exam',
      points: [
        'The exam has a strict time limit — the timer starts immediately once you begin.',
        'Your answers are auto-submitted when time runs out.',
        'Keep an eye on the countdown displayed in the top bar at all times.',
      ],
    },
    {
      icon: Clipboard,
      color: 'text-yellow-400',
      bg: 'bg-yellow-500/10 border-yellow-500/30',
      title: 'Copy-Paste Policy',
      points: [
        'Copy-paste is allowed within the coding editor for code only.',
        'Any detected clipboard abuse outside coding sections will be flagged.',
      ],
    },
    {
      icon: Video,
      color: 'text-green-400',
      bg: 'bg-green-500/10 border-green-500/30',
      title: 'Video Proctoring',
      points: [
        'Your webcam will be active throughout the entire exam.',
        'Keep your face clearly visible and centred within the green zone at all times.',
        'Looking away, covering the camera, or having multiple faces detected will trigger a violation.',
        'Ensure good lighting — a dark or blurry feed will also be flagged.',
      ],
    },
    {
      icon: TabletSmartphone,
      color: 'text-orange-400',
      bg: 'bg-orange-500/10 border-orange-500/30',
      title: 'Tab Monitoring',
      points: [
        'Switching to any other browser tab or application is strictly prohibited.',
        'Every tab-switch is logged and reviewed by the examiner.',
        'Repeated violations may result in automatic exam termination.',
      ],
    },
    {
      icon: Maximize,
      color: 'text-red-400',
      bg: 'bg-red-500/10 border-red-500/30',
      title: 'Fullscreen Requirement',
      points: [
        'The exam must be taken in fullscreen mode at all times.',
        'Exiting fullscreen will immediately trigger an auto-submission of your paper.',
        'Do not press Escape, F11, or use any browser shortcut to exit fullscreen.',
      ],
    },
    {
      icon: Code2,
      color: 'text-purple-400',
      bg: 'bg-purple-500/10 border-purple-500/30',
      title: 'Question Navigation & Coding',
      points: [
        'You can navigate freely between questions using the question panel.',
        'For coding questions, always run your code and verify the output before switching questions.',
        'Unsaved or untested code may not be captured if you switch away abruptly.',
        'Submit your final answer for each question before moving to the next.',
      ],
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'radial-gradient(ellipse at center, rgba(15,23,42,0.98) 0%, rgba(2,6,23,0.99) 100%)' }}>

      {/* Decorative glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-indigo-600/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="relative w-full max-w-2xl flex flex-col"
        style={{ maxHeight: '92vh' }}>

        {/* Header */}
        <div className="flex-shrink-0 rounded-t-2xl px-8 pt-8 pb-6"
          style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #1e1b4b 100%)', borderBottom: '1px solid rgba(99,102,241,0.3)' }}>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-indigo-300" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">Exam Guidelines & Rules</h2>
              <p className="text-indigo-300 text-xs mt-0.5">Read carefully before proceeding</p>
            </div>
          </div>

          <div className="mt-4 flex items-start gap-2 bg-amber-500/10 border border-amber-500/30 rounded-lg px-4 py-3">
            <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-amber-200 text-xs leading-relaxed">
              By proceeding you agree to comply with all the rules below. Violations may result in score deduction or immediate exam termination.
            </p>
          </div>
        </div>

        {/* Scrollable guidelines body */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto px-8 py-6 space-y-4 custom-scrollbar"
          style={{ background: 'rgba(15,23,42,0.97)' }}>
          {guidelines.map(({ icon: Icon, color, bg, title, points }) => (
            <div key={title}
              className={`rounded-xl border p-5 ${bg}`}>
              <div className="flex items-center gap-3 mb-3">
                <Icon className={`w-5 h-5 ${color} flex-shrink-0`} />
                <h3 className="text-white font-semibold text-sm tracking-wide">{title}</h3>
              </div>
              <ul className="space-y-2">
                {points.map((p, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <ChevronRight className={`w-3.5 h-3.5 ${color} flex-shrink-0 mt-0.5`} />
                    <span className="text-gray-300 text-xs leading-relaxed">{p}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Scroll nudge */}
          {!scrolledToBottom && (
            <div className="text-center py-2">
              <p className="text-gray-500 text-xs animate-pulse">↓ Scroll down to read all guidelines</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 rounded-b-2xl px-8 py-6 border-t border-gray-800"
          style={{ background: 'rgba(15,23,42,0.99)' }}>
          <label className={`flex items-start gap-3 cursor-pointer group mb-5 ${!scrolledToBottom ? 'opacity-40 pointer-events-none' : ''}`}>
            <div
              onClick={() => scrolledToBottom && setAccepted(v => !v)}
              className={`w-5 h-5 rounded flex-shrink-0 mt-0.5 border-2 flex items-center justify-center transition-all
                ${accepted ? 'bg-indigo-500 border-indigo-500' : 'border-gray-500 group-hover:border-indigo-400'}`}>
              {accepted && <CheckCircle className="w-3 h-3 text-white" />}
            </div>
            <span className="text-gray-300 text-sm leading-relaxed">
              I have read and understood all the exam rules and guidelines. I agree to comply with them throughout the duration of the exam.
            </span>
          </label>

          {!scrolledToBottom && (
            <p className="text-gray-500 text-xs mb-3 text-center">Scroll to the bottom to enable the checkbox</p>
          )}

          <button
            onClick={onAccept}
            disabled={!accepted}
            className="w-full py-3.5 rounded-xl font-bold text-sm tracking-wide transition-all flex items-center justify-center gap-2
              disabled:opacity-30 disabled:cursor-not-allowed
              bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white
              hover:scale-[1.02] disabled:hover:scale-100 shadow-lg shadow-indigo-500/20">
            <Shield className="w-4 h-4" />
            I Agree — Proceed to Device Check
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Main DeviceCheck Component ───────────────────────────────────────────────
const DeviceCheck = ({ onProceed, onBack }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const { test, student, testLinkToken } = location.state || {};

  const [guidelinesAccepted, setGuidelinesAccepted] = useState(false);

  const [checks, setChecks] = useState({
    camera:         { status: 'pending', message: 'Checking camera access...' },
    microphone:     { status: 'pending', message: 'Checking microphone access...' },
    faceProctoring: { status: 'pending', message: 'Click to capture face reference...' },
    tabSwitching:   { status: 'pending', message: 'Tab switching detection will be monitored during exam' },
  });

  const [currentStep, setCurrentStep] = useState(0);
  const [allChecksComplete, setAllChecksComplete] = useState(false);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [showFaceModal, setShowFaceModal] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const [capturing, setCapturing] = useState(false);
  const [captureStatus, setCaptureStatus] = useState('');
  const [faceReferenceData, setFaceReferenceData] = useState(null);
  const [boundingBoxData, setBoundingBoxData] = useState(null);

  const videoRef              = useRef(null);
  const faceModalVideoRef     = useRef(null);
  const streamRef             = useRef(null);
  const faceStreamRef         = useRef(null);
  const audioContextRef       = useRef(null);
  const countdownIntervalRef  = useRef(null);
  const boundingBoxCanvasRef  = useRef(null);
  const boundingBoxIntervalRef = useRef(null);

  const steps = [
    { key: 'camera',         title: 'Camera',       icon: Camera  },
    { key: 'microphone',     title: 'Microphone',   icon: Mic     },
    { key: 'faceProctoring', title: 'Face Ref.',    icon: User    },
    { key: 'tabSwitching',   title: 'Tab Monitor',  icon: Eye     },
  ];

  const PROCTORING_BACKEND = `${AI_SERVICE_URL}/proctoring`;

  const updateCheck = useCallback((key, status, message) => {
    setChecks(prev => ({ ...prev, [key]: { status, message } }));
  }, []);

  // ─── Bounding box drawing ─────────────────────────────────────────────────
  const drawBoundingBoxes = useCallback((canvas, video, referenceBox) => {
    if (!canvas || !video || !referenceBox) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width  = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const [x1, y1, x2, y2] = referenceBox;
    const width   = x2 - x1;
    const height  = y2 - y1;
    const centerX = x1 + width  / 2;
    const centerY = y1 + height / 2;

    ctx.strokeStyle = '#10B981';
    ctx.lineWidth   = 3;
    ctx.setLineDash([]);
    ctx.strokeRect(x1, y1, width, height);

    const cl = 30;
    ctx.lineWidth = 4;
    [[x1, y1, cl, cl], [x2, y1, -cl, cl], [x1, y2, cl, -cl], [x2, y2, -cl, -cl]].forEach(([ox, oy, dx, dy]) => {
      ctx.beginPath(); ctx.moveTo(ox + dx, oy); ctx.lineTo(ox, oy); ctx.lineTo(ox, oy + dy); ctx.stroke();
    });

    const wp = 50;
    ctx.strokeStyle = '#F59E0B'; ctx.lineWidth = 2; ctx.setLineDash([10, 5]);
    ctx.strokeRect(x1 - wp, y1 - wp, width + wp * 2, height + wp * 2);

    const dp = 100;
    ctx.strokeStyle = '#EF4444'; ctx.lineWidth = 2; ctx.setLineDash([5, 5]);
    ctx.strokeRect(x1 - dp, y1 - dp, width + dp * 2, height + dp * 2);

    ctx.strokeStyle = '#10B981'; ctx.lineWidth = 2; ctx.setLineDash([]);
    const cs = 20;
    ctx.beginPath(); ctx.moveTo(centerX - cs, centerY); ctx.lineTo(centerX + cs, centerY); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(centerX, centerY - cs); ctx.lineTo(centerX, centerY + cs); ctx.stroke();
    ctx.fillStyle = '#10B981';
    ctx.beginPath(); ctx.arc(centerX, centerY, 3, 0, 2 * Math.PI); ctx.fill();
  }, []);

  const updateBoundingBoxOverlay = useCallback(() => {
    if (boundingBoxData && boundingBoxCanvasRef.current && faceModalVideoRef.current) {
      drawBoundingBoxes(boundingBoxCanvasRef.current, faceModalVideoRef.current, boundingBoxData);
    }
  }, [boundingBoxData, drawBoundingBoxes]);

  useEffect(() => {
    if (showFaceModal && boundingBoxData) {
      const video = faceModalVideoRef.current;
      if (video) video.addEventListener('loadedmetadata', updateBoundingBoxOverlay);
      boundingBoxIntervalRef.current = setInterval(updateBoundingBoxOverlay, 100);
      return () => {
        if (boundingBoxIntervalRef.current) clearInterval(boundingBoxIntervalRef.current);
        if (video) video.removeEventListener('loadedmetadata', updateBoundingBoxOverlay);
      };
    }
  }, [showFaceModal, boundingBoxData, updateBoundingBoxOverlay]);

  // ─── Device checks ────────────────────────────────────────────────────────
  const checkCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      updateCheck('camera', 'success', 'Camera is working properly');
      setCurrentStep(1);
    } catch (error) {
      updateCheck('camera', 'error',
        error.name === 'NotAllowedError' ? 'Camera permission denied. Please allow camera access and refresh.' :
        error.name === 'NotFoundError'   ? 'No camera found. Please connect a camera and try again.' :
        'Camera access denied or not available');
    }
  }, [updateCheck]);

  const checkMicrophone = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      audioContextRef.current = audioContext;
      audioContext.createMediaStreamSource(stream).connect(audioContext.createAnalyser());
      stream.getTracks().forEach(t => t.stop());
      updateCheck('microphone', 'success', 'Microphone is working properly');
      setCurrentStep(2);
    } catch (error) {
      updateCheck('microphone', 'error',
        error.name === 'NotAllowedError' ? 'Microphone permission denied. Please allow microphone access and refresh.' :
        error.name === 'NotFoundError'   ? 'No microphone found. Please connect a microphone and try again.' :
        'Microphone access denied or not available');
    }
  }, [updateCheck]);

  const setupTabSwitchingDetection = useCallback(() => {
    const handle = () => {
      if (document.hidden) {
        setTabSwitchCount(prev => {
          const n = prev + 1;
          updateCheck('tabSwitching', 'warning', `Tab switch detected! Count: ${n}. This will be monitored during the exam.`);
          return n;
        });
      }
    };
    document.addEventListener('visibilitychange', handle);
    updateCheck('tabSwitching', 'success', 'Tab switching detection is active');
    return () => document.removeEventListener('visibilitychange', handle);
  }, [updateCheck]);

  useEffect(() => {
    if (!guidelinesAccepted) return;

    if (!test || !student) {
      alert('Test or student information is missing. Please start over.');
      navigate('/');
      return;
    }

    setTimeout(() => checkCamera(),                500);
    setTimeout(() => checkMicrophone(),           1000);
    setTimeout(() => setupTabSwitchingDetection(), 1500);

    return () => {
      streamRef.current?.getTracks().forEach(t => t.stop());
      faceStreamRef.current?.getTracks().forEach(t => t.stop());
      audioContextRef.current?.close();
      if (countdownIntervalRef.current)  clearInterval(countdownIntervalRef.current);
      if (boundingBoxIntervalRef.current) clearInterval(boundingBoxIntervalRef.current);
    };
  }, [guidelinesAccepted, test, student, navigate, checkCamera, checkMicrophone, setupTabSwitchingDetection]);

  useEffect(() => {
    setAllChecksComplete(Object.values(checks).every(c => c.status === 'success' || c.status === 'warning'));
  }, [checks]);

  // ─── Face capture ─────────────────────────────────────────────────────────
  const openFaceCaptureModal = async () => {
    setShowFaceModal(true);
    setCaptureStatus('idle');
    setBoundingBoxData(null);
    updateCheck('faceProctoring', 'pending', 'Opening camera for face reference...');
    try {
      await new Promise(r => setTimeout(r, 200));
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: { ideal: 1280 }, height: { ideal: 720 } } });
      faceStreamRef.current = stream;
      if (faceModalVideoRef.current) {
        faceModalVideoRef.current.srcObject = stream;
        await new Promise(resolve => {
          faceModalVideoRef.current.onloadedmetadata = () => {
            faceModalVideoRef.current.play();
            const { videoWidth: vw, videoHeight: vh } = faceModalVideoRef.current;
            const bw = vw * 0.4, bh = vh * 0.5;
            const x1 = (vw - bw) / 2, y1 = (vh - bh) / 2;
            setBoundingBoxData([x1, y1, x1 + bw, y1 + bh]);
            resolve();
          };
          setTimeout(resolve, 2000);
        });
      }
      updateCheck('faceProctoring', 'pending', 'Position your face in the centre and click Capture');
    } catch (error) {
      updateCheck('faceProctoring', 'error', `Failed to start: ${error.message}`);
      closeFaceCaptureModal();
    }
  };

  const closeFaceCaptureModal = () => {
    if (countdownIntervalRef.current)   { clearInterval(countdownIntervalRef.current);   countdownIntervalRef.current  = null; }
    if (boundingBoxIntervalRef.current) { clearInterval(boundingBoxIntervalRef.current); boundingBoxIntervalRef.current = null; }
    faceStreamRef.current?.getTracks().forEach(t => t.stop());
    faceStreamRef.current = null;
    setShowFaceModal(false); setCountdown(null); setCapturing(false); setCaptureStatus(''); setBoundingBoxData(null);
  };

  const startCapture = () => {
    setCapturing(true); setCaptureStatus('capturing'); setCountdown(3);
    countdownIntervalRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownIntervalRef.current);
          countdownIntervalRef.current = null;
          setTimeout(() => captureFaceReference(), 200);
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const captureFaceReference = async () => {
    try {
      const video = faceModalVideoRef.current;
      if (!video?.videoWidth) throw new Error('Video not ready');
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth; canvas.height = video.videoHeight;
      canvas.getContext('2d').drawImage(video, 0, 0);
      updateCheck('faceProctoring', 'pending', 'Processing face reference...');
      const res = await fetch(`${PROCTORING_BACKEND}/reference-frame`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ frame: canvas.toDataURL('image/jpeg', 0.8) }),
      });
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error || `HTTP ${res.status}`); }
      const refData = await res.json();
      setFaceReferenceData({ face_center: refData.face_center, face_bbox: refData.face_bbox, timestamp: new Date().toISOString(), reference_set: true });
      setCaptureStatus('success');
      updateCheck('faceProctoring', 'success', 'Face reference captured successfully!');
      setCurrentStep(3);
      setTimeout(closeFaceCaptureModal, 2500);
    } catch (error) {
      setCaptureStatus('error');
      updateCheck('faceProctoring', 'error', `Failed: ${error.message}`);
      setCapturing(false);
    }
  };

  const retryCheck = async (type) => {
    updateCheck(type, 'pending', 'Retrying...');
    if (type === 'camera')         await checkCamera();
    else if (type === 'microphone') await checkMicrophone();
    else if (type === 'faceProctoring') await openFaceCaptureModal();
  };

  const handleStartExam = () => {
    if (!test || !student) { alert('Missing information. Redirecting.'); navigate('/'); return; }
    if (!testLinkToken) { alert('Test access token is missing. Please restart from the link.'); navigate('/'); return; }
    navigate('/studenttesteditor', {
      state: {
        student, test, testLinkToken, deviceCheckResults: checks,
        tabSwitchCount: tabSwitchCount || 0, copyPasteAttempts: 0,
        proctoringEnabled: true, proctoringBackend: PROCTORING_BACKEND,
        faceReferenceData, proctoringStarted: true,
      },
    });
    onProceed?.();
  };

  const getStatusIcon = (status) => {
    if (status === 'success') return <CheckCircle className="w-6 h-6 text-green-500" />;
    if (status === 'error')   return <XCircle     className="w-6 h-6 text-red-500"   />;
    if (status === 'warning') return <AlertTriangle className="w-6 h-6 text-yellow-500" />;
    return <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />;
  };

  // ─── Show guidelines modal first ─────────────────────────────────────────
  if (!guidelinesAccepted) {
    return <GuidelinesModal onAccept={() => setGuidelinesAccepted(true)} />;
  }

  // ─── Main UI ──────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">

      {/* Face Capture Modal */}
      {showFaceModal && (
        <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 max-w-3xl w-full relative border border-gray-700 shadow-2xl">
            <button onClick={closeFaceCaptureModal} disabled={capturing && countdown !== null}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-200 disabled:opacity-50 transition-colors z-10">
              <X className="w-6 h-6" />
            </button>
            <h2 className="text-3xl font-bold text-center mb-6 bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              📸 Face Reference Capture
            </h2>
            <div className="relative mb-6 bg-black rounded-xl overflow-hidden shadow-2xl">
              <video ref={faceModalVideoRef} autoPlay playsInline muted className="w-full h-96 object-cover" />
              <canvas ref={boundingBoxCanvasRef} className="absolute inset-0 w-full h-full pointer-events-none" style={{ mixBlendMode: 'normal' }} />
              {countdown !== null && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/70">
                  <div className="text-white text-9xl font-bold animate-pulse drop-shadow-2xl">{countdown}</div>
                </div>
              )}
              {captureStatus === 'success' && (
                <div className="absolute inset-0 flex items-center justify-center bg-green-500/90">
                  <div className="text-white text-center">
                    <CheckCircle className="w-24 h-24 mx-auto mb-4 animate-bounce" />
                    <p className="text-3xl font-bold">Success!</p>
                    <p className="text-lg mt-2">Face Captured</p>
                  </div>
                </div>
              )}
              {!countdown && captureStatus === 'idle' && (
                <div className="absolute top-6 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-6 py-3 rounded-full text-sm font-semibold shadow-lg animate-pulse">
                  👤 Align your face within the green box
                </div>
              )}
              <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-black/80 text-white px-4 py-2 rounded-lg text-xs">
                <div className="flex items-center space-x-4">
                  <span className="flex items-center"><div className="w-3 h-3 bg-green-500 rounded mr-2" />Ideal Zone</span>
                  <span className="flex items-center"><div className="w-3 h-3 bg-yellow-500 rounded mr-2" />Warning Zone</span>
                  <span className="flex items-center"><div className="w-3 h-3 bg-red-500 rounded mr-2" />Violation Zone</span>
                </div>
              </div>
            </div>
            <div className="text-center space-y-4">
              <p className="text-gray-300 font-medium">{checks.faceProctoring.message}</p>
              {captureStatus === 'idle' && !capturing && (
                <button onClick={startCapture}
                  className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-bold px-12 py-4 rounded-xl transition-all hover:scale-105 text-lg shadow-xl">
                  📸 Capture Reference
                </button>
              )}
              {captureStatus === 'error' && !capturing && (
                <button onClick={startCapture}
                  className="bg-red-500 hover:bg-red-600 text-white font-bold px-10 py-4 rounded-xl transition-all hover:scale-105 flex items-center mx-auto shadow-xl">
                  <RefreshCw className="w-5 h-5 mr-2" /> Try Again
                </button>
              )}
              {capturing && countdown !== null && (
                <div className="text-indigo-400 font-semibold text-lg">Get ready...</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-gray-800/80 backdrop-blur-md border-b border-gray-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center">
          <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
            Device Compatibility Check
          </h1>
          <p className="text-sm text-gray-400">Ensuring your system is ready for the proctored exam</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-8">
          <div className="bg-gradient-to-br from-green-400 to-blue-500 p-4 rounded-xl w-fit mx-auto mb-6">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">System Readiness Check</h2>
          <p className="text-lg text-gray-300">Complete all checks to ensure your device is ready</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-10">
          <div className="flex items-center justify-center space-x-2 overflow-x-auto pb-4">
            {steps.map((step, index) => {
              const IconComponent = step.icon;
              const isComplete = checks[step.key].status === 'success' || checks[step.key].status === 'warning';
              const isActive   = index <= currentStep;
              return (
                <div key={step.key} className="flex items-center flex-shrink-0">
                  <div className="flex flex-col items-center">
                    <div className={`flex items-center justify-center w-14 h-14 rounded-full border-2 transition-all ${
                      isComplete ? 'bg-green-500 border-green-500 text-white shadow-lg' :
                      isActive   ? 'bg-blue-500 border-blue-500 text-white shadow-md' :
                                   'bg-gray-700 border-gray-600 text-gray-400'}`}>
                      {isComplete ? <CheckCircle className="w-7 h-7" /> : <IconComponent className="w-7 h-7" />}
                    </div>
                    <span className="text-xs mt-2 font-medium text-gray-300">{step.title}</span>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-12 h-1 mx-2 rounded transition-all ${isComplete ? 'bg-green-500' : 'bg-gray-700'}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Check Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">

          {/* Camera */}
          <div className={`rounded-xl border-2 p-6 bg-gray-800 shadow-md transition-all ${
            checks.camera.status === 'success' ? 'border-green-500' :
            checks.camera.status === 'error'   ? 'border-red-500'   :
            checks.camera.status === 'warning' ? 'border-yellow-500' : 'border-gray-600'}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center"><Camera className="w-8 h-8 text-blue-400 mr-3" /><h3 className="text-lg font-semibold text-white">Camera</h3></div>
              {getStatusIcon(checks.camera.status)}
            </div>
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-32 bg-gray-900 rounded-lg object-cover mb-4" />
            <p className="text-sm text-gray-300 mb-3">{checks.camera.message}</p>
            {checks.camera.status === 'error' && (
              <button onClick={() => retryCheck('camera')} className="flex items-center px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm">
                <RefreshCw className="w-4 h-4 mr-2" />Retry
              </button>
            )}
          </div>

          {/* Microphone */}
          <div className={`rounded-xl border-2 p-6 bg-gray-800 shadow-md transition-all ${
            checks.microphone.status === 'success' ? 'border-green-500' :
            checks.microphone.status === 'error'   ? 'border-red-500'   :
            checks.microphone.status === 'warning' ? 'border-yellow-500' : 'border-gray-600'}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center"><Mic className="w-8 h-8 text-green-400 mr-3" /><h3 className="text-lg font-semibold text-white">Microphone</h3></div>
              {getStatusIcon(checks.microphone.status)}
            </div>
            <div className="mb-4 h-32 bg-gray-900 rounded-lg flex items-center justify-center">
              <Mic className="w-12 h-12 text-gray-600" />
            </div>
            <p className="text-sm text-gray-300 mb-3">{checks.microphone.message}</p>
            {checks.microphone.status === 'error' && (
              <button onClick={() => retryCheck('microphone')} className="flex items-center px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm">
                <RefreshCw className="w-4 h-4 mr-2" />Retry
              </button>
            )}
          </div>

          {/* Face Proctoring */}
          <div className={`rounded-xl border-2 p-6 bg-gray-800 shadow-md transition-all ${
            checks.faceProctoring.status === 'success' ? 'border-green-500' :
            checks.faceProctoring.status === 'error'   ? 'border-red-500'   :
            checks.faceProctoring.status === 'warning' ? 'border-yellow-500' : 'border-gray-600'}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center"><User className="w-8 h-8 text-indigo-400 mr-3" /><h3 className="text-lg font-semibold text-white">Face Proctoring</h3></div>
              {getStatusIcon(checks.faceProctoring.status)}
            </div>
            <div className="mb-4 h-32 bg-gradient-to-br from-indigo-900 to-purple-900 rounded-lg flex items-center justify-center">
              {checks.faceProctoring.status === 'success' ? (
                <div className="text-center">
                  <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-2" />
                  <p className="text-xs text-gray-300 font-medium">Reference Set ✓</p>
                </div>
              ) : (
                <button onClick={openFaceCaptureModal} disabled={checks.camera.status !== 'success'}
                  className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 disabled:from-gray-600 disabled:to-gray-700 text-white px-6 py-3 rounded-lg transition-all hover:scale-105 disabled:hover:scale-100 font-semibold text-sm">
                  Open Capture
                </button>
              )}
            </div>
            <p className="text-sm text-gray-300 mb-3">{checks.faceProctoring.message}</p>
            {checks.faceProctoring.status === 'error' && (
              <button onClick={() => retryCheck('faceProctoring')} className="flex items-center px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-sm">
                <RefreshCw className="w-4 h-4 mr-2" />Retry
              </button>
            )}
          </div>

          {/* Tab Switching */}
          <div className={`rounded-xl border-2 p-6 bg-gray-800 shadow-md transition-all ${
            checks.tabSwitching.status === 'success' ? 'border-green-500' :
            checks.tabSwitching.status === 'error'   ? 'border-red-500'   :
            checks.tabSwitching.status === 'warning' ? 'border-yellow-500' : 'border-gray-600'}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center"><Monitor className="w-8 h-8 text-orange-400 mr-3" /><h3 className="text-lg font-semibold text-white">Tab Monitoring</h3></div>
              {getStatusIcon(checks.tabSwitching.status)}
            </div>
            <div className="mb-4 h-32 bg-gray-900 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <Eye className="w-12 h-12 text-gray-600 mx-auto mb-2" />
                <p className="text-sm text-gray-400">Monitoring Active</p>
                {tabSwitchCount > 0 && <p className="text-xs text-orange-400 mt-1">Switches detected: {tabSwitchCount}</p>}
              </div>
            </div>
            <p className="text-sm text-gray-300 mb-3">{checks.tabSwitching.message}</p>
            <div className="bg-orange-900/30 border border-orange-600 rounded-lg p-3">
              <p className="text-xs text-orange-300">Try switching to another tab to test the detection system</p>
            </div>
          </div>
        </div>

        {/* Start Exam Footer */}
        <div className="bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">
                System Check {allChecksComplete ? 'Complete' : 'In Progress'}
              </h3>
              <p className="text-gray-300">
                {allChecksComplete
                  ? 'Your device is ready for the proctored exam'
                  : 'Please complete all system checks to proceed'}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              {onBack && (
                <button onClick={onBack} className="px-6 py-3 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors">
                  Go Back
                </button>
              )}
              <button onClick={handleStartExam} disabled={!allChecksComplete}
                className="bg-gradient-to-r from-green-400 to-blue-500 hover:from-green-500 hover:to-blue-600 text-white font-semibold px-8 py-3 rounded-lg transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center">
                {allChecksComplete ? (
                  <>Start Exam<ArrowRight className="w-5 h-5 ml-2" /></>
                ) : (
                  <><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />Checking...</>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeviceCheck;