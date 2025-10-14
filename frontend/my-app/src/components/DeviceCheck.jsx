import React, { useState, useEffect, useRef } from 'react';
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
  Monitor
} from 'lucide-react';

const DeviceCheck = ({ onProceed, onBack }) => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Extract test, student, and testLinkToken from location state
  const { test, student, testLinkToken } = location.state || {};
  
  const [checks, setChecks] = useState({
    camera: { status: 'pending', message: 'Checking camera access...' },
    microphone: { status: 'pending', message: 'Checking microphone access...' },
    speakers: { status: 'pending', message: 'Click to test speakers...' },
    tabSwitching: { status: 'pending', message: 'Tab switching detection will be monitored during exam' }
  });
  
  const [currentStep, setCurrentStep] = useState(0);
  const [allChecksComplete, setAllChecksComplete] = useState(false);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const audioContextRef = useRef(null);
  
  const steps = [
    { key: 'camera', title: 'Camera Test', icon: Camera },
    { key: 'microphone', title: 'Microphone Test', icon: Mic },
    { key: 'speakers', title: 'Speaker Test', icon: Volume2 },
    { key: 'tabSwitching', title: 'Tab Monitoring', icon: Eye }
  ];

  useEffect(() => {
    // Validate required data
    if (!test || !student) {
      console.error('Missing test or student data in DeviceCheck');
      alert('Test or student information is missing. Please start over.');
      navigate('/');
      return;
    }

    if (!testLinkToken) {
      console.warn('Warning: testLinkToken is missing. Submission may fail.');
    }

    // Start automatic checks
    setTimeout(() => checkCamera(), 500);
    setTimeout(() => checkMicrophone(), 1000);
    setTimeout(() => setupTabSwitchingDetection(), 1500);
    
    return () => {
      // Cleanup
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [test, student, testLinkToken, navigate]);

  useEffect(() => {
    // Check if all tests are complete
    const allComplete = Object.values(checks).every(check => 
      check.status === 'success' || check.status === 'warning'
    );
    setAllChecksComplete(allComplete);
  }, [checks]);

  const updateCheck = (key, status, message) => {
    setChecks(prev => ({
      ...prev,
      [key]: { status, message }
    }));
  };

  const checkCamera = async () => {
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
  };

  const checkMicrophone = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Create audio context to check if audio is actually working
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      audioContextRef.current = audioContext;
      
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      source.connect(analyser);
      
      // Stop the stream after checking
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
  };

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
  
  const setupTabSwitchingDetection = () => {
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
  
    console.log('Starting exam navigation...');
    console.log('Student:', student);
    console.log('Test ID:', test.id);
    console.log('Test Link Token:', testLinkToken);
    console.log('Device Checks:', checks);
    console.log('Tab switches during check:', tabSwitchCount);
  
    // Navigate to StudentTestEditor with all required data
    navigate('/studenttesteditor', { 
      state: {
        student,
        test,
        testLinkToken, // This is the critical token for submission
        deviceCheckResults: checks,
        tabSwitchCount: tabSwitchCount || 0,
        copyPasteAttempts: 0
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
        return 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20';
      case 'error':
        return 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20';
      case 'warning':
        return 'border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20';
      default:
        return 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-black">
      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-center">
            <img 
              src="/Your paragraph text (1).png" 
              alt="Jasoos Logo" 
              className="h-12 w-auto mr-4"
            />
            <div className="text-center">
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
                Device Compatibility Check
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">Ensuring your system is ready for the exam</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-8">
          <div className="bg-gradient-to-br from-green-400 to-blue-500 p-4 rounded-xl w-fit mx-auto mb-6">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Hello, {student?.name || 'Student'}!
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-2">
            Let's make sure your device is ready for the proctored exam
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            We'll test your camera, microphone, speakers, and monitoring systems
          </p>
        </div>

        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4 mb-6">
            {steps.map((step, index) => {
              const IconComponent = step.icon;
              const isActive = index <= currentStep;
              const isComplete = checks[step.key].status === 'success' || checks[step.key].status === 'warning';
              
              return (
                <div key={step.key} className="flex items-center">
                  <div className={`flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all ${
                    isComplete 
                      ? 'bg-green-500 border-green-500 text-white' 
                      : isActive 
                        ? 'bg-blue-500 border-blue-500 text-white' 
                        : 'bg-gray-200 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-500'
                  }`}>
                    {isComplete ? (
                      <CheckCircle className="w-6 h-6" />
                    ) : (
                      <IconComponent className="w-6 h-6" />
                    )}
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-16 h-1 mx-2 rounded transition-all ${
                      isComplete ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className={`rounded-lg border-2 p-6 transition-all ${getStatusColor(checks.camera.status)}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <Camera className="w-8 h-8 text-blue-500 mr-3" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Camera Test</h3>
              </div>
              {getStatusIcon(checks.camera.status)}
            </div>
            
            <div className="mb-4">
              <video
                ref={videoRef}
                autoPlay
                muted
                className="w-full h-32 bg-gray-200 dark:bg-gray-700 rounded-lg object-cover"
              />
            </div>
            
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              {checks.camera.message}
            </p>
            
            {checks.camera.status === 'error' && (
              <button
                onClick={() => retryCheck('camera')}
                className="flex items-center px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry Camera
              </button>
            )}
          </div>

          <div className={`rounded-lg border-2 p-6 transition-all ${getStatusColor(checks.microphone.status)}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <Mic className="w-8 h-8 text-green-500 mr-3" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Microphone Test</h3>
              </div>
              {getStatusIcon(checks.microphone.status)}
            </div>
            
            <div className="mb-4 h-32 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <Mic className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Microphone Access</p>
              </div>
            </div>
            
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              {checks.microphone.message}
            </p>
            
            {checks.microphone.status === 'error' && (
              <button
                onClick={() => retryCheck('microphone')}
                className="flex items-center px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry Microphone
              </button>
            )}
          </div>

          <div className={`rounded-lg border-2 p-6 transition-all ${getStatusColor(checks.speakers.status)}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <Volume2 className="w-8 h-8 text-purple-500 mr-3" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Speaker Test</h3>
              </div>
              {getStatusIcon(checks.speakers.status)}
            </div>
            
            <div className="mb-4 h-32 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
              <button
                onClick={testSpeakers}
                className="bg-purple-500 hover:bg-purple-600 text-white p-4 rounded-full transition-all hover:scale-110"
              >
                <Volume2 className="w-8 h-8" />
              </button>
            </div>
            
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              {checks.speakers.message}
            </p>
          </div>

          <div className={`rounded-lg border-2 p-6 transition-all ${getStatusColor(checks.tabSwitching.status)}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <Monitor className="w-8 h-8 text-orange-500 mr-3" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Tab Monitoring</h3>
              </div>
              {getStatusIcon(checks.tabSwitching.status)}
            </div>
            
            <div className="mb-4 h-32 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <Eye className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Monitoring Active</p>
                {tabSwitchCount > 0 && (
                  <p className="text-xs text-orange-500 mt-1">
                    Switches detected: {tabSwitchCount}
                  </p>
                )}
              </div>
            </div>
            
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              {checks.tabSwitching.message}
            </p>
            
            <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-3">
              <p className="text-xs text-orange-800 dark:text-orange-200">
                Try switching to another tab to test the detection system
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                System Check {allChecksComplete ? 'Complete' : 'In Progress'}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
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
                  className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
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