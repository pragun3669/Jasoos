import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { CheckCircle, Eye, Shield } from 'lucide-react';

const TestComplete = () => {
  const location = useLocation();
  const { test, student, questionStatuses, tabSwitchCount, copyPasteAttempts } = location.state || {};
  const [showConfetti, setShowConfetti] = useState(true);

  useEffect(() => {
    // ✅ Prevent going back
    window.history.pushState(null, null, window.location.href);
    const handleBackButton = () => {
      window.history.pushState(null, null, window.location.href);
      alert("You cannot go back after submitting the test!");
    };
    window.addEventListener("popstate", handleBackButton);

    // ✅ Hide confetti after 3s
    const timer = setTimeout(() => setShowConfetti(false), 3000);

    return () => {
      window.removeEventListener("popstate", handleBackButton);
      clearTimeout(timer);
    };
  }, []);

  const attemptedQuestions = Object.keys(questionStatuses || {}).length;
  const totalQuestions = test?.questions?.length || 0;

  // ✅ Close window safely
  const handleCloseWindow = () => {
    if (window.opener) {
      window.close(); // works if tab was opened via window.open
    } else {
      // fallback: go to thank-you page
      window.location.href = "/thank-you";
    }
  };
  

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      {/* Confetti Effect */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-fall"
              style={{
                left: `${Math.random() * 100}%`,
                top: `-20px`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 2}s`
              }}
            >
              <div
                className="w-2 h-2 rounded-full"
                style={{
                  backgroundColor: ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444'][Math.floor(Math.random() * 5)]
                }}
              />
            </div>
          ))}
        </div>
      )}

      <div className="max-w-2xl w-full">
        {/* Main Success Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden">
          {/* Header with Success Icon */}
          <div className="bg-gradient-to-r from-green-400 to-blue-500 p-8 text-center">
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg animate-bounce">
              <CheckCircle className="w-16 h-16 text-green-500" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
              Test Submitted Successfully!
            </h1>
            <p className="text-white/90 text-lg">
              Thank you for taking the test, {student?.name || 'Student'}
            </p>
          </div>

          {/* Content */}
          <div className="p-8">
            {/* Submission Summary */}
            {test && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Submission Summary
                </h2>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Test Name:</span>
                    <span className="font-semibold text-gray-900 dark:text-white">{test.title}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Questions Attempted:</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {attemptedQuestions}/{totalQuestions}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Submitted At:</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {new Date().toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Student Email:</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {student?.email || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Proctoring Summary */}
            {(tabSwitchCount > 0 || copyPasteAttempts > 0) && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Proctoring Summary
                </h2>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 space-y-3">
                  {tabSwitchCount > 0 && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Eye className="w-5 h-5 text-yellow-500" />
                        <span className="text-gray-600 dark:text-gray-400">Tab Switches:</span>
                      </div>
                      <span className={`font-semibold ${
                        tabSwitchCount >= 5 ? 'text-red-500' : 'text-yellow-500'
                      }`}>
                        {tabSwitchCount}
                      </span>
                    </div>
                  )}
                  {copyPasteAttempts > 0 && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Shield className="w-5 h-5 text-red-500" />
                        <span className="text-gray-600 dark:text-gray-400">Copy/Paste Attempts:</span>
                      </div>
                      <span className="font-semibold text-red-500">
                        {copyPasteAttempts}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Next Steps */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-6">
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                What happens next?
              </h3>
              <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Your answers have been submitted and saved successfully</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Results will be evaluated and shared with you via email</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>You can safely close this window now</span>
                </li>
              </ul>
            </div>

            {/* Close Window Button */}
            <div className="text-center">
              <button
                onClick={handleCloseWindow}
                className="bg-gradient-to-r from-green-400 to-blue-500 hover:from-green-500 hover:to-blue-600 text-white font-semibold px-8 py-4 rounded-lg transition-all hover:scale-105 shadow-lg"
              >
                Close Window
              </button>
              <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                You can safely close this tab or window
              </p>
            </div>
          </div>
        </div>

        {/* Footer Message */}
        <div className="mt-6 text-center">
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Thank you for your time and effort. Good luck with your results!
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes fall {
          to {
            transform: translateY(100vh) rotate(360deg);
          }
        }
        .animate-fall {
          animation: fall linear forwards;
        }
      `}</style>
    </div>
  );
};

export default TestComplete;
