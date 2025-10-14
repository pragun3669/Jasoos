import React, { useState, useEffect, useRef } from 'react';
import { Editor } from '@monaco-editor/react';
import { 
  Play, 
  Save, 
  RotateCcw, 
  ChevronDown,
  Terminal,
  CheckCircle,
  XCircle,
  Clock,
  X
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';

const CodeEditor = ({ test, selectedQuestionIndex = 0, onClose }) => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const token = user?.token;
  const editorRef = useRef(null);
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(selectedQuestionIndex);
  const [selectedLanguage, setSelectedLanguage] = useState('python');
  const [code, setCode] = useState('');
  const [activeTab, setActiveTab] = useState('testcase');
  const [testCases, setTestCases] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState(null);
  const [submissionId, setSubmissionId] = useState(null);
  const [submissionStatus, setSubmissionStatus] = useState('pending');
  const [compilerOutput, setCompilerOutput] = useState('');
  const [testResults, setTestResults] = useState([]);

  const languages = [
    { id: 'python', name: 'Python', extension: 'py' },
    { id: 'java', name: 'Java', extension: 'java' },
    { id: 'cpp', name: 'C++', extension: 'cpp' }
  ];

  useEffect(() => {
    if (test && test.questions && test.questions.length > 0) {
      const question = test.questions[currentQuestionIndex];
      const language = question.language || 'python';
      setSelectedLanguage(language);
      setCode(getDefaultCode(language));
      
      const formattedTestCases = question.testCases?.map((tc, index) => ({
        id: index + 1,
        input: tc.inputData || '',
        output: tc.expectedOutput || '',
        active: index === 0,
        isExample: tc.exampleCase || false
      })) || [];
      
      setTestCases(formattedTestCases);
      setResults(null);
      setSubmissionId(null);
      setSubmissionStatus('pending');
      setCompilerOutput('');
      setTestResults([]);
    }
  }, [test, currentQuestionIndex]);

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
    
    monaco.editor.defineTheme('jasoos-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6A9955' },
        { token: 'keyword', foreground: '569CD6' },
        { token: 'string', foreground: 'CE9178' },
        { token: 'number', foreground: 'B5CEA8' },
        { token: 'type', foreground: '4EC9B0' },
        { token: 'function', foreground: 'DCDCAA' }
      ],
      colors: {
        'editor.background': '#1a1a1a',
        'editor.foreground': '#d4d4d4',
        'editorLineNumber.foreground': '#858585',
        'editor.selectionBackground': '#264f78',
        'editor.inactiveSelectionBackground': '#3a3d41'
      }
    });

    monaco.editor.defineTheme('jasoos-light', {
      base: 'vs',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '008000' },
        { token: 'keyword', foreground: '0000FF' },
        { token: 'string', foreground: 'A31515' },
        { token: 'number', foreground: '098658' },
        { token: 'type', foreground: '267F99' },
        { token: 'function', foreground: '795E26' }
      ],
      colors: {
        'editor.background': '#ffffff',
        'editor.foreground': '#000000',
        'editorLineNumber.foreground': '#237893',
        'editor.selectionBackground': '#ADD6FF',
        'editor.inactiveSelectionBackground': '#E5EBF1'
      }
    });
  };

  const handleRunCode = async (runAll = false) => {
    if (!user) {
      setCompilerOutput('⚠️ Error: Please login first to run code.');
      return;
    }

    if (!test?.id || !user?.id || !token) {
      setCompilerOutput('⚠️ Error: Missing test ID, user ID, or token.');
      return;
    }

    setIsRunning(true);
    setActiveTab('result');
    setCompilerOutput(runAll ? '🔄 Submitting all test cases...\n' : '🔄 Running example test cases...\n');
    setTestResults([]);

    try {
      const question = test.questions[currentQuestionIndex];
      if (!question) throw new Error('Question data missing');

      const extMap = { python: 'py', java: 'java', cpp: 'cpp' };
      const filename = `Solution.${extMap[selectedLanguage] || 'txt'}`;

      const body = {
        language: selectedLanguage,
        source: code,
        filename: filename,
        stdin: '',
        questionId: question.id,
        studentId: user.id
      };

      const submissionResp = await fetch(
        `http://localhost:8081/api/submissions?testId=${test.id}&studentId=${user.id}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
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

      setSubmissionId(subId);
      setSubmissionStatus('running');
      setCompilerOutput('✓ Code submitted successfully\n🔄 Waiting for results...\n');

      let status = 'PENDING';
      let attempts = 0;
      while ((status === 'PENDING' || status === 'RUNNING') && attempts < 60) {
        await new Promise(res => setTimeout(res, 1000));
        const statusResp = await fetch(`http://localhost:8081/api/submissions/${subId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!statusResp.ok) throw new Error('Failed to fetch submission status');
        const statusData = await statusResp.json();
        status = statusData.status;
        setSubmissionStatus(status);
        attempts++;
      }

      const resultsResp = await fetch(`http://localhost:8081/api/submissions/${subId}/results`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

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

      let output = '═══════════════════════════════════════════════\n';
      output += `  TEST RESULTS: ${passed}/${total} Test Cases Passed\n`;
      output += '═══════════════════════════════════════════════\n\n';

      formattedResults.forEach((r) => {
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

      setResults({
        status: passed === total ? 'success' : 'error',
        runtime: '52 ms',
        memory: '14.2 MB',
        testsPassed: passed,
        totalTests: total,
        output: formattedResults[0]?.actualOutput || 'No output'
      });

    } catch (err) {
      console.error(err);
      setCompilerOutput(`⚠️ ERROR: ${err.message}\n\nCheck your code and try again.`);
    } finally {
      setIsRunning(false);
    }
  };

  const handleSave = () => {
    const saved = {
      language: selectedLanguage,
      code: code,
      questionIndex: currentQuestionIndex
    };
    localStorage.setItem('jasoos-code', JSON.stringify(saved));
    setCompilerOutput('✓ Code saved successfully to local storage.\n');
  };

  const handleReset = () => {
    setCode(getDefaultCode(selectedLanguage));
    setCompilerOutput('✓ Code reset to default template.\n');
  };

  const handleQuestionChange = (index) => {
    setCurrentQuestionIndex(index);
  };

  if (!test) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg text-gray-600 dark:text-gray-400">Loading test...</p>
        </div>
      </div>
    );
  }

  const currentQuestion = test.questions[currentQuestionIndex];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {test.title}
            </h1>
            <div className="flex items-center space-x-4 mt-1">
              <span className="text-gray-600 dark:text-gray-400 text-sm">
                Duration: {test.duration} minutes
              </span>
              <span className="text-gray-600 dark:text-gray-400 text-sm">
                Question {currentQuestionIndex + 1} of {test.questions.length}
              </span>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4">
        {test.questions.length > 1 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg mb-4 p-4">
            <div className="flex items-center space-x-2 overflow-x-auto">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap mr-4">
                Questions:
              </span>
              {test.questions.map((_, index) => (
                <button
                  key={index}
                  onClick={() => handleQuestionChange(index)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                    index === currentQuestionIndex
                      ? 'bg-green-400 text-black'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  Q{index + 1}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="mb-6">
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

                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleSave}
                    className="p-2 text-gray-600 dark:text-gray-400 hover:text-green-400 transition-colors"
                    title="Save"
                  >
                    <Save className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleReset}
                    className="p-2 text-gray-600 dark:text-gray-400 hover:text-green-400 transition-colors"
                    title="Reset"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="h-96">
              <Editor
                height="100%"
                language={selectedLanguage}
                value={code}
                onChange={(value) => setCode(value || '')}
                onMount={handleEditorDidMount}
                theme={theme === 'dark' ? 'jasoos-dark' : 'jasoos-light'}
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  lineNumbers: 'on',
                  roundedSelection: false,
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  tabSize: 2,
                  wordWrap: 'on'
                }}
              />
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Status: {submissionStatus}
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleRunCode(false)}
                    disabled={isRunning}
                    className="bg-green-400 hover:bg-green-500 disabled:opacity-50 text-black font-semibold px-4 py-2 rounded-lg transition-all hover:scale-105 disabled:hover:scale-100 flex items-center"
                  >
                    {isRunning ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black mr-2"></div>
                        Running...
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 mr-2" />
                        Run
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => handleRunCode(true)}
                    disabled={isRunning}
                    className="bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white font-semibold px-4 py-2 rounded-lg transition-all hover:scale-105 disabled:hover:scale-100"
                  >
                    Submit
                  </button>
                </div>
              </div>
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
    </div>
  );
};

export default CodeEditor;