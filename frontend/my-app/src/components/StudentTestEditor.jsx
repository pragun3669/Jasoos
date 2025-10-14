
import React, { useState, useEffect, useRef } from 'react';
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
  const { test, student, testLinkToken } = location.state || {};
  const navigate = useNavigate();
  const { theme } = useTheme();
  const editorRef = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const { user } = useAuth();
  const authToken = user?.token;
  const testToken = testLinkToken;
  
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
  const [isProctoringActive, setIsProctoringActive] = useState(true);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [copyPasteAttempts, setCopyPasteAttempts] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [questionStates, setQuestionStates] = useState({});
  
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [timerRunning, setTimerRunning] = useState(true);
  const [isTimerInitialized, setIsTimerInitialized] = useState(false);
  const MAX_TAB_SWITCHES = 5;

  const languages = [
    { id: 'python', name: 'Python', extension: 'py' },
    { id: 'java', name: 'Java', extension: 'java' },
    { id: 'cpp', name: 'C++', extension: 'cpp' }
  ];
  useEffect(() => {
    if (!test || !student) {
      navigate('/');
      return;
    }
  
    if (!testToken) {
      console.error('CRITICAL: Test link token is missing!');
      alert('Test access token is missing. Cannot submit test.');
    }
  
    // Initialize or restore timer from localStorage
    const timerKey = `test-${test.id}-student-${student.id}-timer`;
    const savedTimer = localStorage.getItem(timerKey);
    const savedTimestamp = localStorage.getItem(`${timerKey}-timestamp`);
    
    if (savedTimer && savedTimestamp) {
      const elapsed = Math.floor((Date.now() - parseInt(savedTimestamp)) / 1000);
      const remaining = parseInt(savedTimer) - elapsed;
      setTimeRemaining(remaining > 0 ? remaining : 0);
      if (remaining <= 0) {
        handleAutoSubmit();
      }
    } else {
      const initialTime = test.duration * 60;
      setTimeRemaining(initialTime);
      localStorage.setItem(timerKey, initialTime.toString());
      localStorage.setItem(`${timerKey}-timestamp`, Date.now().toString());
    }
  
    setIsTimerInitialized(true);
    initializeProctoring();
  
    // ✅ Correctly handle code setup
    const savedCode = localStorage.getItem(`test-${test.id}-q${currentQuestionIndex}`);
    if (savedCode) {
      setCode(savedCode);
    } else if (test.questions && test.questions.length > 0) {
      const question = test.questions[0];
      const language = question.language || 'python';
      setSelectedLanguage(language);
      setCode(getDefaultCode(language));
    }
  
    // ✅ Set test cases
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
  
    // ✅ Event listeners
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setTabSwitchCount((prev) => {
          const newCount = prev + 1;
          const remaining = MAX_TAB_SWITCHES - newCount;
  
          let warningMsg = `\n⚠️ WARNING: Tab switch detected at ${new Date().toLocaleTimeString()}!\n`;
  
          if (newCount >= MAX_TAB_SWITCHES) {
            warningMsg += `🚨 MAXIMUM TAB SWITCHES EXCEEDED! Test will be auto-submitted.\n`;
            setTimeout(() => handleAutoSubmit(), 2000);
          } else {
            warningMsg += `⚠️ ${remaining} warning${remaining !== 1 ? 's' : ''} remaining before auto-submit!\n`;
          }
  
          setCompilerOutput((prev) => prev + warningMsg);
          return newCount;
        });
      }
    };
  
    document.addEventListener('visibilitychange', handleVisibilityChange);
  
    const handleCopyPasteCut = (e) => {
      e.preventDefault();
      setCopyPasteAttempts((prev) => prev + 1);
      setCompilerOutput((prev) => prev + `\n⚠️ Copy/Paste/Cut operations are disabled during the exam!\n`);
      return false;
    };
  
    document.addEventListener('copy', handleCopyPasteCut);
    document.addEventListener('paste', handleCopyPasteCut);
    document.addEventListener('cut', handleCopyPasteCut);
  
    const handleContextMenu = (e) => {
      e.preventDefault();
      return false;
    };
    document.addEventListener('contextmenu', handleContextMenu);
  
    // ✅ Cleanup
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('copy', handleCopyPasteCut);
      document.removeEventListener('paste', handleCopyPasteCut);
      document.removeEventListener('cut', handleCopyPasteCut);
      document.removeEventListener('contextmenu', handleContextMenu);
  
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [test, student, navigate]);
  
  useEffect(() => {
    if (!timerRunning || timeRemaining <= 0 || !isTimerInitialized) return;
  
    const timerKey = `test-${test.id}-student-${student.id}-timer`;
    
    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        const newTime = prev - 1;
        
        // Update localStorage
        localStorage.setItem(timerKey, newTime.toString());
        localStorage.setItem(`${timerKey}-timestamp`, Date.now().toString());
        
        if (newTime <= 1) {
          setTimerRunning(false);
          handleAutoSubmit();
          return 0;
        }
        return newTime;
      });
    }, 1000);
  
    return () => clearInterval(timer);
  }, [timerRunning, timeRemaining, isTimerInitialized, test?.id, student?.id]);
  
  const initializeProctoring = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      
      setIsProctoringActive(false);
    } catch (error) {
      console.error('Proctoring error:', error);
      setIsProctoringActive(false);
      setCompilerOutput('⚠️ Warning: Proctoring could not be activated.\n');
    }
  };
  // Auto-save code changes to localStorage
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
      python: `def solution(input_data):
    """
    Your solution here
    """
    pass`,
      java: `class Solution {
    public String solution(String input) {
        // Your code here
        
    }
}`,
      cpp: `#include <iostream>
#include <string>
using namespace std;

class Solution {
public:
    string solution(string input) {
        // Your code here
        
    }
};`
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
        setCopyPasteAttempts(prev => prev + 1);
        setCompilerOutput(prev => prev + `\n⚠️ Copy/Paste/Cut operations are disabled during the exam!\n`);
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
    setCompilerOutput('🔄 Running your code...\n');
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
        const text = await submissionResp.text();
        throw new Error(`Submission failed: ${submissionResp.status} ${text}`);
      }

      const submissionData = await submissionResp.json();
      const subId = submissionData.id || submissionData.submissionId;
      if (!subId) throw new Error('Submission ID missing from response');

      setCompilerOutput('✓ Code submitted successfully\n🔄 Waiting for results...\n');

      let status = 'PENDING';
      let attempts = 0;
      while ((status === 'PENDING' || status === 'RUNNING') && attempts < 60) {
        await new Promise(res => setTimeout(res, 1000));
        const statusResp = await fetch(`http://localhost:8081/api/submissions/${subId}`);
        if (!statusResp.ok) throw new Error('Failed to fetch submission status');
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

      let output = '═══════════════════════════════════════════════\n';
      output += `  TEST RESULTS: ${passed}/${total} Test Cases Passed\n`;
      output += '═══════════════════════════════════════════════\n\n';

      formattedResults.filter(r => r.isExample).forEach(r => {
        if (r.status === 'pass') {
          output += `✅ Test Case ${r.testCaseNumber}: PASSED\n`;
          output += `   Input: ${r.input}\n`;
          output += `   Output: ${r.actualOutput}\n\n`;
        } else {
          output += `❌ Test Case ${r.testCaseNumber}: FAILED\n`;
          output += `   Input: ${r.input}\n`;
          output += `   Expected: ${r.expectedOutput}\n`;
          output += `   Got: ${r.actualOutput}\n`;
          if (r.stderr) output += `   Error: ${r.stderr}\n`;
          output += '\n';
        }
      });

      setCompilerOutput(output);

    } catch (err) {
      console.error(err);
      setCompilerOutput(`⚠️ ERROR: ${err.message}\n\nCheck your code and try again.`);
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

  const handleAutoSubmit = () => {
    setCompilerOutput(prev => prev + '\n⏰ Time is up! Auto-submitting test...\n');
    setTimerRunning(false);
    setIsSubmitting(true);
    
    handleFinalSubmit();
  };

  const handleFinalSubmit = async () => {
    setShowSubmitModal(false);
    setIsSubmitting(true);
    setTimerRunning(false);
    setCompilerOutput(prev => prev + '\n📤 Preparing final submission...\n');

    try {
      if (!testToken) {
        throw new Error('Test token is missing. Cannot submit.');
      }

      const currentStatus = questionStatuses[currentQuestionIndex];
      if (!currentStatus?.attempted) {
        setCompilerOutput(prev => prev + `\n🔄 Running code for Question ${currentQuestionIndex + 1}...\n`);
        
        try {
          const question = test.questions[currentQuestionIndex];
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

          if (submissionResp.ok) {
            const submissionData = await submissionResp.json();
            const subId = submissionData.id || submissionData.submissionId;
            
            if (subId) {
              let status = 'PENDING';
              let attempts = 0;
              while ((status === 'PENDING' || status === 'RUNNING') && attempts < 60) {
                await new Promise(res => setTimeout(res, 1000));
                const statusResp = await fetch(`http://localhost:8081/api/submissions/${subId}`);
                if (statusResp.ok) {
                  const statusData = await statusResp.json();
                  status = statusData.status;
                }
                attempts++;
              }

              const resultsResp = await fetch(`http://localhost:8081/api/submissions/${subId}/results`);
              if (resultsResp.ok) {
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
                    attempts: 1,
                    output: formattedResults,
                    results: formattedResults.map(r => ({
                      status: r.status === 'pass' ? 'passed' : 'failed',
                      input: r.input,
                      expectedOutput: r.expectedOutput,
                      actualOutput: r.actualOutput
                    }))
                  }
                }));
                
                setCompilerOutput(prev => prev + `✓ Question ${currentQuestionIndex + 1}: ${passed}/${total} test cases passed\n`);
              }
            }
          }
        } catch (runError) {
          console.error('Auto-run error:', runError);
          setCompilerOutput(prev => prev + `⚠️ Could not auto-run Question ${currentQuestionIndex + 1}\n`);
        }
      }

      await new Promise(res => setTimeout(res, 500));

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
        copyPasteAttempts
      };

      console.log('Submitting to:', `http://localhost:8081/api/tests/link/${testToken}/submit-code`);
      console.log('Payload:', payload);

      const response = await fetch(`http://localhost:8081/api/tests/link/${testToken}/submit-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken && { 'Authorization': `Bearer ${authToken}` })
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Submit failed:', response.status, errorText);
        throw new Error(`Failed to submit test: ${response.status} - ${errorText}`);
      }

      const savedStudent = await response.json();
      console.log('Submission successful:', savedStudent);

      setCompilerOutput(prev => prev + '\n✅ Test submitted successfully!\n');

      window.history.pushState(null, '', window.location.href);
      window.addEventListener('popstate', preventBack);

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
  };

  const preventBack = (e) => {
    window.history.pushState(null, '', window.location.href);
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
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              {test.title}
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {student.name} | {student.email}
            </p>
          </div>

         <div className="relative">
  <div className={`flex items-center space-x-3 ${getTimerColor()} transition-colors duration-300`}>
    <div className="relative">
      <Clock className="w-8 h-8" />
      {timeRemaining < 300 && ( // Show pulse animation when less than 5 minutes
        <div className="absolute inset-0 animate-ping">
          <Clock className="w-8 h-8 opacity-75" />
        </div>
      )}
    </div>
    <div className="flex flex-col">
      <span className="text-3xl font-bold tracking-tight font-mono">
        {formatTime(timeRemaining)}
      </span>
      <span className="text-xs font-medium opacity-75">
        {timeRemaining < 300 ? 'HURRY UP!' : 'Time Remaining'}
      </span>
    </div>
  </div>
  
  {/* Progress bar */}
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
            <div className={`flex items-center space-x-2 ${isProctoringActive ? 'text-green-500' : 'text-red-500'}`}>
              <Camera className="w-5 h-5" />
              <Mic className="w-5 h-5" />
              <div className="w-2 h-2 rounded-full bg-current animate-pulse"></div>
            </div>
            {tabSwitchCount > 0 && (
              <div className={`flex items-center space-x-2 ${
                tabSwitchCount >= MAX_TAB_SWITCHES ? 'text-red-500' : 'text-yellow-500'
              }`}>
                <Eye className="w-5 h-5" />
                <span className="text-sm font-bold">
                  {tabSwitchCount}/{MAX_TAB_SWITCHES}
                </span>
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

      <div className="fixed bottom-4 right-4 z-50">
        <video
          ref={videoRef}
          autoPlay
          muted
          className="w-32 h-24 bg-gray-900 rounded-lg border-2 border-green-400 object-cover"
        />
      </div>

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
                    <p className="text-xs text-red-600 dark:text-red-400">
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

      {tabSwitchCount > 0 && tabSwitchCount < MAX_TAB_SWITCHES && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-40 animate-pulse">
          <div className="bg-yellow-500 text-black px-6 py-3 rounded-lg shadow-lg font-semibold">
            Warning: {MAX_TAB_SWITCHES - tabSwitchCount} tab switch{MAX_TAB_SWITCHES - tabSwitchCount !== 1 ? 'es' : ''} remaining before auto-submit!
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentTestEditor;