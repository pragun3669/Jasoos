import React, { useState } from 'react';
import { Plus, Save, Code, Trash2 } from 'lucide-react';
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
          marks: 1,
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg mb-6 p-6 flex items-center">
          <div className="bg-gradient-to-br from-green-400 to-blue-500 p-3 rounded-lg mr-4">
            <Code className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Create New Test</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Design coding challenges for your students
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Test Metadata */}
          <div className="bg-white dark:bg-gray-800 p-4 rounded-md shadow grid gap-3">
            <label className="font-semibold">Test Title</label>
            <input
              className="border px-2 py-1 rounded"
              value={formData.title}
              onChange={e => handleFieldChange('title', e.target.value)}
              placeholder="Test Title"
            />
            {errors.title && <div className="text-red-500">{errors.title}</div>}

            <label className="font-semibold">Duration (minutes)</label>
            <input
              type="number"
              className="border px-2 py-1 rounded"
              value={formData.duration}
              onChange={e => handleFieldChange('duration', e.target.value)}
              placeholder="Test Duration"
              min={1}
            />
            {errors.duration && <div className="text-red-500">{errors.duration}</div>}

            <label className="font-semibold">Number of Questions</label>
            <input
              type="number"
              className="border px-2 py-1 rounded"
              value={formData.numberOfQuestions}
              onChange={e => handleNumberOfQuestionsChange(e.target.value)}
              placeholder="Number of Questions"
              min={1}
            />
            {errors.numberOfQuestions && <div className="text-red-500">{errors.numberOfQuestions}</div>}
          </div>

          {/* Questions */}
          {formData.questions.map((q, qIdx) => (
            <div key={qIdx} className="bg-white dark:bg-gray-800 p-4 mt-6 rounded-md shadow">
              <h2 className="font-semibold text-lg text-blue-800 dark:text-blue-300">
                Question {qIdx + 1}
              </h2>
              <label className="font-semibold">Description</label>
              <textarea
                className="border px-2 py-1 rounded w-full"
                value={q.description}
                onChange={e => handleQuestionChange(qIdx, 'description', e.target.value)}
                placeholder="Question Description"
              />
              {errors[`question_${qIdx}_description`] && (
                <div className="text-red-500">{errors[`question_${qIdx}_description`]}</div>
              )}

              <label className="font-semibold">Marks</label>
              <input
                type="number"
                className="border px-2 py-1 rounded"
                value={q.marks}
                onChange={e => handleQuestionChange(qIdx, 'marks', e.target.value)}
                placeholder="Marks"
                min={1}
              />
              {errors[`question_${qIdx}_marks`] && (
                <div className="text-red-500">{errors[`question_${qIdx}_marks`]}</div>
              )}

              {/* Test Cases */}
              <div>
                <h3 className="mt-3 font-semibold">Test Cases</h3>
                {q.testCases.map((tc, tcIdx) => (
                  <div key={tcIdx} className="bg-gray-50 dark:bg-gray-700 p-2 rounded mb-2 flex flex-col gap-2">
                    <div className="flex flex-col gap-1">
                      <label>Input Data</label>
                      <input
                        className="border px-2 py-1 rounded"
                        value={tc.inputData}
                        onChange={e => handleTestCaseChange(qIdx, tcIdx, 'inputData', e.target.value)}
                        placeholder="Input Data"
                      />
                      {errors[`question_${qIdx}_tc_${tcIdx}_input`] && (
                        <div className="text-red-500">{errors[`question_${qIdx}_tc_${tcIdx}_input`]}</div>
                      )}
                    </div>
                    <div className="flex flex-col gap-1">
                      <label>Expected Output</label>
                      <input
                        className="border px-2 py-1 rounded"
                        value={tc.expectedOutput}
                        onChange={e => handleTestCaseChange(qIdx, tcIdx, 'expectedOutput', e.target.value)}
                        placeholder="Expected Output"
                      />
                      {errors[`question_${qIdx}_tc_${tcIdx}_output`] && (
                        <div className="text-red-500">{errors[`question_${qIdx}_tc_${tcIdx}_output`]}</div>
                      )}
                    </div>
                    <label className="flex items-center gap-1 mt-1">
                      <input
                        type="checkbox"
                        checked={tc.exampleCase}
                        onChange={e => handleTestCaseChange(qIdx, tcIdx, 'exampleCase', e.target.checked)}
                      />
                      Example Case
                    </label>
                    <div>
                      {q.testCases.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeTestCase(qIdx, tcIdx)}
                          className="text-red-500 flex items-center gap-1 mt-1"
                        >
                          <Trash2 className="w-4 h-4" />Remove
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {errors[`question_${qIdx}_testcases`] && (
                  <div className="text-red-500">{errors[`question_${qIdx}_testcases`]}</div>
                )}
                <button
                  type="button"
                  onClick={() => addTestCase(qIdx)}
                  className="mt-2 bg-green-500 text-white px-3 py-1 rounded flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" /> Add Test Case
                </button>
              </div>
            </div>
          ))}

          {/* Submit Button */}
          {formData.questions.length > 0 && (
            <button
              type="submit"
              disabled={isLoading}
              className="bg-gradient-to-r from-green-400 to-blue-500 text-white font-semibold px-8 py-3 rounded-lg mt-4 flex items-center disabled:opacity-50"
            >
              {isLoading ? (
                'Creating...'
              ) : (
                <>
                  <Save className="w-5 h-5 mr-2" /> Create Test
                </>
              )}
            </button>
          )}
        </form>
      </div>
    </div>
  );
};

export default CreateTest;
