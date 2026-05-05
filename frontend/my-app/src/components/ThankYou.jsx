import React from "react";

const ThankYou = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 text-center px-4">
      <div className="bg-white rounded-2xl shadow-lg p-10 max-w-md w-full">
        <div className="text-6xl mb-4">✅</div>
        <h1 className="text-2xl font-bold text-green-600 mb-3">
          Test Submitted Successfully
        </h1>
        <p className="text-gray-600 mb-6">
          Your answers have been recorded. You may now close this tab.
        </p>
        <div className="bg-gray-50 border border-gray-200 rounded-lg px-6 py-4 text-sm text-gray-500">
          Press <kbd className="bg-gray-200 px-2 py-0.5 rounded font-mono text-xs">Ctrl + W</kbd> or close this tab manually.
        </div>
      </div>
    </div>
  );
};

export default ThankYou;