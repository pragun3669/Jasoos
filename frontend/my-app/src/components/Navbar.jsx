import React from 'react';
import { Moon, Sun, Shield, Users, BookOpen, LogOut, Menu } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';

const Navbar = ({ currentPage, onNavigate, onToggleSidebar }) => {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();

  return (
    <nav className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left: Menu + Logo */}
          <div className="flex items-center space-x-4">
            <button
              onClick={onToggleSidebar}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <Menu className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </button>

            <div className="flex items-center cursor-pointer" onClick={() => onNavigate('home')}>
              <img src="/Your paragraph text (1).png" alt="Jasoos Logo" className="h-10 w-auto mr-3" />
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
                  JASOOS
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400 -mt-1">AI Exam Proctoring</p>
              </div>
            </div>
          </div>

          {/* Right: Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            <button
              onClick={() => onNavigate('home')}
              className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                currentPage === 'home'
                  ? 'text-green-400 bg-green-400/10'
                  : 'text-gray-600 dark:text-gray-300 hover:text-green-400'
              }`}
            >
              <Shield className="w-4 h-4 mr-2" />
              Home
            </button>

            {!user && (
              <>
                <button
                  onClick={() => onNavigate('login')}
                  className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    currentPage === 'login'
                      ? 'text-green-400 bg-green-400/10'
                      : 'text-gray-600 dark:text-gray-300 hover:text-green-400'
                  }`}
                >
                  <Users className="w-4 h-4 mr-2" />
                  Teacher Login
                </button>
                <button
                  onClick={() => onNavigate('signup')}
                  className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    currentPage === 'signup'
                      ? 'text-green-400 bg-green-400/10'
                      : 'text-gray-600 dark:text-gray-300 hover:text-green-400'
                  }`}
                >
                  <BookOpen className="w-4 h-4 mr-2" />
                  Sign Up
                </button>
              </>
            )}

{user && (
  <div className="flex items-center space-x-2">
    <div className="px-4 py-2 rounded-lg bg-green-100 dark:bg-green-700 text-green-800 dark:text-green-200 font-medium">
      Welcome, {user.name}
    </div>
    <button
      onClick={() => {
        logout();        // Clear user & token
        onNavigate('home'); // Navigate to home page
      }}
      className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-red-500 hover:text-red-600 transition-colors"
    >
      <LogOut className="w-4 h-4 mr-1" />
      Logout
    </button>
  </div>
)}
          </div>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ml-2"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
