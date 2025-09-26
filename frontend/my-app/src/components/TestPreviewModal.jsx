import React from 'react';
import { X, Code, FileCode } from 'lucide-react';
import { Button } from './ui/button';

const TestPreviewModal = ({ test, onClose, onOpenEditor, onOpenCodeForm }) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-4 relative shadow-lg">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-900 dark:hover:text-white"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Test Title & Duration */}
        <h1 className="text-2xl font-bold">{test.title}</h1>
        <p className="text-gray-600 dark:text-gray-300">
          Duration: {test.duration} minutes
        </p>

        {/* Action Buttons */}
        <div className="flex gap-3 mt-2 flex-wrap">
          {/* Open in Editor triggers same-page rendering */}
          {onOpenEditor && (
            <Button
              className="bg-gradient-primary hover:opacity-90 text-white font-semibold px-4 py-2 flex items-center"
              onClick={() => {
                onClose(); // first close the modal
                onOpenEditor(test); // then open editor on same page
              }}
            >
              <Code className="w-4 h-4 mr-2" /> Open in Editor
            </Button>
          )}

          {onOpenCodeForm && (
            <Button
              className="bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 flex items-center"
              onClick={() => {
                onClose();
                onOpenCodeForm(test);
              }}
            >
              <FileCode className="w-4 h-4 mr-2" /> Open in CodeForm
            </Button>
          )}
        </div>

        {/* Questions & Test Cases */}
        {test.questions?.map((q, qIdx) => (
          <div
            key={qIdx}
            className="border border-gray-200 dark:border-gray-600 rounded p-4 mt-4"
          >
            <h2 className="font-semibold text-lg">Question {qIdx + 1}</h2>
            <p>{q.description}</p>
            <p className="font-medium mt-1">Marks: {q.marks}</p>

            <div className="mt-2">
              <h3 className="font-semibold">Test Cases:</h3>
              {q.testCases?.map((tc, tcIdx) => (
                <div
                  key={tcIdx}
                  className="bg-gray-50 dark:bg-gray-700 p-2 rounded mb-2"
                >
                  <p>
                    <strong>Input:</strong> {tc.inputData}
                  </p>
                  <p>
                    <strong>Expected Output:</strong> {tc.expectedOutput}
                  </p>
                  {tc.exampleCase && (
                    <p className="text-blue-500 font-medium">Example Case</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TestPreviewModal;
