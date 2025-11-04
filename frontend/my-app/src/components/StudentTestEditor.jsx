import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Editor } from '@monaco-editor/react';
import { 
  Play, 
  RotateCcw, 
  ChevronDown,
  Terminal,
  CheckCircle,
  XCircle,
  Clock,
  X,
  AlertTriangle,
  Eye,
  Camera,
  Mic,
  Shield
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';

const StudentTestEditor = () => {
  const location = useLocation();
  const { test, student, testLinkToken, faceReferenceData: incomingFaceRef, proctoringStarted, proctoringBackend, proctoringEnabled } = location.state || {};
  const navigate = useNavigate();
  const { theme } = useTheme();
  const editorRef = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const proctoringIntervalRef = useRef(null);
  const proctoringCanvasRef = useRef(null);
  const lastWarningTimeRef = useRef(0);
  const { user } = useAuth();
  const authToken = user?.token;
  const testToken = testLinkToken;
  
  // Proctoring state
  const lastTabSwitchTimeRef = useRef(0);
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedLanguage, setSelectedLanguage] = useState('python');
  const [code, setCode] = useState('');
  const [activeTab, setActiveTab] = useState('testcase');
  const [testCases, setTestCases] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [questionStatuses, setQuestionStatuses] = useState({});
  const [compilerOutput, setCompilerOutput] = useState('');
  const [testResults, setTestResults] = useState([]);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [isProctoringActive, setIsProctoringActive] = useState(false);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [copyPasteAttempts, setCopyPasteAttempts] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [questionStates, setQuestionStates] = useState({});
  
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [timerRunning, setTimerRunning] = useState(true);
  const [isTimerInitialized, setIsTimerInitialized] = useState(false);
  const MAX_TAB_SWITCHES = 5;
  
  const [proctoringReady, setProctoringReady] = useState(false);
  const [faceReferenceData, setFaceReferenceData] = useState(null);
  const [showTabWarning, setShowTabWarning] = useState(false);
  const [showViolationAlert, setShowViolationAlert] = useState(false);
  const [violationType, setViolationType] = useState('');
  const [violationMessage, setViolationMessage] = useState('');
  const PROCTORING_BACKEND = proctoringBackend || "http://localhost:5001";
  const WARNING_COOLDOWN = 15000; // 15 seconds cooldown between warnings
  
  const languages = [
    { id: 'python', name: 'Python', extension: 'py' },
    { id: 'java', name: 'Java', extension: 'java' },
    { id: 'cpp', name: 'C++', extension: 'cpp' }
  ];

  // Store incoming face reference data
  useEffect(() => {
    if (incomingFaceRef) {
      setFaceReferenceData(incomingFaceRef);
      console.log('✅ Face reference received from DeviceCheck:', incomingFaceRef);
    }
  }, [incomingFaceRef]);

  const drawLiveBoundingBoxes = useCallback((canvas, video, data) => {
    if (!canvas || !video) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas dimensions to match video
    const videoWidth = video.videoWidth || video.clientWidth;
    const videoHeight = video.videoHeight || video.clientHeight;
    
    if (videoWidth === 0 || videoHeight === 0) return;
    
    canvas.width = videoWidth;
    canvas.height = videoHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (!data || !data.reference_face_bbox) return;
    
    const referenceBbox = data.reference_face_bbox;
    const [x1, y1, x2, y2] = referenceBbox;
    
    // Scale coordinates to canvas size
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
    
    // Determine box color based on status
    let mainBoxColor = '#10B981'; // Green (good)
    let boxLabel = 'GOOD POSITION';
    
    if (data.status === 'no_face') {
      mainBoxColor = '#EF4444'; // Red
      boxLabel = 'NO FACE DETECTED';
    } else if (data.status === 'face_moved') {
      mainBoxColor = '#F59E0B'; // Yellow
      boxLabel = 'ADJUST POSITION';
    } else if (data.status === 'eyes_closed') {
      mainBoxColor = '#F59E0B'; // Yellow
      boxLabel = 'EYES CLOSED';
    } else if (data.status === 'looking_away') {
      mainBoxColor = '#F59E0B'; // Yellow
      boxLabel = 'LOOK AT SCREEN';
    } else if (data.status === 'unauthorized_object') {
      mainBoxColor = '#EF4444'; // Red
      boxLabel = 'OBJECT DETECTED';
    } else if (data.warnings && data.warnings.length > 0) {
      mainBoxColor = '#F59E0B'; // Yellow
      boxLabel = 'WARNING';
    }
    
    // Draw ideal face box (reference position)
    ctx.strokeStyle = mainBoxColor;
    ctx.lineWidth = 3;
    ctx.setLineDash([]);
    ctx.strokeRect(scaledX1, scaledY1, width, height);
    
    // Draw corner brackets
    const cornerLength = 25;
    ctx.lineWidth = 3;
    
    // Top-left corner
    ctx.beginPath();
    ctx.moveTo(scaledX1, scaledY1 + cornerLength);
    ctx.lineTo(scaledX1, scaledY1);
    ctx.lineTo(scaledX1 + cornerLength, scaledY1);
    ctx.stroke();
    
    // Top-right corner
    ctx.beginPath();
    ctx.moveTo(scaledX2 - cornerLength, scaledY1);
    ctx.lineTo(scaledX2, scaledY1);
    ctx.lineTo(scaledX2, scaledY1 + cornerLength);
    ctx.stroke();
    
    // Bottom-left corner
    ctx.beginPath();
    ctx.moveTo(scaledX1, scaledY2 - cornerLength);
    ctx.lineTo(scaledX1, scaledY2);
    ctx.lineTo(scaledX1 + cornerLength, scaledY2);
    ctx.stroke();
    
    // Bottom-right corner
    ctx.beginPath();
    ctx.moveTo(scaledX2 - cornerLength, scaledY2);
    ctx.lineTo(scaledX2, scaledY2);
    ctx.lineTo(scaledX2, scaledY2 - cornerLength);
    ctx.stroke();
    
    // Warning zones (yellow) - slightly larger
    const warningPadding = 40;
    ctx.strokeStyle = '#F59E0B';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 4]);
    ctx.strokeRect(
      scaledX1 - warningPadding,
      scaledY1 - warningPadding,
      width + warningPadding * 2,
      height + warningPadding * 2
    );
    
    // Danger zones (red) - even larger
    const dangerPadding = 70;
    ctx.strokeStyle = '#EF4444';
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
    
    // Draw current face bbox if detected
    if (data.face_bbox) {
      const [fx1, fy1, fx2, fy2] = data.face_bbox;
      const scaledFx1 = fx1 * scaleX;
      const scaledFy1 = fy1 * scaleY;
      const scaledFx2 = fx2 * scaleX;
      const scaledFy2 = fy2 * scaleY;
      
      ctx.strokeStyle = mainBoxColor;
      ctx.lineWidth = 2;
      ctx.setLineDash([3, 3]);
      ctx.globalAlpha = 0.7;
      ctx.strokeRect(scaledFx1, scaledFy1, scaledFx2 - scaledFx1, scaledFy2 - scaledFy1);
      ctx.globalAlpha = 1.0;
    }
    
    // Show status label at top
    const labelWidth = 180;
    const labelHeight = 30;
    ctx.fillStyle = mainBoxColor === '#10B981' ? 'rgba(16, 185, 129, 0.9)' : 
                     mainBoxColor === '#F59E0B' ? 'rgba(245, 158, 11, 0.9)' : 
                     'rgba(239, 68, 68, 0.9)';
    ctx.fillRect(10, 10, labelWidth, labelHeight);
    ctx.fillStyle = 'white';
    ctx.font = 'bold 12px Arial';
    ctx.fillText(boxLabel, 20, 28);
  }, []);

  // Continuous frame processing for video proctoring
  const processContinuousFrames = useCallback(async () => {
    if (!videoRef.current || !proctoringReady) return;
    
    try {
      const video = videoRef.current;
      
      if (!video.videoWidth || video.paused || video.ended) {
        return;
      }
      
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0);
      
      const frameDataURL = canvas.toDataURL('image/jpeg', 0.6);
      
      const response = await fetch(`${PROCTORING_BACKEND}/process-frame`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ frame: frameDataURL })
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // Draw bounding boxes on the live video feed
        if (proctoringCanvasRef.current) {
          drawLiveBoundingBoxes(proctoringCanvasRef.current, video, data);
        }
        
        // Check cooldown period before showing new warnings
        const now = Date.now();
        const timeSinceLastWarning = now - lastWarningTimeRef.current;
        
        if (timeSinceLastWarning >= WARNING_COOLDOWN) {
          // Check for violations and show warnings (no auto-submit, no counting)
          if (data.status === 'no_face') {
            setViolationType('no_face');
            setViolationMessage('⚠️ No face detected - Please position yourself in the frame');
            setShowViolationAlert(true);
            lastWarningTimeRef.current = now;
            setTimeout(() => setShowViolationAlert(false), 5000);
          } else if (data.status === 'face_moved') {
            setViolationType('face_moved');
            setViolationMessage('⚠️ Face moved - Please stay within the green box');
            setShowViolationAlert(true);
            lastWarningTimeRef.current = now;
            setTimeout(() => setShowViolationAlert(false), 5000);
          } else if (data.status === 'eyes_closed') {
            setViolationType('eyes_closed');
            setViolationMessage('⚠️ Eyes closed - Keep your eyes open');
            setShowViolationAlert(true);
            lastWarningTimeRef.current = now;
            setTimeout(() => setShowViolationAlert(false), 5000);
          } else if (data.status === 'looking_away') {
            setViolationType('looking_away');
            setViolationMessage('⚠️ Looking away - Focus on the screen');
            setShowViolationAlert(true);
            lastWarningTimeRef.current = now;
            setTimeout(() => setShowViolationAlert(false), 5000);
          } else if (data.status === 'unauthorized_object') {
            setViolationType('unauthorized_object');
            setViolationMessage('🚨 Unauthorized object detected - Remove it immediately');
            setShowViolationAlert(true);
            lastWarningTimeRef.current = now;
            setTimeout(() => setShowViolationAlert(false), 5000);
          } else if (data.warnings && data.warnings.length > 0) {
            setViolationType('warning');
            setViolationMessage(`⚠️ ${data.warnings[0]}`);
            setShowViolationAlert(true);
            lastWarningTimeRef.current = now;
            setTimeout(() => setShowViolationAlert(false), 5000);
          }
        }
      }
      
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Frame processing error:', error);
      }
    }
  }, [PROCTORING_BACKEND, proctoringReady, drawLiveBoundingBoxes]);

 
  // Initialize proctoring with camera and reference
  const initializeProctoring = useCallback(async () => {
    try {
      console.log('🎥 Initializing proctoring...');
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: { ideal: 640 }, height: { ideal: 480 } }, 
        audio: true 
      });
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play().catch(err => console.error('Video play error:', err));
        };
      }
      
      setIsProctoringActive(true);
      console.log('✅ Camera stream initialized');
      
      // Start proctoring backend if not already started
      if (!proctoringStarted) {
        try {
          const startResp = await fetch(`${PROCTORING_BACKEND}/start-proctoring`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
          });

          if (startResp.ok) {
            console.log('✅ Proctoring backend started');
          }
        } catch (err) {
          console.warn('⚠️ Proctoring backend not available:', err);
        }
      }

      // Mark proctoring as ready (reference already set in DeviceCheck)
      setTimeout(() => {
        setProctoringReady(true);
        
        // Start continuous frame processing every 2 seconds
        proctoringIntervalRef.current = setInterval(() => {
          processContinuousFrames();
        }, 2000);
        
        console.log('✅ Continuous proctoring started');
      }, 1000);
      
    } catch (error) {
      console.error('❌ Proctoring initialization error:', error);
      setIsProctoringActive(false);
      setCompilerOutput('⚠️ Warning: Camera access denied. Proctoring disabled.\n');
    }
  }, [PROCTORING_BACKEND, proctoringStarted, processContinuousFrames]);

  // Handle final submit function
  const handleFinalSubmit = useCallback(async () => {
    setShowSubmitModal(false);
    setIsSubmitting(true);
    setTimerRunning(false);
    setCompilerOutput(prev => prev + '\n📤 Preparing final submission...\n');

    // Stop proctoring
    if (proctoringIntervalRef.current) {
      clearInterval(proctoringIntervalRef.current);
    }

    try {
      if (!testToken) {
        throw new Error('Test token missing');
      }

      const payload = {
        name: student.name,
        email: student.email,
        batch: student.batch,
        submittedAt: new Date().toISOString(),
        testId: test.id,
        questionResults: Object.entries(questionStatuses).map(([idx, q]) => ({
          questionId: test.questions[parseInt(idx)].id,
          correct: q.correct,
          attempts: q.attempts,
          output: q.output,
          results: q.results || []
        })),
        tabSwitchCount,
        copyPasteAttempts,
        faceReferenceData: faceReferenceData ? {
          face_center: faceReferenceData.face_center,
          face_bbox: faceReferenceData.face_bbox,
          capturedAt: faceReferenceData.timestamp
        } : null
      };

      const response = await fetch(`http://localhost:8081/api/tests/link/${testToken}/submit-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken && { 'Authorization': `Bearer ${authToken}` })
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Submit failed: ${response.status}`);
      }

      const savedStudent = await response.json();
      setCompilerOutput(prev => prev + '\n✅ Test submitted successfully!\n');

      // Clear localStorage after successful submission
      localStorage.removeItem(`test-${test.id}-student-${student.id}-timer`);
      localStorage.removeItem(`test-${test.id}-student-${student.id}-timer-timestamp`);
      localStorage.removeItem(`test-${test.id}-student-${student.id}-warnings`);
      test.questions.forEach((_, idx) => {
        localStorage.removeItem(`test-${test.id}-q${idx}`);
      });

      setTimeout(() => {
        navigate('/test-complete', { 
          state: { 
            test, 
            student: savedStudent,
            questionStatuses,
            tabSwitchCount,
            copyPasteAttempts
          },
          replace: true
        });
      }, 2000);

    } catch (err) {
      console.error('Submit error:', err);
      setCompilerOutput(prev => prev + `\n❌ Submission failed: ${err.message}\nPlease try again.\n`);
      setIsSubmitting(false);
      setShowSubmitModal(true);
    }
  }, [testToken, student, test, questionStatuses, tabSwitchCount, copyPasteAttempts, faceReferenceData, authToken, navigate]);

  // Main initialization effect
  useEffect(() => {
    if (!test || !student) {
      navigate('/');
      return;
    }
  
    if (!testToken) {
      console.error('CRITICAL: Test link token is missing!');
    }

    // Warn before leaving page
    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = 'Are you sure you want to leave? Your test progress may be lost.';
      return e.returnValue;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
  
    // Initialize timer
    const timerKey = `test-${test.id}-student-${student.id}-timer`;
    const savedTimer = localStorage.getItem(timerKey);
    const savedTimestamp = localStorage.getItem(`${timerKey}-timestamp`);
    
    if (savedTimer && savedTimestamp) {
      const elapsed = Math.floor((Date.now() - parseInt(savedTimestamp)) / 1000);
      const remaining = parseInt(savedTimer) - elapsed;
      setTimeRemaining(remaining > 0 ? remaining : 0);
    } else {
      const initialTime = test.duration * 60;
      setTimeRemaining(initialTime);
      localStorage.setItem(timerKey, initialTime.toString());
      localStorage.setItem(`${timerKey}-timestamp`, Date.now().toString());
    }

    // Load warnings from localStorage
    const savedWarnings = localStorage.getItem(`test-${test.id}-student-${student.id}-warnings`);
    if (savedWarnings) {
      const warnings = JSON.parse(savedWarnings);
      setTabSwitchCount(warnings.tabSwitchCount || 0);
      setCopyPasteAttempts(warnings.copyPasteAttempts || 0);
    }
  
    setIsTimerInitialized(true);
    
    // Initialize proctoring if enabled
    if (proctoringEnabled) {
      initializeProctoring();
    }
  
    // Load saved code
    const savedCode = localStorage.getItem(`test-${test.id}-q0`);
    if (savedCode) {
      setCode(savedCode);
    } else if (test.questions && test.questions.length > 0) {
      const question = test.questions[0];
      const language = question.language || 'python';
      setSelectedLanguage(language);
      setCode(getDefaultCode(language));
    }
  
    // Initialize test cases
    if (test.questions && test.questions.length > 0) {
      const question = test.questions[0];
      const formattedTestCases =
        question.testCases?.map((tc, index) => ({
          id: index + 1,
          input: tc.inputData || '',
          output: tc.expectedOutput || '',
          active: index === 0,
          isExample: tc.exampleCase || false,
        })) || [];
  
      setTestCases(formattedTestCases);
    }
  
    // Tab visibility handler
    const handleVisibilityChange = () => {
      if (document.hidden) {
        const now = Date.now();
        if (now - lastTabSwitchTimeRef.current > 3000) {
          lastTabSwitchTimeRef.current = now;
          setTabSwitchCount((prev) => {
            const newCount = prev + 1;
            const remaining = MAX_TAB_SWITCHES - newCount;

            setShowTabWarning(true);
            setTimeout(() => setShowTabWarning(false), 3000);

            let warningMsg = `⚠️ Tab switch detected at ${new Date().toLocaleTimeString()}\n`;

            if (newCount >= MAX_TAB_SWITCHES) {
              warningMsg = `🚨 MAXIMUM TAB SWITCHES EXCEEDED! Auto-submitting...\n`;
              setCompilerOutput((prev) => prev + warningMsg);
              setTimeout(() => {
                handleFinalSubmit();
              }, 2000);
            } else {
              warningMsg += `${remaining} warning${remaining !== 1 ? 's' : ''} remaining\n`;
              setCompilerOutput((prev) => prev + warningMsg);
            }

            const currentWarnings = JSON.parse(localStorage.getItem(`test-${test.id}-student-${student.id}-warnings`) || '{}');
            localStorage.setItem(`test-${test.id}-student-${student.id}-warnings`, JSON.stringify({
              ...currentWarnings,
              tabSwitchCount: newCount
            }));

            return newCount;
          });
        }
      }
    };
  
    document.addEventListener('visibilitychange', handleVisibilityChange);
  
    // Copy/Paste handlers
    const handleCopyPasteCut = (e) => {
      e.preventDefault();
      setCopyPasteAttempts((prev) => {
        const newCount = prev + 1;
        setCompilerOutput((prevOutput) => prevOutput + `⚠️ Copy/Paste/Cut disabled during exam\n`);
        
        const currentWarnings = JSON.parse(localStorage.getItem(`test-${test.id}-student-${student.id}-warnings`) || '{}');
        localStorage.setItem(`test-${test.id}-student-${student.id}-warnings`, JSON.stringify({
          ...currentWarnings,
          copyPasteAttempts: newCount
        }));

        return newCount;
      });
      return false;
    };
  
    document.addEventListener('copy', handleCopyPasteCut);
    document.addEventListener('paste', handleCopyPasteCut);
    document.addEventListener('cut', handleCopyPasteCut);
    document.addEventListener('contextmenu', (e) => e.preventDefault());
  
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('copy', handleCopyPasteCut);
      document.removeEventListener('paste', handleCopyPasteCut);
      document.removeEventListener('cut', handleCopyPasteCut);
      document.removeEventListener('contextmenu', (e) => e.preventDefault());
      
      if (proctoringIntervalRef.current) {
        clearInterval(proctoringIntervalRef.current);
      }
      
      if (proctoringEnabled) {
        fetch(`${PROCTORING_BACKEND}/stop-proctoring`, { method: 'POST' })
          .catch(err => console.error('Failed to stop proctoring:', err));
      }
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [test, student, navigate, proctoringEnabled, PROCTORING_BACKEND, testToken, initializeProctoring, handleFinalSubmit]);
  
  // Timer effect
  useEffect(() => {
    if (!timerRunning || timeRemaining <= 0 || !isTimerInitialized) return;
  
    const timerKey = `test-${test.id}-student-${student.id}-timer`;
    
    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        const newTime = prev - 1;
        localStorage.setItem(timerKey, newTime.toString());
        localStorage.setItem(`${timerKey}-timestamp`, Date.now().toString());
        
        if (newTime <= 1) {
          setTimerRunning(false);
          setCompilerOutput(prev => prev + '\n⏰ Time is up! Auto-submitting test...\n');
          handleFinalSubmit();
          return 0;
        }
        return newTime;
      });
    }, 1000);
  
    return () => clearInterval(timer);
  }, [timerRunning, timeRemaining, isTimerInitialized, test?.id, student?.id, handleFinalSubmit]);

  // Auto-save code
  useEffect(() => {
    if (test?.id && currentQuestionIndex !== undefined && code) {
      const debounceTimer = setTimeout(() => {
        localStorage.setItem(`test-${test.id}-q${currentQuestionIndex}`, code);
      }, 500);
      
      return () => clearTimeout(debounceTimer);
    }
  }, [code, test?.id, currentQuestionIndex]);

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    return `${minutes}:${String(secs).padStart(2, '0')}`;
  };

  const getTimerColor = () => {
    const percentage = (timeRemaining / (test.duration * 60)) * 100;
    if (percentage > 50) return 'text-emerald-500';
    if (percentage > 25) return 'text-yellow-500';
    if (percentage > 10) return 'text-orange-500';
    return 'text-red-500 animate-pulse';
  };

  function getDefaultCode(language) {
    const templates = {
      python: `def solution(input_data):\n    """\n    Your solution here\n    """\n    pass`,
      java: `class Solution {\n    public String solution(String input) {\n        // Your code here\n        \n    }\n}`,
      cpp: `#include <iostream>\n#include <string>\nusing namespace std;\n\nclass Solution {\npublic:\n    string solution(string input) {\n        // Your code here\n        \n    }\n};`
    };
    return templates[language] || templates.python;
  }

  const handleLanguageChange = (language) => {
    setSelectedLanguage(language);
    setCode(getDefaultCode(language));
  };

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    
    editor.onKeyDown((e) => {
      const isCopy = (e.ctrlKey || e.metaKey) && e.keyCode === monaco.KeyCode.KeyC;
      const isPaste = (e.ctrlKey || e.metaKey) && e.keyCode === monaco.KeyCode.KeyV;
      const isCut = (e.ctrlKey || e.metaKey) && e.keyCode === monaco.KeyCode.KeyX;
      
      if (isCopy || isPaste || isCut) {
        e.preventDefault();
        e.stopPropagation();
        setCopyPasteAttempts(prev => {
          const newCount = prev + 1;
          setCompilerOutput((prevOutput) => prevOutput + `⚠️ Copy/Paste/Cut disabled\n`);
          
          const currentWarnings = JSON.parse(localStorage.getItem(`test-${test.id}-student-${student.id}-warnings`) || '{}');
          localStorage.setItem(`test-${test.id}-student-${student.id}-warnings`, JSON.stringify({
            ...currentWarnings,
            copyPasteAttempts: newCount
          }));

          return newCount;
        });
      }
    });
    
    monaco.editor.defineTheme('jasoos-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6A9955' },
        { token: 'keyword', foreground: '569CD6' },
        { token: 'string', foreground: 'CE9178' }
      ],
      colors: {
        'editor.background': '#1a1a1a',
        'editor.foreground': '#d4d4d4'
      }
    });
  };

  const handleRunCode = async () => {
    if (!student) {
      setCompilerOutput('⚠️ Error: Student information missing.');
      return;
    }

    if (!test?.id || !student?.id) {
      setCompilerOutput('⚠️ Error: Missing test ID or student ID.');
      return;
    }

    setIsRunning(true);
    setActiveTab('result');
    setCompilerOutput('Running code...\n');
    setTestResults([]);

    try {
      const question = test.questions[currentQuestionIndex];
      if (!question) throw new Error('Question data missing');

      const extMap = { python: 'py', java: 'java', cpp: 'cpp' };
      const filename = `Solution.${extMap[selectedLanguage] || 'txt'}`;

      const body = {
        language: selectedLanguage,
        source: code,
        filename,
        stdin: '',
        questionId: question.id,
        studentId: student.id
      };

      const submissionResp = await fetch(
        `http://localhost:8081/api/submissions?testId=${test.id}&studentId=${student.id}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        }
      );

      if (!submissionResp.ok) {
        throw new Error(`Submission failed: ${submissionResp.status}`);
      }

      const submissionData = await submissionResp.json();
      const subId = submissionData.id || submissionData.submissionId;
      if (!subId) throw new Error('Submission ID missing');

      setCompilerOutput('Code submitted. Waiting for results...\n');

      let status = 'PENDING';
      let attempts = 0;
      while ((status === 'PENDING' || status === 'RUNNING') && attempts < 60) {
        await new Promise(res => setTimeout(res, 1000));
        const statusResp = await fetch(`http://localhost:8081/api/submissions/${subId}`);
        if (!statusResp.ok) throw new Error('Failed to fetch status');
        const statusData = await statusResp.json();
        status = statusData.status;
        attempts++;
      }

      const resultsResp = await fetch(`http://localhost:8081/api/submissions/${subId}/results`);
      if (!resultsResp.ok) throw new Error('Failed to fetch results');
      const apiResults = await resultsResp.json();

      const formattedResults = apiResults.map((r, idx) => ({
        testCaseNumber: idx + 1,
        status: r.status === 'AC' ? 'pass' : 'fail',
        input: testCases[idx]?.input || 'N/A',
        expectedOutput: testCases[idx]?.output || 'N/A',
        actualOutput: r.stdout || '',
        stderr: r.stderr || '',
        isExample: testCases[idx]?.isExample || false
      }));

      setTestResults(formattedResults);

      const passed = formattedResults.filter(r => r.status === 'pass').length;
      const total = formattedResults.length;

      setQuestionStatuses(prev => ({
        ...prev,
        [currentQuestionIndex]: {
          attempted: true,
          passed,
          total,
          allPassed: passed === total,
          correct: passed === total,
          attempts: (prev[currentQuestionIndex]?.attempts || 0) + 1,
          output: formattedResults,
          results: formattedResults.map(r => ({
            status: r.status === 'pass' ? 'passed' : 'failed',
            input: r.input,
            expectedOutput: r.expectedOutput,
            actualOutput: r.actualOutput
          }))
        }
      }));

      let output = '╔═══════════════════════════════════════╗\n';
      output += `TEST RESULTS: ${passed}/${total} Passed\n`;
      output += '╚═══════════════════════════════════════╝\n\n';

      formattedResults.filter(r => r.isExample).forEach(r => {
        if (r.status === 'pass') {
          output += `✅ Test ${r.testCaseNumber}: PASSED\n`;
          output += `Input: ${r.input}\n`;
          output += `Output: ${r.actualOutput}\n\n`;
        } else {
          output += `❌ Test ${r.testCaseNumber}: FAILED\n`;
          output += `Input: ${r.input}\n`;
          output += `Expected: ${r.expectedOutput}\n`;
          output += `Got: ${r.actualOutput}\n`;
          if (r.stderr) output += `Error: ${r.stderr}\n`;
          output += '\n';
        }
      });

      setCompilerOutput(output);

    } catch (err) {
      console.error(err);
      setCompilerOutput(`ERROR: ${err.message}\n\nCheck your code and try again.`);
    } finally {
      setIsRunning(false);
    }
  };

  const handleQuestionChange = (index) => {
    if (isSubmitting) return;

    localStorage.setItem(`test-${test.id}-q${currentQuestionIndex}`, code);
    
    setQuestionStates(prev => ({
      ...prev,
      [currentQuestionIndex]: {
        activeTab,
        testResults,
        compilerOutput
      }
    }));

    setCurrentQuestionIndex(index);
    const question = test.questions[index];
    const language = question.language || 'python';
    setSelectedLanguage(language);

    const savedCode = localStorage.getItem(`test-${test.id}-q${index}`);
    setCode(savedCode || getDefaultCode(language));

    const formattedTestCases = question.testCases?.map((tc, i) => ({
      id: i + 1,
      input: tc.inputData || '',
      output: tc.expectedOutput || '',
      active: i === 0,
      isExample: tc.exampleCase || false
    })) || [];

    setTestCases(formattedTestCases);
    
    const savedState = questionStates[index];
    if (savedState) {
      setActiveTab(savedState.activeTab || 'testcase');
      setTestResults(savedState.testResults || []);
      setCompilerOutput(savedState.compilerOutput || '');
    } else {
      setCompilerOutput('');
      setTestResults([]);
      setActiveTab('testcase');
    }
  };

  const handleSubmitTest = () => {
    if (isSubmitting) return;
    setShowSubmitModal(true);
  };

  if (!test || !student) return null;
  const currentQuestion = test.questions[currentQuestionIndex];
  const attemptedCount = Object.keys(questionStatuses).length;
  const totalQuestions = test.questions.length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">{test.title}</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">{student.name} | {student.email}</p>
          </div>

          <div className="relative">
            <div className={`flex items-center space-x-3 ${getTimerColor()} transition-colors duration-300`}>
              <div className="relative">
                <Clock className="w-8 h-8" />
                {timeRemaining < 300 && (
                  <div className="absolute inset-0 animate-ping">
                    <Clock className="w-8 h-8 opacity-75" />
                  </div>
                )}
              </div>
              <div className="flex flex-col">
                <span className="text-3xl font-bold tracking-tight font-mono">{formatTime(timeRemaining)}</span>
                <span className="text-xs font-medium opacity-75">{timeRemaining < 300 ? 'HURRY UP!' : 'Time Remaining'}</span>
              </div>
            </div>
            
            <div className="absolute -bottom-2 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-1000 ease-linear ${
                  timeRemaining < 300 ? 'bg-red-500 animate-pulse' : 
                  timeRemaining < (test.duration * 60 * 0.25) ? 'bg-yellow-500' : 
                  'bg-emerald-500'
                }`}
                style={{ width: `${(timeRemaining / (test.duration * 60)) * 100}%` }}
              />
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className={`flex items-center space-x-2 ${isProctoringActive ? 'text-green-500' : 'text-gray-400'}`}>
              <Camera className="w-5 h-5" />
              <Mic className="w-5 h-5" />
              {isProctoringActive && <div className="w-2 h-2 rounded-full bg-current animate-pulse"></div>}
            </div>

            {tabSwitchCount > 0 && (
              <div className={`flex items-center space-x-2 ${tabSwitchCount >= MAX_TAB_SWITCHES ? 'text-red-500' : 'text-yellow-500'}`}>
                <Eye className="w-5 h-5" />
                <span className="text-sm font-bold">{tabSwitchCount}/{MAX_TAB_SWITCHES}</span>
              </div>
            )}

            {copyPasteAttempts > 0 && (
              <div className="flex items-center space-x-2 text-red-500">
                <Shield className="w-5 h-5" />
                <span className="text-sm">{copyPasteAttempts}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Video Proctoring Feed */}
      <div className="fixed bottom-4 right-4 z-50">
        <div className="relative">
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="w-48 h-36 bg-gray-900 rounded-lg border-2 border-green-400 object-cover shadow-2xl"
          />
          
          {/* Bounding box overlay canvas */}
          <canvas
            ref={proctoringCanvasRef}
            className="absolute inset-0 w-full h-full pointer-events-none rounded-lg"
          />
          
          {/* Live indicator */}
          <div className={`absolute top-2 right-2 px-2 py-1 rounded text-xs font-bold text-white ${isProctoringActive ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`}>
            {isProctoringActive ? 'LIVE' : 'OFF'}
          </div>
          
          {/* Proctoring status indicator */}
          {isProctoringActive && (
            <div className="absolute bottom-2 left-2 right-2 text-center">
              <div className="bg-black/70 backdrop-blur-sm text-white text-xs px-2 py-1 rounded">
                Keep face in green box
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Violation Alert */}
      {showViolationAlert && (
        <div className="fixed top-24 left-1/2 transform -translate-x-1/2 z-40 animate-bounce max-w-md">
          <div className={`px-6 py-4 rounded-xl shadow-2xl font-bold border-2 text-center ${
            violationType === 'unauthorized_object' || violationType === 'no_face'
              ? 'bg-red-500 border-red-600 text-white' 
              : 'bg-yellow-500 border-yellow-600 text-black'
          }`}>
            <div className="text-lg">{violationMessage}</div>
            <div className="text-xs mt-1 opacity-75">Adjust within 15 seconds</div>
          </div>
        </div>
      )}

      {/* Tab Switch Warning */}
      {showTabWarning && tabSwitchCount > 0 && tabSwitchCount < MAX_TAB_SWITCHES && (
        <div className="fixed top-24 left-1/2 transform -translate-x-1/2 z-40 animate-pulse">
          <div className="bg-yellow-500 text-black px-8 py-4 rounded-xl shadow-2xl font-bold text-center border-2 border-yellow-600">
            <div className="text-sm mb-1">⚠️ TAB SWITCH DETECTED</div>
            <div className="text-2xl">{MAX_TAB_SWITCHES - tabSwitchCount} Attempts Remaining</div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg mb-4 p-4">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Questions ({attemptedCount}/{totalQuestions} attempted)
            </span>
            <button
              onClick={handleSubmitTest}
              className="bg-gradient-to-r from-green-400 to-blue-500 hover:from-green-500 hover:to-blue-600 text-white font-semibold px-6 py-2 rounded-lg transition-all hover:scale-105"
            >
              Submit Test
            </button>
          </div>
          <div className="flex items-center space-x-2 overflow-x-auto">
            {test.questions.map((_, index) => {
              const status = questionStatuses[index];
              return (
                <button
                  key={index}
                  onClick={() => handleQuestionChange(index)}
                  className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                    index === currentQuestionIndex
                      ? 'bg-green-400 text-black'
                      : status?.attempted
                      ? status.allPassed
                        ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 border-2 border-green-500'
                        : 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 border-2 border-yellow-500'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  Q{index + 1}
                  {status?.attempted && (
                    <span className="absolute -top-1 -right-1">
                      {status.allPassed ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-yellow-500" />
                      )}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Question {currentQuestionIndex + 1}
            </h2>
            <div className="prose dark:prose-invert max-w-none">
              <p className="text-gray-700 dark:text-gray-300 mb-4 whitespace-pre-wrap">
                {currentQuestion.description}
              </p>
              
              <div className="mt-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Examples:</h3>
                <div className="space-y-3">
                  {testCases.filter(tc => tc.isExample).map((testCase, index) => (
                    <div key={testCase.id} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                      <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                        Example {index + 1}:
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div>
                          <strong className="text-gray-700 dark:text-gray-300">Input:</strong>
                          <code className="ml-2 bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded text-gray-900 dark:text-gray-100">
                            {testCase.input}
                          </code>
                        </div>
                        <div>
                          <strong className="text-gray-700 dark:text-gray-300">Output:</strong>
                          <code className="ml-2 bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded text-gray-900 dark:text-gray-100">
                            {testCase.output}
                          </code>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
            <div className="border-b border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <span className="text-lg font-semibold text-gray-900 dark:text-white">Code</span>
                  
                  <div className="relative">
                    <select
                      value={selectedLanguage}
                      onChange={(e) => handleLanguageChange(e.target.value)}
                      className="appearance-none bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-1 rounded border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-400 pr-8"
                    >
                      {languages.map(lang => (
                        <option key={lang.id} value={lang.id}>{lang.name}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                  </div>
                </div>

                <button
                  onClick={() => setCode(getDefaultCode(selectedLanguage))}
                  className="p-2 text-gray-600 dark:text-gray-400 hover:text-green-400 transition-colors"
                  title="Reset"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="h-96">
              <Editor
                height="100%"
                language={selectedLanguage}
                value={code}
                onChange={(value) => setCode(value || '')}
                onMount={handleEditorDidMount}
                theme={theme === 'dark' ? 'jasoos-dark' : 'vs-light'}
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  lineNumbers: 'on',
                  automaticLayout: true,
                  tabSize: 2,
                  wordWrap: 'on',
                  contextmenu: false,
                  quickSuggestions: false
                }}
              />
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 p-4">
              <button
                onClick={handleRunCode}
                disabled={isRunning}
                className="w-full bg-green-400 hover:bg-green-500 disabled:opacity-50 text-black font-semibold px-4 py-3 rounded-lg transition-all hover:scale-105 disabled:hover:scale-100 flex items-center justify-center"
              >
                {isRunning ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black mr-2"></div>
                    Running Tests...
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5 mr-2" />
                    Run Code
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="mt-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <div className="flex">
              <button
                onClick={() => setActiveTab('testcase')}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'testcase'
                    ? 'border-green-400 text-green-400'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Terminal className="w-4 h-4 inline mr-2" />
                Test Cases
              </button>
              <button
                onClick={() => setActiveTab('result')}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'result'
                    ? 'border-green-400 text-green-400'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Test Result
              </button>
            </div>
          </div>

          <div className="p-4">
            {activeTab === 'testcase' && (
              <div>
                <div className="flex items-center space-x-2 mb-4 overflow-x-auto">
                  {testCases.filter(tc => tc.isExample).map((testCase, index) => (
                    <button
                      key={testCase.id}
                      onClick={() => setTestCases(testCases.map(tc => ({ ...tc, active: tc.id === testCase.id })))}
                      className={`px-3 py-1 rounded text-sm font-medium transition-colors whitespace-nowrap ${
                        testCase.active
                          ? 'bg-green-400 text-black'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                      }`}
                    >
                      Case {index + 1}
                      <span className="ml-1 text-xs bg-blue-500 text-white px-1 rounded">Ex</span>
                    </button>
                  ))}
                </div>

                {testCases.filter(tc => tc.active && tc.isExample).map(testCase => (
                  <div key={testCase.id} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Input:
                      </label>
                      <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg font-mono text-sm text-gray-900 dark:text-white">
                        {testCase.input}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Expected Output:
                      </label>
                      <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg font-mono text-sm text-gray-900 dark:text-white">
                        {testCase.output}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'result' && (
              <div>
                {testResults.length > 0 ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Test Cases Results
                      </h3>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {testResults.filter(r => r.status === 'pass').length}/{testResults.length} Passed
                      </span>
                    </div>

                    {testResults.filter(r => r.isExample).map((result) => (
                      <div
                        key={result.testCaseNumber}
                        className={`p-4 rounded-lg border-2 ${
                          result.status === 'pass'
                            ? 'bg-green-50 dark:bg-green-900/20 border-green-500'
                            : 'bg-red-50 dark:bg-red-900/20 border-red-500'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            {result.status === 'pass' ? (
                              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                            ) : (
                              <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                            )}
                            <span className={`font-semibold ${
                              result.status === 'pass'
                                ? 'text-green-700 dark:text-green-300'
                                : 'text-red-700 dark:text-red-300'
                            }`}>
                              Test Case {result.testCaseNumber}
                            </span>
                          </div>
                          <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded">
                            Example
                          </span>
                        </div>

                        <div className="mt-3 space-y-2 text-sm">
                          <div>
                            <strong className="text-gray-700 dark:text-gray-300">Input:</strong>
                            <code className="ml-2 text-gray-900 dark:text-gray-100">
                              {result.input}
                            </code>
                          </div>
                          <div>
                            <strong className="text-gray-700 dark:text-gray-300">Expected:</strong>
                            <code className="ml-2 text-gray-900 dark:text-gray-100">
                              {result.expectedOutput}
                            </code>
                          </div>
                          <div>
                            <strong className="text-gray-700 dark:text-gray-300">Your Output:</strong>
                            <code className={`ml-2 ${
                              result.status === 'pass'
                                ? 'text-green-700 dark:text-green-300'
                                : 'text-red-700 dark:text-red-300'
                            }`}>
                              {result.actualOutput || 'No output'}
                            </code>
                          </div>
                          {result.stderr && (
                            <div>
                              <strong className="text-red-600 dark:text-red-400">Error:</strong>
                              <code className="ml-2 text-red-600 dark:text-red-400">
                                {result.stderr}
                              </code>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}

                    {testResults.filter(r => !r.isExample).length > 0 && (
                      <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {testResults.filter(r => !r.isExample && r.status === 'pass').length}/
                          {testResults.filter(r => !r.isExample).length} hidden test cases passed
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <Clock className="w-8 h-8 mx-auto mb-2" />
                    <p>Run your code to see results</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {compilerOutput && (
          <div className="mt-4 bg-black rounded-lg shadow-lg overflow-hidden">
            <div className="p-3 bg-gray-900 border-b border-gray-700 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Terminal className="w-4 h-4 text-green-400" />
                <span className="text-sm font-medium text-green-400">Console Output</span>
              </div>
              <button
                onClick={() => setCompilerOutput('')}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 font-mono text-sm text-green-400 whitespace-pre-wrap max-h-64 overflow-auto">
              {compilerOutput}
            </div>
          </div>
        )}
      </div>

      {showSubmitModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Submit Test?
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Are you sure you want to submit your test?
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600 dark:text-gray-400">Questions Attempted</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {attemptedCount}/{totalQuestions}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 dark:text-gray-400">Time Remaining</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {formatTime(timeRemaining)}
                  </p>
                </div>
              </div>
              
              {(tabSwitchCount > 0 || copyPasteAttempts > 0) && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                  {tabSwitchCount > 0 && (
                    <p className="text-xs text-yellow-600 dark:text-yellow-400 mb-1">
                      Tab switches: {tabSwitchCount}
                    </p>
                  )}
                  {copyPasteAttempts > 0 && (
                    <p className="text-xs text-red-600 dark:text-red-400 mb-1">
                      Copy/Paste attempts: {copyPasteAttempts}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="flex space-x-4">
              <button
                onClick={() => setShowSubmitModal(false)}
                className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleFinalSubmit}
                className="flex-1 bg-gradient-to-r from-green-400 to-blue-500 hover:from-green-500 hover:to-blue-600 text-white font-semibold px-4 py-3 rounded-lg transition-all hover:scale-105"
              >
                Submit Test
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentTestEditor;