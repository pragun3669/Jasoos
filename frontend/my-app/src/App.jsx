import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import HomePage from './components/HomePage';
import LoginPage from './components/LoginPage';
import SignupPage from './components/SignupPage';
import CodeEditor from './components/CodeEditor';
import CreateTest from './components/CreateTest';
import ViewTests from './components/ViewTests'; 
import SettingsPage from './components/SettingsPage';
import HelpPage from './components/HelpPage';
import StudentPage from './components/StudentPage';
import DeviceCheck from './components/DeviceCheck';
import StudentTestEditor from './components/StudentTestEditor';
import TestComplete from './components/TestComplete';
import TeacherTestResultsPage from './components/TeacherTestResultsPage';
import ThankYou from './components/ThankYou';


function AppContent() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigate = (path, state = null) => {
    // Ensure path starts with /
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    navigate(normalizedPath, { state });
    setIsSidebarOpen(false);
  };

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  // Pages where Navbar + Sidebar should be hidden
  const isEditorPage = location.pathname === '/editor';
  const isDeviceCheck = location.pathname === '/device-check';
  const isStudentTestEditor = location.pathname === '/studenttesteditor';
  const isTestComplete = location.pathname === '/test-complete';
  const isTestPage = location.pathname.startsWith('/test/');
  const isStudentPage = location.pathname.startsWith('/student/');
  const isThankYou=location.pathname.startsWith('/thank-you');
  const hideLayout = isEditorPage || isDeviceCheck || isStudentTestEditor || isTestComplete || isThankYou || isTestPage || isStudentPage;

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors relative">
      {!hideLayout && (
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          onNavigate={handleNavigate}
        />
      )}

      <div className="flex flex-col min-h-screen">
        {!hideLayout && (
          <Navbar
            onNavigate={handleNavigate}
            onToggleSidebar={toggleSidebar}
          />
        )}
        
        <main className="flex-1 relative z-0">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<HomePage onNavigate={handleNavigate} />} />
            <Route path="/login" element={<LoginPage onNavigate={handleNavigate} />} />
            <Route path="/signup" element={<SignupPage onNavigate={handleNavigate} />} />
            <Route path="/help" element={<HelpPage onNavigate={handleNavigate} />} />
            <Route path="/student/:token" element={<StudentPage />} />
            <Route path="/test/:token" element={<StudentPage />} />
            <Route path="/device-check" element={<DeviceCheck />} />
            <Route path="/studenttesteditor" element={<StudentTestEditor />} />
            <Route path="/test-complete" element={<TestComplete />} />
            <Route path="/thank-you" element={<ThankYou />} />
            {/* Protected Routes */}
            <Route 
              path="/editor" 
              element={
                <ProtectedRoute>
                  <CodeEditor onNavigate={handleNavigate} />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/create-test" 
              element={
                <ProtectedRoute>
                  <CreateTest onNavigate={handleNavigate} />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/view-tests" 
              element={
                <ProtectedRoute>
                  <ViewTests onNavigate={handleNavigate} />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/settings" 
              element={
                <ProtectedRoute>
                  <SettingsPage onNavigate={handleNavigate} />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/test-templates" 
              element={
                <ProtectedRoute>
                  <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                    <p className="text-gray-600 dark:text-gray-400">Test Templates - Coming Soon</p>
                  </div>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/schedule-tests" 
              element={
                <ProtectedRoute>
                  <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                    <p className="text-gray-600 dark:text-gray-400">Schedule Tests - Coming Soon</p>
                  </div>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/test-results" 
              element={
                <ProtectedRoute>
                  <TeacherTestResultsPage onNavigate={handleNavigate} />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/analytics" 
              element={
                <ProtectedRoute>
                  <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                    <p className="text-gray-600 dark:text-gray-400">Analytics - Coming Soon</p>
                  </div>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/student-reports" 
              element={
                <ProtectedRoute>
                  <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                    <p className="text-gray-600 dark:text-gray-400">Student Reports - Coming Soon</p>
                  </div>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/live-monitoring" 
              element={
                <ProtectedRoute>
                  <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                    <p className="text-gray-600 dark:text-gray-400">Live Monitoring - Coming Soon</p>
                  </div>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/violation-reports" 
              element={
                <ProtectedRoute>
                  <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                    <p className="text-gray-600 dark:text-gray-400">Violation Reports - Coming Soon</p>
                  </div>
                </ProtectedRoute>
              } 
            />

            {/* Catch-all route */}
            <Route path="*" element={<HomePage onNavigate={handleNavigate} />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <AppContent />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;