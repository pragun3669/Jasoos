import React, { useState } from 'react';
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

function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleNavigate = (page) => setCurrentPage(page);
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage onNavigate={handleNavigate} />;
      case 'login':
        return <LoginPage onNavigate={handleNavigate} />;
      case 'signup':
        return <SignupPage onNavigate={handleNavigate} />;
      case 'editor':
        return <CodeEditor />;
      case 'createTest':
        return (
          <ProtectedRoute>
            <CreateTest />
          </ProtectedRoute>
        );
      case 'viewTests':
        return (
          <ProtectedRoute>
            <ViewTests />
          </ProtectedRoute>
        );
      case 'settings': // ✅ Settings page
        return <SettingsPage onNavigate={handleNavigate} />;
      case 'help': // ✅ Help page
        return <HelpPage onNavigate={handleNavigate} />;
      default:
        return <HomePage onNavigate={handleNavigate} />;
    }
  };

  return (
    <ThemeProvider>
      <AuthProvider>
        <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors relative">
          {/* Sidebar */}
          <Sidebar
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
            onNavigate={handleNavigate}
          />

          {/* Main content */}
          <div className="flex flex-col min-h-screen">
            <Navbar
              currentPage={currentPage}
              onNavigate={handleNavigate}
              onToggleSidebar={toggleSidebar}
            />
            <main className="flex-1 relative z-0">{renderPage()}</main>
          </div>
        </div>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
