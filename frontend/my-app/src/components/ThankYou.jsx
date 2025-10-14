import React, { useEffect } from "react";

const ThankYou = () => {
  useEffect(() => {
    // Try closing again once page loads
    setTimeout(() => {
      window.close();
    }, 1000);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 text-center">
      <h1 className="text-2xl font-bold text-green-600 mb-4">
        ✅ Test Submitted Successfully
      </h1>
      <p className="text-gray-700">You can safely close this tab now.</p>
    </div>
  );
};

export default ThankYou;
