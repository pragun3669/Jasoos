import React, { useState, useEffect, useRef } from 'react';
import { Editor } from '@monaco-editor/react';
import { 
  Play, 
  Save, 
  RotateCcw, 
  Settings, 
  ChevronDown, 
  Plus,
  Terminal,
  CheckCircle,
  XCircle,
  Clock,
  X
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const CodeEditor = ({ test, selectedQuestionIndex = 0, onClose }) => {
  const { theme } = useTheme();
  const editorRef = useRef(null);
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(selectedQuestionIndex);
  const [selectedLanguage, setSelectedLanguage] = useState('javascript');
  const [code, setCode] = useState('');
  const [activeTab, setActiveTab] = useState('testcase');
  const [testCases, setTestCases] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState(null);

  const languages = [
    { id: 'javascript', name: 'JavaScript', extension: 'js' },
    { id: 'python', name: 'Python', extension: 'py' },
    { id: 'java', name: 'Java', extension: 'java' },
    { id: 'cpp', name: 'C++', extension: 'cpp' },
    { id: 'c', name: 'C', extension: 'c' },
    { id: 'csharp', name: 'C#', extension: 'cs' },
    { id: 'go', name: 'Go', extension: 'go' },
    { id: 'rust', name: 'Rust', extension: 'rs' }
  ];

  useEffect(() => {
    if (test && test.questions && test.questions.length > 0) {
      const question = test.questions[currentQuestionIndex];
      const language = question.language || 'javascript';
      setSelectedLanguage(language);
      setCode(getDefaultCode(language));
      
      // Convert backend test cases to frontend format
      const formattedTestCases = question.testCases?.map((tc, index) => ({
        id: index + 1,
        input: tc.inputData || '',
        output: tc.expectedOutput || '',
        active: index === 0,
        isExample: tc.exampleCase || false
      })) || [];
      
      setTestCases(formattedTestCases);
    }
  }, [test, currentQuestionIndex]);

  function getDefaultCode(language) {
    const templates = {
      javascript: `/**
 * @param {string} input
 * @return {string}
 */
function solution(input) {
    // Your code here
    
}`,
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
};`,
      c: `#include <stdio.h>
#include <string.h>

char* solution(char* input) {
    // Your code here
    
}`,
      csharp: `using System;

public class Solution {
    public string Solution(string input) {
        // Your code here
        
    }
}`,
      go: `package main

import "fmt"

func solution(input string) string {
    // Your code here
    
}`,
      rust: `impl Solution {
    pub fn solution(input: String) -> String {
        // Your code here
        
    }
}`
    };
    return templates[language] || templates.javascript;
  }

  const handleLanguageChange = (language) => {
    setSelectedLanguage(language);
    setCode(getDefaultCode(language));
  };

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    
    // Configure Monaco themes
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

  const handleRunCode = async () => {
    setIsRunning(true);
    // Simulate code execution
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setResults({
      status: 'success',
      runtime: '52 ms',
      memory: '14.2 MB',
      testsPassed: testCases.length,
      totalTests: testCases.length,
      output: testCases[0]?.output || 'No output'
    });
    setIsRunning(false);
    setActiveTab('result');
  };

  const handleSave = () => {
    localStorage.setItem('jasoos-code', JSON.stringify({
      language: selectedLanguage,
      code: code,
      questionIndex: currentQuestionIndex
    }));
    alert('Code saved successfully!');
  };

  const handleReset = () => {
    setCode(getDefaultCode(selectedLanguage));
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
      {/* Header with Close Button */}
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
        {/* Question Navigation */}
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
          {/* Problem Description */}
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

          {/* Code Editor */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
            {/* Editor Header */}
            <div className="border-b border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <span className="text-lg font-semibold text-gray-900 dark:text-white">Code</span>
                  
                  {/* Language Selector */}
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

                {/* Editor Actions */}
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

            {/* Monaco Editor */}
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

            {/* Editor Footer */}
            <div className="border-t border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Saved • Ln 1, Col 1
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleRunCode}
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
                  <button className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-semibold px-4 py-2 rounded-lg transition-all hover:scale-105">
                    Submit
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Test Cases and Results */}
        <div className="mt-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
          {/* Tabs */}
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

          {/* Tab Content */}
          <div className="p-4">
            {activeTab === 'testcase' && (
              <div>
                {/* Test Case Tabs */}
                <div className="flex items-center space-x-2 mb-4 overflow-x-auto">
                  {testCases.map((testCase, index) => (
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
                      {testCase.isExample && (
                        <span className="ml-1 text-xs bg-blue-500 text-white px-1 rounded">Ex</span>
                      )}
                    </button>
                  ))}
                </div>

                {/* Active Test Case */}
                {testCases.filter(tc => tc.active).map(testCase => (
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
                {results ? (
                  <div className="space-y-4">
                    {/* Status */}
                    <div className="flex items-center space-x-2">
                      {results.status === 'success' ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-500" />
                      )}
                      <span className={`font-semibold ${
                        results.status === 'success' ? 'text-green-500' : 'text-red-500'
                      }`}>
                        {results.status === 'success' ? 'Accepted' : 'Wrong Answer'}
                      </span>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                        <div className="text-sm text-gray-600 dark:text-gray-400">Runtime</div>
                        <div className="font-semibold text-gray-900 dark:text-white">{results.runtime}</div>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                        <div className="text-sm text-gray-600 dark:text-gray-400">Memory</div>
                        <div className="font-semibold text-gray-900 dark:text-white">{results.memory}</div>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                        <div className="text-sm text-gray-600 dark:text-gray-400">Test Cases</div>
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {results.testsPassed}/{results.totalTests}
                        </div>
                      </div>
                    </div>

                    {/* Output */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Output:
                      </label>
                      <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg font-mono text-sm text-gray-900 dark:text-white">
                        {results.output}
                      </div>
                    </div>
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
      </div>
    </div>
  );
};

export default CodeEditor;