import React from 'react';
import {
  X, FileText, BarChart3, Settings, HelpCircle, Code, Shield
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Sidebar({ isOpen = false, onClose = () => {}, onNavigate = () => {} }) {
  const { user } = useAuth();

  const menuItems = [
    {
      category: 'Test Management',
      items: [
        { icon: Code, label: 'Create Test', path: '/create-test', color: 'text-green-400', auth: true },
        { icon: FileText, label: 'View Tests', path: '/view-tests', color: 'text-blue-400', auth: true }
      ]
    },
    {
      category: 'Analytics & Results',
      items: [
        { icon: BarChart3, label: 'Test Results', path: '/test-results', color: 'text-cyan-400', auth: true }
      ]
    },
    {
      category: 'System',
      items: [
        { icon: Settings, label: 'Settings', path: '/settings', color: 'text-gray-400', auth: false },
        { icon: HelpCircle, label: 'Help & Support', path: '/help', color: 'text-teal-400', auth: false }
      ]
    }
  ];

  const handleItemClick = (path) => {
    console.log(`Navigating to: ${path}`);
    onNavigate(path);
    onClose();
  };

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
        }`}
        onClick={onClose}
      />

      {/* Sidebar */}
      <div
        className={`fixed left-0 top-0 w-full max-w-xs h-screen bg-white/95 dark:bg-gray-900/95 backdrop-blur-md
          border-r border-gray-200 dark:border-gray-800 z-50 transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'} flex flex-col
        `}
      >
        {/* Header - Fixed */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800 flex-shrink-0">
          <div className="flex items-center">
            <div className="h-8 w-8 bg-gradient-to-r from-green-400 to-blue-500 rounded-lg mr-3 flex items-center justify-center">
              <span className="text-white font-bold text-sm">J</span>
            </div>
            <div>
              <h2 className="text-lg font-bold bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
                Dashboard
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">Teacher Panel</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Navigation - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
          <nav className="space-y-6">
            {menuItems.map((category, idx) => (
              <div key={idx}>
                <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 px-3">
                  {category.category}
                </h3>
                <div className="space-y-1">
                  {category.items.map((item, i) => {
                    // Show item only if auth=true and user exists
                    if (item.auth && !user) return null;
                    const Icon = item.icon;
                    return (
                      <button
                        key={i}
                        onClick={() => handleItemClick(item.path)}
                        className="flex w-full items-center px-3 py-3 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 group"
                      >
                        <div className={`p-2 rounded-lg ${item.color} bg-opacity-10 mr-3 group-hover:scale-110 transition-transform`}>
                          <Icon className={`w-4 h-4 ${item.color}`} />
                        </div>
                        <span className="font-medium">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Quick Stats */}
            <div className="pt-4">
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 px-3">
                Quick Stats
              </h3>
              <div className="space-y-2 px-3">
                <div className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-3 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-green-800 dark:text-green-200">Active Tests</span>
                    <span className="text-lg font-bold text-green-600 dark:text-green-400">12</span>
                  </div>
                </div>
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-3 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-blue-800 dark:text-blue-200">Students Online</span>
                    <span className="text-lg font-bold text-blue-600 dark:text-blue-400">48</span>
                  </div>
                </div>
                <div className="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 p-3 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-purple-800 dark:text-purple-200">Violations</span>
                    <span className="text-lg font-bold text-purple-600 dark:text-purple-400">3</span>
                  </div>
                </div>
              </div>
            </div>
          </nav>
        </div>

        {/* Footer - Fixed */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-800 flex-shrink-0">
          <div className="bg-gradient-to-r from-green-400/10 to-blue-500/10 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <Shield className="w-5 h-5 text-green-400 mr-2" />
              <span className="font-semibold text-gray-900 dark:text-white">AI Proctoring</span>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
              Advanced monitoring active for all tests
            </p>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse mr-2"></div>
                <span className="text-xs text-green-400 font-medium">Online</span>
              </div>
              <span className="text-xs text-gray-500">v2.1.0</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
