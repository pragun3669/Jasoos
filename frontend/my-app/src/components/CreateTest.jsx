import React, { useState } from 'react';
import { Plus, Save, Code, Trash2, CheckCircle, AlertCircle, Sparkles, FileCode, Clock, Hash } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const CreateTest = () => {
  const { user } = useAuth();
  const token = user?.token;

  const [formData, setFormData] = useState({
    title: '',
    duration: '',
    numberOfQuestions: '',
    questions: []
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  // Handle number of questions change
  const handleNumberOfQuestionsChange = (value) => {
    const numQuestions = parseInt(value) || 0;
    setFormData(prev => ({
      ...prev,
      numberOfQuestions: value,
      questions: Array.from({ length: numQuestions }, (_, index) => (
        prev.questions[index] || {
          id: index + 1,
          description: '',
          marks: 100,
          maxInputSize: 200000,
          complexity: 'O(N)',
          baseTimeLimit: 1.0,
          testCases: [
            { id: 1, inputData: '', expectedOutput: '', exampleCase: true }
          ]
        }
      ))
    }));
  };

  // Handle field change for test meta
  const handleFieldChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle question change
  const handleQuestionChange = (qIdx, field, value) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.map((q, idx) =>
        idx === qIdx ? { ...q, [field]: value } : q
      )
    }));
  };

  // Handle test case change
  const handleTestCaseChange = (qIdx, tcIdx, field, value) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.map((q, idx) =>
        idx === qIdx
          ? {
              ...q,
              testCases: q.testCases.map((tc, tIdx) =>
                tIdx === tcIdx ? { ...tc, [field]: value } : tc
              )
            }
          : q
      )
    }));
  };

  // Add test case
  const addTestCase = (qIdx) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.map((q, idx) =>
        idx === qIdx
          ? {
              ...q,
              testCases: [
                ...q.testCases,
                {
                  id: q.testCases.length + 1,
                  inputData: '',
                  expectedOutput: '',
                  exampleCase: false
                }
              ]
            }
          : q
      )
    }));
  };

  // Remove test case
  const removeTestCase = (qIdx, tcIdx) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.map((q, idx) =>
        idx === qIdx
          ? {
              ...q,
              testCases: q.testCases.filter((_, tIdx) => tIdx !== tcIdx)
            }
          : q
      )
    }));
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = 'Test title is required';
    if (!formData.duration || formData.duration <= 0)
      newErrors.duration = 'Duration must be greater than 0';
    if (!formData.numberOfQuestions || formData.numberOfQuestions <= 0)
      newErrors.numberOfQuestions = 'Number of questions must be greater than 0';

    formData.questions.forEach((q, qIdx) => {
      if (!q.description.trim())
        newErrors[`question_${qIdx}_description`] = 'Question description is required';
      if (!q.marks || q.marks <= 0)
        newErrors[`question_${qIdx}_marks`] = 'Marks must be greater than 0';
      if (!q.testCases.length)
        newErrors[`question_${qIdx}_testcases`] = 'At least one test case is required';

      q.testCases.forEach((tc, tcIdx) => {
        if (!tc.inputData.trim())
          newErrors[`question_${qIdx}_tc_${tcIdx}_input`] = 'Input required';
        if (!tc.expectedOutput.trim())
          newErrors[`question_${qIdx}_tc_${tcIdx}_output`] = 'Output required';
      });
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    if (!user || !token) {
      alert('You must be logged in to create a test');
      return;
    }

    setIsLoading(true);

    const payload = {
      title: formData.title,
      duration: parseInt(formData.duration),
      createdBy: user.id,
      questions: formData.questions.map(q => ({
        description: q.description,
        marks: parseInt(q.marks),
        maxInputSize: q.maxInputSize || 200000,
        complexity: q.complexity || "O(N)",
        baseTimeLimit: q.baseTimeLimit || 1.0,
        testCases: q.testCases.map(tc => ({
          inputData: tc.inputData,
          expectedOutput: tc.expectedOutput,
          exampleCase: tc.exampleCase
        }))
      }))
    };

    try {
       await axios.post('http://localhost:8081/api/tests', payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      alert('Test created successfully!');
      setFormData({
        title: '',
        duration: '',
        numberOfQuestions: '',
        questions: []
      });
      setErrors({});
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create test');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 py-8 px-4 sm:px-6 lg:px-8">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-20 w-72 h-72 bg-gradient-to-br from-emerald-400/10 to-teal-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-gradient-to-br from-blue-400/10 to-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="max-w-5xl mx-auto relative">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl mb-8 p-8 border border-gray-200 dark:border-gray-700 transform hover:scale-[1.01] transition-transform duration-300">
          <div className="flex items-center">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl blur opacity-50 animate-pulse"></div>
              <div className="relative bg-gradient-to-br from-emerald-400 to-teal-500 p-4 rounded-xl">
                <Code className="w-8 h-8 text-white" />
              </div>
            </div>
            <div className="ml-6">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                Create New Test
                <Sparkles className="w-6 h-6 text-emerald-500 animate-pulse" />
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                Design comprehensive coding challenges for your students
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Test Metadata */}
          <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 hover:shadow-2xl transition-shadow duration-300">
            <div className="flex items-center gap-3 mb-6">
              <FileCode className="w-6 h-6 text-emerald-500" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Test Configuration</h2>
            </div>
            
            <div className="space-y-6">
              {/* Test Title */}
              <div className="group">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Test Title <span className="text-red-500">*</span>
                </label>
                <input
                  className={`w-full px-4 py-3 rounded-xl border-2 ${
                    errors.title 
                      ? 'border-red-500 focus:border-red-600' 
                      : 'border-gray-300 dark:border-gray-600 focus:border-emerald-500 dark:focus:border-emerald-500'
                  } bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/20 transition-all duration-200`}
                  value={formData.title}
                  onChange={e => handleFieldChange('title', e.target.value)}
                  placeholder="e.g., Data Structures Mid-Term Exam"
                />
                {errors.title && (
                  <div className="mt-2 flex items-center gap-2 text-red-500 text-sm animate-fade-in">
                    <AlertCircle className="w-4 h-4" />
                    {errors.title}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Duration */}
                <div className="group">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-emerald-500" />
                    Duration (minutes) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    className={`w-full px-4 py-3 rounded-xl border-2 ${
                      errors.duration 
                        ? 'border-red-500 focus:border-red-600' 
                        : 'border-gray-300 dark:border-gray-600 focus:border-emerald-500 dark:focus:border-emerald-500'
                    } bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/20 transition-all duration-200`}
                    value={formData.duration}
                    onChange={e => handleFieldChange('duration', e.target.value)}
                    placeholder="60"
                    min={1}
                  />
                  {errors.duration && (
                    <div className="mt-2 flex items-center gap-2 text-red-500 text-sm animate-fade-in">
                      <AlertCircle className="w-4 h-4" />
                      {errors.duration}
                    </div>
                  )}
                </div>

                {/* Number of Questions */}
                <div className="group">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                    <Hash className="w-4 h-4 text-emerald-500" />
                    Number of Questions <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    className={`w-full px-4 py-3 rounded-xl border-2 ${
                      errors.numberOfQuestions 
                        ? 'border-red-500 focus:border-red-600' 
                        : 'border-gray-300 dark:border-gray-600 focus:border-emerald-500 dark:focus:border-emerald-500'
                    } bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/20 transition-all duration-200`}
                    value={formData.numberOfQuestions}
                    onChange={e => handleNumberOfQuestionsChange(e.target.value)}
                    placeholder="5"
                    min={1}
                  />
                  {errors.numberOfQuestions && (
                    <div className="mt-2 flex items-center gap-2 text-red-500 text-sm animate-fade-in">
                      <AlertCircle className="w-4 h-4" />
                      {errors.numberOfQuestions}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Questions */}
          {formData.questions.map((q, qIdx) => (
            <div 
              key={qIdx} 
              className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-850 p-8 rounded-2xl shadow-xl border-2 border-emerald-200 dark:border-emerald-900 hover:shadow-2xl transition-all duration-300 animate-fade-in"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-gradient-to-br from-emerald-400 to-teal-500 text-white rounded-lg w-10 h-10 flex items-center justify-center font-bold text-lg shadow-lg">
                  {qIdx + 1}
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Question {qIdx + 1}
                </h2>
              </div>

              <div className="space-y-6">
                {/* Description */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    className={`w-full px-4 py-3 rounded-xl border-2 ${
                      errors[`question_${qIdx}_description`]
                        ? 'border-red-500 focus:border-red-600'
                        : 'border-gray-300 dark:border-gray-600 focus:border-emerald-500 dark:focus:border-emerald-500'
                    } bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/20 transition-all duration-200 min-h-[120px] resize-y`}
                    value={q.description}
                    onChange={e => handleQuestionChange(qIdx, 'description', e.target.value)}
                    placeholder="Describe the problem statement, constraints, and expected output format..."
                  />
                  {errors[`question_${qIdx}_description`] && (
                    <div className="mt-2 flex items-center gap-2 text-red-500 text-sm animate-fade-in">
                      <AlertCircle className="w-4 h-4" />
                      {errors[`question_${qIdx}_description`]}
                    </div>
                  )}
                </div>

                {/* Marks */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Marks <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    className={`w-full px-4 py-3 rounded-xl border-2 ${
                      errors[`question_${qIdx}_marks`]
                        ? 'border-red-500 focus:border-red-600'
                        : 'border-gray-300 dark:border-gray-600 focus:border-emerald-500 dark:focus:border-emerald-500'
                    } bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/20 transition-all duration-200`}
                    value={q.marks}
                    onChange={e => handleQuestionChange(qIdx, 'marks', e.target.value)}
                    placeholder="100"
                    min={1}
                  />
                  {errors[`question_${qIdx}_marks`] && (
                    <div className="mt-2 flex items-center gap-2 text-red-500 text-sm animate-fade-in">
                      <AlertCircle className="w-4 h-4" />
                      {errors[`question_${qIdx}_marks`]}
                    </div>
                  )}
                </div>

                {/* Advanced Configuration */}
                <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
                    <Code className="w-4 h-4 text-emerald-500" />
                    Advanced Configuration
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                        Max Input Size
                      </label>
                      <input
                        type="number"
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all duration-200 text-sm"
                        value={q.maxInputSize}
                        onChange={e => handleQuestionChange(qIdx, 'maxInputSize', e.target.value)}
                        placeholder="200000"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                        Complexity
                      </label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all duration-200 text-sm"
                        value={q.complexity}
                        onChange={e => handleQuestionChange(qIdx, 'complexity', e.target.value)}
                        placeholder="O(N)"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                        Base Time Limit (s)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all duration-200 text-sm"
                        value={q.baseTimeLimit}
                        onChange={e => handleQuestionChange(qIdx, 'baseTimeLimit', e.target.value)}
                        placeholder="1.0"
                      />
                    </div>
                  </div>
                </div>

                {/* Test Cases */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-emerald-500" />
                    Test Cases
                  </h3>
                  <div className="space-y-4">
                    {q.testCases.map((tc, tcIdx) => (
                      <div 
                        key={tcIdx} 
                        className="bg-white dark:bg-gray-800 p-6 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-emerald-300 dark:hover:border-emerald-700 transition-all duration-300"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <div className="bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 rounded-lg px-3 py-1 text-sm font-semibold">
                              Test Case {tcIdx + 1}
                            </div>
                            {tc.exampleCase && (
                              <div className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-lg px-3 py-1 text-sm font-semibold">
                                Example
                              </div>
                            )}
                          </div>
                          {q.testCases.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeTestCase(qIdx, tcIdx)}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded-lg transition-all duration-200 group"
                            >
                              <Trash2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
                            </button>
                          )}
                        </div>

                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Input Data <span className="text-red-500">*</span>
                            </label>
                            <textarea
                              className={`w-full px-4 py-3 rounded-lg border ${
                                errors[`question_${qIdx}_tc_${tcIdx}_input`]
                                  ? 'border-red-500'
                                  : 'border-gray-300 dark:border-gray-600'
                              } bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all duration-200 min-h-[80px]`}
                              value={tc.inputData}
                              onChange={e => handleTestCaseChange(qIdx, tcIdx, 'inputData', e.target.value)}
                              placeholder="5&#10;1 2 3 4 5"
                            />
                            {errors[`question_${qIdx}_tc_${tcIdx}_input`] && (
                              <div className="mt-2 flex items-center gap-2 text-red-500 text-sm">
                                <AlertCircle className="w-4 h-4" />
                                {errors[`question_${qIdx}_tc_${tcIdx}_input`]}
                              </div>
                            )}
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Expected Output <span className="text-red-500">*</span>
                            </label>
                            <textarea
                              className={`w-full px-4 py-3 rounded-lg border ${
                                errors[`question_${qIdx}_tc_${tcIdx}_output`]
                                  ? 'border-red-500'
                                  : 'border-gray-300 dark:border-gray-600'
                              } bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all duration-200 min-h-[80px]`}
                              value={tc.expectedOutput}
                              onChange={e => handleTestCaseChange(qIdx, tcIdx, 'expectedOutput', e.target.value)}
                              placeholder="15"
                            />
                            {errors[`question_${qIdx}_tc_${tcIdx}_output`] && (
                              <div className="mt-2 flex items-center gap-2 text-red-500 text-sm">
                                <AlertCircle className="w-4 h-4" />
                                {errors[`question_${qIdx}_tc_${tcIdx}_output`]}
                              </div>
                            )}
                          </div>

                          <label className="flex items-center gap-2 cursor-pointer group">
                            <input
                              type="checkbox"
                              checked={tc.exampleCase}
                              onChange={e => handleTestCaseChange(qIdx, tcIdx, 'exampleCase', e.target.checked)}
                              className="w-5 h-5 rounded border-gray-300 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-0 transition-all"
                            />
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                              Mark as Example Test Case
                            </span>
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>

                  {errors[`question_${qIdx}_testcases`] && (
                    <div className="mt-2 flex items-center gap-2 text-red-500 text-sm">
                      <AlertCircle className="w-4 h-4" />
                      {errors[`question_${qIdx}_testcases`]}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => addTestCase(qIdx)}
                    className="mt-4 w-full bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 hover:from-emerald-100 hover:to-teal-100 dark:hover:from-emerald-900/30 dark:hover:to-teal-900/30 text-emerald-700 dark:text-emerald-300 font-semibold px-6 py-3 rounded-xl border-2 border-emerald-300 dark:border-emerald-700 hover:border-emerald-400 dark:hover:border-emerald-600 transition-all duration-300 flex items-center justify-center gap-2 group"
                  >
                    <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
                    Add Test Case
                  </button>
                </div>
              </div>
            </div>
          ))}

                    {/* Submit Button */}
{formData.questions.length > 0 && (
  <div className="pb-8">
    <button
      type="submit"
      disabled={isLoading}
      className="w-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-600 hover:via-teal-600 hover:to-cyan-600 text-white font-bold px-8 py-5 rounded-xl shadow-2xl hover:shadow-emerald-500/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 text-lg group relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
      {isLoading ? (
        <>
          <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
          Creating Test...
        </>
      ) : (
        <>
          <Save className="w-6 h-6 group-hover:scale-110 transition-transform" />
          Create Test
          <CheckCircle className="w-6 h-6 group-hover:scale-110 transition-transform" />
        </>
      )}
    </button>
  </div>
)}
        </form>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default CreateTest;