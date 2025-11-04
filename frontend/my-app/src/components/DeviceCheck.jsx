import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from "react-router-dom";
import { 
  Camera, 
  Mic, 
  Volume2, 
  Eye, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  Shield,
  Monitor,
  User,
  X
} from 'lucide-react';

const DeviceCheck = ({ onProceed, onBack }) => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const { test, student, testLinkToken } = location.state || {};
  
  const [checks, setChecks] = useState({
    camera: { status: 'pending', message: 'Checking camera access...' },
    microphone: { status: 'pending', message: 'Checking microphone access...' },
    speakers: { status: 'pending', message: 'Click to test speakers...' },
    faceProctoring: { status: 'pending', message: 'Click to capture face reference...' },
    tabSwitching: { status: 'pending', message: 'Tab switching detection will be monitored during exam' }
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
  
  const videoRef = useRef(null);
  const faceModalVideoRef = useRef(null);
  const streamRef = useRef(null);
  const faceStreamRef = useRef(null);
  const audioContextRef = useRef(null);
  const countdownIntervalRef = useRef(null);
  const boundingBoxCanvasRef = useRef(null);
  const boundingBoxIntervalRef = useRef(null);

  const steps = [
    { key: 'camera', title: 'Camera Test', icon: Camera },
    { key: 'microphone', title: 'Microphone Test', icon: Mic },
    { key: 'speakers', title: 'Speaker Test', icon: Volume2 },
    { key: 'faceProctoring', title: 'Face Reference', icon: User },
    { key: 'tabSwitching', title: 'Tab Monitoring', icon: Eye }
  ];

  const PROCTORING_BACKEND = "http://localhost:5001";

  const updateCheck = useCallback((key, status, message) => {
    setChecks(prev => ({
      ...prev,
      [key]: { status, message }
    }));
  }, []);

  const drawBoundingBoxes = useCallback((canvas, video, referenceBox) => {
    if (!canvas || !video || !referenceBox) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const [x1, y1, x2, y2] = referenceBox;
    const width = x2 - x1;
    const height = y2 - y1;
    const centerX = x1 + width / 2;
    const centerY = y1 + height / 2;
    
    // Draw ideal face box (green with rounded corners effect)
    ctx.strokeStyle = '#10B981';
    ctx.lineWidth = 3;
    ctx.setLineDash([]);
    ctx.strokeRect(x1, y1, width, height);
    
    // Draw corner brackets
    const cornerLength = 30;
    ctx.lineWidth = 4;
    
    // Top-left corner
    ctx.beginPath();
    ctx.moveTo(x1, y1 + cornerLength);
    ctx.lineTo(x1, y1);
    ctx.lineTo(x1 + cornerLength, y1);
    ctx.stroke();
    
    // Top-right corner
    ctx.beginPath();
    ctx.moveTo(x2 - cornerLength, y1);
    ctx.lineTo(x2, y1);
    ctx.lineTo(x2, y1 + cornerLength);
    ctx.stroke();
    
    // Bottom-left corner
    ctx.beginPath();
    ctx.moveTo(x1, y2 - cornerLength);
    ctx.lineTo(x1, y2);
    ctx.lineTo(x1 + cornerLength, y2);
    ctx.stroke();
    
    // Bottom-right corner
    ctx.beginPath();
    ctx.moveTo(x2 - cornerLength, y2);
    ctx.lineTo(x2, y2);
    ctx.lineTo(x2, y2 - cornerLength);
    ctx.stroke();
    
    // Warning zones (yellow) - slightly larger
    const warningPadding = 50;
    ctx.strokeStyle = '#F59E0B';
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 5]);
    ctx.strokeRect(
      x1 - warningPadding,
      y1 - warningPadding,
      width + warningPadding * 2,
      height + warningPadding * 2
    );
    
    // Danger zones (red) - even larger
    const dangerPadding = 100;
    ctx.strokeStyle = '#EF4444';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.strokeRect(
      x1 - dangerPadding,
      y1 - dangerPadding,
      width + dangerPadding * 2,
      height + dangerPadding * 2
    );
    
    // Center crosshair
    ctx.strokeStyle = '#10B981';
    ctx.lineWidth = 2;
    ctx.setLineDash([]);
    const crossSize = 20;
    
    ctx.beginPath();
    ctx.moveTo(centerX - crossSize, centerY);
    ctx.lineTo(centerX + crossSize, centerY);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(centerX, centerY - crossSize);
    ctx.lineTo(centerX, centerY + crossSize);
    ctx.stroke();
    
    ctx.fillStyle = '#10B981';
    ctx.beginPath();
    ctx.arc(centerX, centerY, 3, 0, 2 * Math.PI);
    ctx.fill();
  }, []);

  const updateBoundingBoxOverlay = useCallback(() => {
    const canvas = boundingBoxCanvasRef.current;
    const video = faceModalVideoRef.current;
    
    if (boundingBoxData && canvas && video) {
      drawBoundingBoxes(canvas, video, boundingBoxData);
    }
  }, [boundingBoxData, drawBoundingBoxes]);

  useEffect(() => {
    if (showFaceModal && boundingBoxData) {
      // Update canvas size when video metadata loads
      const video = faceModalVideoRef.current;
      if (video) {
        video.addEventListener('loadedmetadata', updateBoundingBoxOverlay);
      }
      
      // Continuous update for bounding boxes
      boundingBoxIntervalRef.current = setInterval(updateBoundingBoxOverlay, 100);
      
      return () => {
        if (boundingBoxIntervalRef.current) {
          clearInterval(boundingBoxIntervalRef.current);
        }
        if (video) {
          video.removeEventListener('loadedmetadata', updateBoundingBoxOverlay);
        }
      };
    }
  }, [showFaceModal, boundingBoxData, updateBoundingBoxOverlay]);

  const checkCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      
      updateCheck('camera', 'success', 'Camera is working properly');
      setCurrentStep(1);
    } catch (error) {
      let message = 'Camera access denied or not available';
      if (error.name === 'NotAllowedError') {
        message = 'Camera permission denied. Please allow camera access and refresh.';
      } else if (error.name === 'NotFoundError') {
        message = 'No camera found. Please connect a camera and try again.';
      }
      updateCheck('camera', 'error', message);
    }
  }, [updateCheck]);

  const checkMicrophone = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      audioContextRef.current = audioContext;
      
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      source.connect(analyser);
      
      stream.getTracks().forEach(track => track.stop());
      
      updateCheck('microphone', 'success', 'Microphone is working properly');
      setCurrentStep(2);
    } catch (error) {
      let message = 'Microphone access denied or not available';
      if (error.name === 'NotAllowedError') {
        message = 'Microphone permission denied. Please allow microphone access and refresh.';
      } else if (error.name === 'NotFoundError') {
        message = 'No microphone found. Please connect a microphone and try again.';
      }
      updateCheck('microphone', 'error', message);
    }
  }, [updateCheck]);

  const setupTabSwitchingDetection = useCallback(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setTabSwitchCount(prev => prev + 1);
        updateCheck('tabSwitching', 'warning', `Tab switching detected! Count: ${tabSwitchCount + 1}. This will be monitored during the exam.`);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    updateCheck('tabSwitching', 'success', 'Tab switching detection is active');
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [updateCheck, tabSwitchCount]);

  useEffect(() => {
    if (!test || !student) {
      console.error('Missing test or student data in DeviceCheck');
      alert('Test or student information is missing. Please start over.');
      navigate('/');
      return;
    }

    if (!testLinkToken) {
      console.warn('Warning: testLinkToken is missing. Submission may fail.');
    }

    setTimeout(() => checkCamera(), 500);
    setTimeout(() => checkMicrophone(), 1000);
    setTimeout(() => setupTabSwitchingDetection(), 1500);
    
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (faceStreamRef.current) {
        faceStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
      if (boundingBoxIntervalRef.current) {
        clearInterval(boundingBoxIntervalRef.current);
      }
    };
  }, [test, student, testLinkToken, navigate, checkCamera, checkMicrophone, setupTabSwitchingDetection]);

  useEffect(() => {
    const allComplete = Object.values(checks).every(check => 
      check.status === 'success' || check.status === 'warning'
    );
    setAllChecksComplete(allComplete);
  }, [checks]);

  const testSpeakers = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
  
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(440, ctx.currentTime);
      gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
  
      oscillator.start();
      oscillator.stop(ctx.currentTime + 1);
  
      updateCheck('speakers', 'success', 'Beep sound played successfully');
      setCurrentStep(3);
    } catch (error) {
      updateCheck('speakers', 'warning', 'Unable to generate beep. Check your speakers.');
    }
  };

  const openFaceCaptureModal = async () => {
    console.log('📸 Opening face capture modal...');
    setShowFaceModal(true);
    setCaptureStatus('idle');
    setBoundingBoxData(null);
    updateCheck('faceProctoring', 'pending', 'Opening camera for face reference...');
    
    try {
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 1280 }, 
          height: { ideal: 720 } 
        } 
      });
      faceStreamRef.current = stream;
      
      console.log('✅ Camera stream obtained');
      
      if (faceModalVideoRef.current) {
        faceModalVideoRef.current.srcObject = stream;
        
        await new Promise((resolve) => {
          faceModalVideoRef.current.onloadedmetadata = () => {
            console.log('✅ Video metadata loaded');
            faceModalVideoRef.current.play();
            
            // Calculate initial bounding box based on video dimensions
            const video = faceModalVideoRef.current;
            const videoWidth = video.videoWidth;
            const videoHeight = video.videoHeight;
            
            // Create a centered box that's roughly 40% of video dimensions
            const boxWidth = videoWidth * 0.4;
            const boxHeight = videoHeight * 0.5;
            const x1 = (videoWidth - boxWidth) / 2;
            const y1 = (videoHeight - boxHeight) / 2;
            const x2 = x1 + boxWidth;
            const y2 = y1 + boxHeight;
            
            setBoundingBoxData([x1, y1, x2, y2]);
            resolve();
          };
          setTimeout(resolve, 2000);
        });
      }
      
      updateCheck('faceProctoring', 'pending', 'Position your face in the center and click Capture');
      
    } catch (error) {
      console.error('❌ Error opening face capture:', error);
      updateCheck('faceProctoring', 'error', `Failed to start: ${error.message}`);
      closeFaceCaptureModal();
    }
  };

  const closeFaceCaptureModal = () => {
    console.log('🔒 Closing face modal...');
    
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    
    if (boundingBoxIntervalRef.current) {
      clearInterval(boundingBoxIntervalRef.current);
      boundingBoxIntervalRef.current = null;
    }
    
    if (faceStreamRef.current) {
      faceStreamRef.current.getTracks().forEach(track => track.stop());
      faceStreamRef.current = null;
    }
    
    setShowFaceModal(false);
    setCountdown(null);
    setCapturing(false);
    setCaptureStatus('');
    setBoundingBoxData(null);
  };
  
  const startCapture = () => {
    console.log('⏱️ Starting capture countdown...');
    setCapturing(true);
    setCaptureStatus('capturing');
    setCountdown(3);
    
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
    console.log('📸 Capturing face reference...');
    
    try {
      const video = faceModalVideoRef.current;
      
      if (!video || !video.videoWidth) {
        throw new Error('Video not ready');
      }
      
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0);
      
      const frameDataURL = canvas.toDataURL('image/jpeg', 0.8);
      console.log('📊 Frame captured, size:', frameDataURL.length);
      
      updateCheck('faceProctoring', 'pending', 'Processing face reference...');
      
      console.log('📤 Sending reference frame to backend...');
      const refResponse = await fetch(`${PROCTORING_BACKEND}/reference-frame`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ frame: frameDataURL })
      });
      
      if (!refResponse.ok) {
        const errorData = await refResponse.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${refResponse.status}`);
      }
      
      const refData = await refResponse.json();
      console.log('✅ Reference set successfully:', refData);
      
      // Store complete reference data including bounding box
      const refDataToStore = {
        face_center: refData.face_center,
        face_bbox: refData.face_bbox,
        timestamp: new Date().toISOString(),
        reference_set: true
      };
      
      setFaceReferenceData(refDataToStore);
      console.log('💾 Face reference data stored:', refDataToStore);
      
      setCaptureStatus('success');
      updateCheck('faceProctoring', 'success', 'Face reference captured successfully!');
      setCurrentStep(4);
      
      setTimeout(() => {
        closeFaceCaptureModal();
      }, 2500);
      
    } catch (error) {
      console.error('❌ Error capturing face reference:', error);
      setCaptureStatus('error');
      updateCheck('faceProctoring', 'error', `Failed: ${error.message}`);
      setCapturing(false);
    }
  };

  const retryCheck = async (checkType) => {
    updateCheck(checkType, 'pending', 'Retrying...');
    
    switch (checkType) {
      case 'camera':
        await checkCamera();
        break;
      case 'microphone':
        await checkMicrophone();
        break;
      case 'speakers':
        testSpeakers();
        break;
      case 'faceProctoring':
        await openFaceCaptureModal();
        break;
      default:
        break;
    }
  };

  const handleStartExam = () => {
    if (!test || !student) {
      console.error('Missing test or student data');
      alert('Test or student information is missing. Redirecting to home.');
      navigate('/');
      return;
    }
  
    if (!testLinkToken) {
      console.error('CRITICAL: testLinkToken is missing!');
      alert('Test access token is missing. Please restart the test from the link.');
      navigate('/');
      return;
    }
  
    console.log('🚀 Starting exam with face reference data:', faceReferenceData);
  
    navigate('/studenttesteditor', { 
      state: {
        student,
        test,
        testLinkToken,
        deviceCheckResults: checks,
        tabSwitchCount: tabSwitchCount || 0,
        copyPasteAttempts: 0,
        proctoringEnabled: true,
        proctoringBackend: PROCTORING_BACKEND,
        faceReferenceData: faceReferenceData,
        proctoringStarted: true
      } 
    });

    if (onProceed) {
      onProceed();
    }
  };
  
  const getStatusIcon = (status) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-6 h-6 text-green-500" />;
      case 'error':
        return <XCircle className="w-6 h-6 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-6 h-6 text-yellow-500" />;
      default:
        return <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'success':
        return 'border-green-200 bg-green-50';
      case 'error':
        return 'border-red-200 bg-red-50';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50';
      default:
        return 'border-blue-200 bg-blue-50';
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Face Capture Modal */}
      {showFaceModal && (
        <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 max-w-3xl w-full relative border border-gray-700 shadow-2xl">
            <button
              onClick={closeFaceCaptureModal}
              disabled={capturing && countdown !== null}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-200 disabled:opacity-50 transition-colors z-10"
            >
              <X className="w-6 h-6" />
            </button>
            
            <h2 className="text-3xl font-bold text-center mb-6 bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              📸 Face Reference Capture
            </h2>
            
            {/* Video with Bounding Box Overlay */}
            <div className="relative mb-6 bg-black rounded-xl overflow-hidden shadow-2xl">
              <video
                ref={faceModalVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-96 object-cover"
              />
              
              {/* Bounding Box Overlay Canvas */}
              <canvas
                ref={boundingBoxCanvasRef}
                className="absolute inset-0 w-full h-full pointer-events-none"
                style={{ mixBlendMode: 'normal' }}
              />
              
              {countdown !== null && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/70">
                  <div className="text-white text-9xl font-bold animate-pulse drop-shadow-2xl">
                    {countdown}
                  </div>
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
              
              {/* Positioning Guidelines */}
              <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-black/80 text-white px-4 py-2 rounded-lg text-xs">
                <div className="flex items-center space-x-4">
                  <span className="flex items-center">
                    <div className="w-3 h-3 bg-green-500 rounded mr-2"></div>
                    Ideal Zone
                  </span>
                  <span className="flex items-center">
                    <div className="w-3 h-3 bg-yellow-500 rounded mr-2"></div>
                    Warning Zone
                  </span>
                  <span className="flex items-center">
                    <div className="w-3 h-3 bg-red-500 rounded mr-2"></div>
                    Violation Zone
                  </span>
                </div>
              </div>
            </div>
            
            <div className="text-center space-y-4">
              <p className="text-gray-300 font-medium">
                {checks.faceProctoring.message}
              </p>
              
              {captureStatus === 'idle' && !capturing && (
                <button
                  onClick={startCapture}
                  className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-bold px-12 py-4 rounded-xl transition-all hover:scale-105 text-lg shadow-xl"
                >
                  📸 Capture Reference
                </button>
              )}
              
              {captureStatus === 'error' && !capturing && (
                <button
                  onClick={startCapture}
                  className="bg-red-500 hover:bg-red-600 text-white font-bold px-10 py-4 rounded-xl transition-all hover:scale-105 flex items-center mx-auto shadow-xl"
                >
                  <RefreshCw className="w-5 h-5 mr-2" />
                  Try Again
                </button>
              )}
              
              {capturing && countdown !== null && (
                <div className="text-indigo-400 font-semibold text-lg">
                  Get ready...
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-gray-800/80 backdrop-blur-md border-b border-gray-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center">
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
              Device Compatibility Check
            </h1>
            <p className="text-sm text-gray-400">Ensuring your system is ready for the proctored exam</p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-8">
          <div className="bg-gradient-to-br from-green-400 to-blue-500 p-4 rounded-xl w-fit mx-auto mb-6">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
            System Readiness Check
          </h2>
          <p className="text-lg text-gray-300 mb-2">
            Complete all checks to ensure your device is ready
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-10">
          <div className="flex items-center justify-center space-x-2 overflow-x-auto pb-4">
            {steps.map((step, index) => {
              const IconComponent = step.icon;
              const isActive = index <= currentStep;
              const isComplete = checks[step.key].status === 'success' || checks[step.key].status === 'warning';
              
              return (
                <div key={step.key} className="flex items-center flex-shrink-0">
                  <div className="flex flex-col items-center">
                    <div className={`flex items-center justify-center w-14 h-14 rounded-full border-2 transition-all ${
                      isComplete 
                        ? 'bg-green-500 border-green-500 text-white shadow-lg' 
                        : isActive 
                          ? 'bg-blue-500 border-blue-500 text-white shadow-md' 
                          : 'bg-gray-700 border-gray-600 text-gray-400'
                    }`}>
                      {isComplete ? (
                        <CheckCircle className="w-7 h-7" />
                      ) : (
                        <IconComponent className="w-7 h-7" />
                      )}
                    </div>
                    <span className="text-xs mt-2 font-medium text-gray-300">{step.title}</span>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-12 h-1 mx-2 rounded transition-all ${
                      isComplete ? 'bg-green-500' : 'bg-gray-700'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Check Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Camera Check */}
          <div className={`rounded-xl border-2 p-6 transition-all shadow-md bg-gray-800 ${
            checks.camera.status === 'success' ? 'border-green-500' : 
            checks.camera.status === 'error' ? 'border-red-500' : 
            checks.camera.status === 'warning' ? 'border-yellow-500' : 'border-gray-600'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <Camera className="w-8 h-8 text-blue-400 mr-3" />
                <h3 className="text-lg font-semibold text-white">Camera</h3>
              </div>
              {getStatusIcon(checks.camera.status)}
            </div>
            
            <div className="mb-4">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-32 bg-gray-900 rounded-lg object-cover"
              />
            </div>
            
            <p className="text-sm text-gray-300 mb-3">
              {checks.camera.message}
            </p>
            
            {checks.camera.status === 'error' && (
              <button
                onClick={() => retryCheck('camera')}
                className="flex items-center px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors text-sm"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry
              </button>
            )}
          </div>

          {/* Microphone Check */}
          <div className={`rounded-xl border-2 p-6 transition-all shadow-md bg-gray-800 ${
            checks.microphone.status === 'success' ? 'border-green-500' : 
            checks.microphone.status === 'error' ? 'border-red-500' : 
            checks.microphone.status === 'warning' ? 'border-yellow-500' : 'border-gray-600'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <Mic className="w-8 h-8 text-green-400 mr-3" />
                <h3 className="text-lg font-semibold text-white">Microphone</h3>
              </div>
              {getStatusIcon(checks.microphone.status)}
            </div>
            
            <div className="mb-4 h-32 bg-gray-900 rounded-lg flex items-center justify-center">
              <Mic className="w-12 h-12 text-gray-600" />
            </div>
            
            <p className="text-sm text-gray-300 mb-3">
              {checks.microphone.message}
            </p>
            
            {checks.microphone.status === 'error' && (
              <button
                onClick={() => retryCheck('microphone')}
                className="flex items-center px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors text-sm"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry
              </button>
            )}
          </div>

          {/* Speakers Check */}
          <div className={`rounded-xl border-2 p-6 transition-all shadow-md bg-gray-800 ${
            checks.speakers.status === 'success' ? 'border-green-500' : 
            checks.speakers.status === 'error' ? 'border-red-500' : 
            checks.speakers.status === 'warning' ? 'border-yellow-500' : 'border-gray-600'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <Volume2 className="w-8 h-8 text-purple-400 mr-3" />
                <h3 className="text-lg font-semibold text-white">Speakers</h3>
              </div>
              {getStatusIcon(checks.speakers.status)}
            </div>
            
            <div className="mb-4 h-32 bg-gray-900 rounded-lg flex items-center justify-center">
              <button
                onClick={testSpeakers}
                disabled={checks.speakers.status === 'success'}
                className="bg-purple-500 hover:bg-purple-600 disabled:bg-purple-300 text-white p-4 rounded-full transition-all hover:scale-110"
              >
                <Volume2 className="w-8 h-8" />
              </button>
            </div>
            
            <p className="text-sm text-gray-300 mb-3">
              {checks.speakers.message}
            </p>
          </div>

          {/* Face Proctoring Check */}
          <div className={`rounded-xl border-2 p-6 transition-all shadow-md bg-gray-800 ${
            checks.faceProctoring.status === 'success' ? 'border-green-500' : 
            checks.faceProctoring.status === 'error' ? 'border-red-500' : 
            checks.faceProctoring.status === 'warning' ? 'border-yellow-500' : 'border-gray-600'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <User className="w-8 h-8 text-indigo-400 mr-3" />
                <h3 className="text-lg font-semibold text-white">Face Proctoring</h3>
              </div>
              {getStatusIcon(checks.faceProctoring.status)}
            </div>
            
            <div className="mb-4 h-32 bg-gradient-to-br from-indigo-900 to-purple-900 rounded-lg flex items-center justify-center">
              {checks.faceProctoring.status === 'success' ? (
                <div className="text-center">
                  <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-2" />
                  <p className="text-xs text-gray-300 font-medium">Reference Set ✓</p>
                </div>
              ) : (
                <button
                  onClick={openFaceCaptureModal}
                  disabled={checks.camera.status !== 'success'}
                  className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 disabled:from-gray-600 disabled:to-gray-700 text-white px-6 py-3 rounded-lg transition-all hover:scale-105 disabled:hover:scale-100 font-semibold text-sm"
                >
                  Open Capture
                </button>
              )}
            </div>
            
            <p className="text-sm text-gray-300 mb-3">
              {checks.faceProctoring.message}
            </p>
            
            {checks.faceProctoring.status === 'error' && (
              <button
                onClick={() => retryCheck('faceProctoring')}
                className="flex items-center px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors text-sm"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry
              </button>
            )}
          </div>

          {/* Tab Switching Check */}
          <div className={`rounded-lg border-2 p-6 transition-all bg-gray-800 ${
            checks.tabSwitching.status === 'success' ? 'border-green-500' : 
            checks.tabSwitching.status === 'error' ? 'border-red-500' : 
            checks.tabSwitching.status === 'warning' ? 'border-yellow-500' : 'border-gray-600'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <Monitor className="w-8 h-8 text-orange-400 mr-3" />
                <h3 className="text-lg font-semibold text-white">Tab Monitoring</h3>
              </div>
              {getStatusIcon(checks.tabSwitching.status)}
            </div>
            
            <div className="mb-4 h-32 bg-gray-900 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <Eye className="w-12 h-12 text-gray-600 mx-auto mb-2" />
                <p className="text-sm text-gray-400">Monitoring Active</p>
                {tabSwitchCount > 0 && (
                  <p className="text-xs text-orange-400 mt-1">
                    Switches detected: {tabSwitchCount}
                  </p>
                )}
              </div>
            </div>
            
            <p className="text-sm text-gray-300 mb-3">
              {checks.tabSwitching.message}
            </p>
            
            <div className="bg-orange-900/30 border border-orange-600 rounded-lg p-3">
              <p className="text-xs text-orange-300">
                Try switching to another tab to test the detection system
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">
                System Check {allChecksComplete ? 'Complete' : 'In Progress'}
              </h3>
              <p className="text-gray-300">
                {allChecksComplete 
                  ? 'Your device is ready for the proctored exam'
                  : 'Please wait while we complete all system checks'
                }
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              {onBack && (
                <button
                  onClick={onBack}
                  className="px-6 py-3 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Go Back
                </button>
              )}
              
              <button
                onClick={handleStartExam}
                disabled={!allChecksComplete}
                className="bg-gradient-to-r from-green-400 to-blue-500 hover:from-green-500 hover:to-blue-600 text-white font-semibold px-8 py-3 rounded-lg transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center"
              >
                {allChecksComplete ? (
                  <>
                    Start Exam
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </>
                ) : (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Checking...
                  </>
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