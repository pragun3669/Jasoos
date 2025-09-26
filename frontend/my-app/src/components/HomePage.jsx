import React from 'react';
import { Shield, Eye, Brain, Lock, ChevronRight, Play, Users, BarChart3, Zap } from 'lucide-react';

const HomePage = ({ onNavigate }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-black">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-green-400/20 to-blue-500/20 dark:from-green-400/10 dark:to-blue-500/10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <div className="mb-8">
              <img 
                src="/Your paragraph text (1).png" 
                alt="Jasoos Logo" 
                className="h-20 w-auto mx-auto mb-6"
              />
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
              AI-Powered
              <span className="bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent block">
                Exam Proctoring
              </span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
              Secure, intelligent, and seamless online examination monitoring. 
              Empower educators with cutting-edge AI technology for fair and reliable assessments.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => onNavigate('login')}
                className="bg-white/10 hover:bg-white/20 text-gray-900 dark:text-white font-semibold px-8 py-4 rounded-lg border border-gray-300 dark:border-gray-600 transition-all hover:scale-105"
              >
                <Play className="w-5 h-5 inline mr-2" />
                Teacher Login
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Advanced Proctoring Features
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Comprehensive AI monitoring ensures academic integrity while maintaining student comfort
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature Cards */}
            <div className="bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-800 dark:to-gray-700 p-8 rounded-xl shadow-lg hover:shadow-xl transition-all">
              <div className="bg-green-400 p-3 rounded-lg w-fit mb-4">
                <Eye className="w-8 h-8 text-black" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                Real-time Monitoring
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Advanced computer vision tracks eye movement, facial expressions, and suspicious behavior in real-time.
              </p>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-700 p-8 rounded-xl shadow-lg hover:shadow-xl transition-all">
              <div className="bg-blue-500 p-3 rounded-lg w-fit mb-4">
                <Brain className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                AI Analysis
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Machine learning algorithms detect patterns and anomalies to identify potential cheating attempts.
              </p>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-800 dark:to-gray-700 p-8 rounded-xl shadow-lg hover:shadow-xl transition-all">
              <div className="bg-purple-500 p-3 rounded-lg w-fit mb-4">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                Secure Environment
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Browser lockdown and system monitoring prevent unauthorized access during examinations.
              </p>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-gray-800 dark:to-gray-700 p-8 rounded-xl shadow-lg hover:shadow-xl transition-all">
              <div className="bg-orange-500 p-3 rounded-lg w-fit mb-4">
                <Lock className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                Data Protection
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Enterprise-grade encryption and privacy controls protect student data and exam content.
              </p>
            </div>

            <div className="bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-gray-800 dark:to-gray-700 p-8 rounded-xl shadow-lg hover:shadow-xl transition-all">
              <div className="bg-teal-500 p-3 rounded-lg w-fit mb-4">
                <BarChart3 className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                Detailed Reports
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Comprehensive analytics and incident reports help educators make informed decisions.
              </p>
            </div>

            <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-gray-800 dark:to-gray-700 p-8 rounded-xl shadow-lg hover:shadow-xl transition-all">
              <div className="bg-indigo-500 p-3 rounded-lg w-fit mb-4">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                Easy Integration
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Seamlessly integrate with existing LMS platforms and examination systems.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-24 bg-gradient-to-r from-green-400 to-blue-500">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-black mb-6">
            Ready to Secure Your Exams?
          </h2>
          <p className="text-xl text-black/80 mb-8">
            Join thousands of educators who trust Jasoos:AI for their online examinations
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => onNavigate('signup')}
              className="bg-black hover:bg-gray-800 text-white font-semibold px-8 py-4 rounded-lg transition-all hover:scale-105"
            >
              Create Account
            </button>
            <button
              onClick={() => onNavigate('login')}
              className="bg-white/20 hover:bg-white/30 text-black font-semibold px-8 py-4 rounded-lg transition-all hover:scale-105"
            >
              <Users className="w-5 h-5 inline mr-2" />
              Teacher Login
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 dark:bg-black text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <img 
              src="/Your paragraph text (1).png" 
              alt="Jasoos Logo" 
              className="h-12 w-auto mx-auto mb-4"
            />
            <p className="text-gray-400 mb-4">
              AI-Powered Exam Proctoring Platform
            </p>
            <p className="text-gray-500 text-sm">
              © 2025 Jasoos:AI. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
