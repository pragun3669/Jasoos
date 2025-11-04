import React from 'react';
import { 
  X, 
  Code, 
  FileCode, 
  Clock, 
  Hash, 
  CheckCircle, 
  Play,
  Eye,
  Calendar,
  User
} from 'lucide-react';

const TestPreviewModal = ({ test, onClose, onOpenEditor, onOpenCodeForm }) => {
  const getGradientClass = (index) => {
    const gradients = [
      'from-green-50 to-blue-50 dark:from-gray-800 dark:to-gray-700',
      'from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-700',
      'from-purple-50 to-pink-50 dark:from-gray-800 dark:to-gray-700',
      'from-orange-50 to-red-50 dark:from-gray-800 dark:to-gray-700',
      'from-teal-50 to-cyan-50 dark:from-gray-800 dark:to-gray-700',
      'from-indigo-50 to-blue-50 dark:from-gray-800 dark:to-gray-700'
    ];
    return gradients[index % gradients.length];
  };

  const getIconColor = (index) => {
    const colors = [
      'bg-green-400',
      'bg-blue-500',
      'bg-purple-500',
      'bg-orange-500',
      'bg-teal-500',
      'bg-indigo-500'
    ];
    return colors[index % colors.length];
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
      <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-md rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden shadow-2xl border border-gray-200 dark:border-gray-700 animate-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="relative bg-gradient-to-r from-green-400/10 to-blue-500/10 dark:from-green-400/5 dark:to-blue-500/5 p-6 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="pr-12">
            <div className="flex items-center mb-3">
              <div className="bg-gradient-to-r from-green-400 to-blue-500 p-3 rounded-xl mr-4">
                <Eye className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                  {test.title}
                </h1>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Test Preview & Management
                </p>
              </div>
            </div>

            {/* Test Metadata */}
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <div className="flex items-center text-gray-600 dark:text-gray-400">
                <Clock className="w-4 h-4 mr-2" />
                <span className="font-medium">{test.duration} minutes</span>
              </div>
              <div className="flex items-center text-gray-600 dark:text-gray-400">
                <Hash className="w-4 h-4 mr-2" />
                <span className="font-medium">{test.questions?.length || 0} questions</span>
              </div>
              <div className="flex items-center text-gray-600 dark:text-gray-400">
                <Calendar className="w-4 h-4 mr-2" />
                <span className="font-medium">
                  Created: {test.createdDate ? new Date(test.createdDate).toLocaleDateString() : 'Today'}
                </span>
              </div>
              {test.createdBy && (
                <div className="flex items-center text-gray-600 dark:text-gray-400">
                  <User className="w-4 h-4 mr-2" />
                  <span className="font-medium">Teacher ID: {test.createdBy}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
          <div className="flex flex-wrap gap-3">
            {onOpenEditor && (
              <button
                className="bg-gradient-to-r from-green-400 to-blue-500 hover:from-green-500 hover:to-blue-600 text-white font-semibold px-6 py-3 rounded-lg transition-all duration-200 hover:scale-105 flex items-center shadow-lg"
                onClick={() => {
                  onClose();
                  onOpenEditor(test);
                }}
              >
                <Code className="w-5 h-5 mr-2" />
                Open in Editor
              </button>
            )}

            {onOpenCodeForm && (
              <button
                className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-3 rounded-lg transition-all duration-200 hover:scale-105 flex items-center shadow-lg"
                onClick={() => {
                  onClose();
                  onOpenCodeForm(test);
                }}
              >
                <FileCode className="w-5 h-5 mr-2" />
                Open in CodeForm
              </button>
            )}

          </div>
        </div>

        {/* Questions Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {test.questions && test.questions.length > 0 ? (
            <div className="space-y-6">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Questions Overview
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Review all questions and test cases before starting the assessment
                </p>
              </div>

              {test.questions.map((question, questionIndex) => (
                <div
                  key={questionIndex}
                  className={`bg-gradient-to-br ${getGradientClass(questionIndex)} rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-all duration-300`}
                >
                  {/* Question Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center">
                      <div className={`p-3 rounded-lg ${getIconColor(questionIndex)} mr-4`}>
                        <Hash className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          Question {questionIndex + 1}
                        </h3>
                        <div className="flex items-center mt-1 space-x-3">
                          <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm font-medium">
                            {question.marks} marks
                          </span>
                          <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded-full text-sm font-medium">
                            {question.testCases?.length || 0} test cases
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Question Description */}
                  <div className="mb-6">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">Description:</h4>
                    <div className="bg-white/70 dark:bg-gray-800/70 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                      <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                        {question.description}
                      </p>
                    </div>
                  </div>

                  {/* Test Cases */}
                  {question.testCases && question.testCases.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center">
                        <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                        Test Cases:
                      </h4>
                      <div className="space-y-3">
                        {question.testCases.map((testCase, testCaseIndex) => (
                          <div
                            key={testCaseIndex}
                            className="bg-white/70 dark:bg-gray-800/70 rounded-lg p-4 border border-gray-200 dark:border-gray-600"
                          >
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Test Case {testCaseIndex + 1}
                              </span>
                              {testCase.exampleCase && (
                                <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full text-xs font-medium flex items-center">
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Example
                                </span>
                              )}
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                  Input:
                                </label>
                                <code className="block bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 p-2 rounded text-sm font-mono border">
                                  {testCase.inputData}
                                </code>
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                  Expected Output:
                                </label>
                                <code className="block bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 p-2 rounded text-sm font-mono border">
                                  {testCase.expectedOutput}
                                </code>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <Hash className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No Questions Available
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                This test doesn't have any questions configured yet.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <p>Ready to start this assessment?</p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              >
                Close Preview
              </button>
              {onOpenEditor && (
                <button
                  className="bg-gradient-to-r from-green-400 to-blue-500 hover:from-green-500 hover:to-blue-600 text-white font-semibold px-6 py-2 rounded-lg transition-all duration-200 hover:scale-105"
                  onClick={() => {
                    onClose();
                    onOpenEditor(test);
                  }}
                >
                  Start Coding
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestPreviewModal;