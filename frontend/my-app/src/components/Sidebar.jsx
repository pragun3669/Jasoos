import React from 'react';
import {
  X, FileText, BarChart3, Settings, HelpCircle, Code, Shield, Eye
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Sidebar({ isOpen = false, onClose = () => {}, onNavigate = () => {} }) {
  const { user } = useAuth();

  const menuItems = [
    {
      category: 'Test Management',
      items: [
        { icon: Code,     label: 'Create Test',        path: '/create-test', color: 'emerald', auth: true  },
        { icon: FileText, label: 'View Tests',          path: '/view-tests',  color: 'blue',    auth: true  },
      ],
    },
    {
      category: 'Analytics & Results',
      items: [
        { icon: BarChart3, label: 'Test Results',       path: '/test-results', color: 'cyan',   auth: true  },
        { icon: Shield,    label: 'Plagiarism Checker', path: '/plagiarism',   color: 'rose',   auth: true  },
      ],
    },
    {
      category: 'System',
      items: [
        { icon: Settings,   label: 'Settings',     path: '/settings', color: 'gray', auth: false },
        { icon: HelpCircle, label: 'Help & Support', path: '/help',    color: 'teal', auth: false },
      ],
    },
  ];

  // Tailwind-safe colour map (avoids dynamic class generation issues)
  const colorMap = {
    emerald: { bg: 'bg-emerald-500/10', icon: 'text-emerald-400', hover: 'group-hover:bg-emerald-500/20' },
    blue:    { bg: 'bg-blue-500/10',    icon: 'text-blue-400',    hover: 'group-hover:bg-blue-500/20'    },
    cyan:    { bg: 'bg-cyan-500/10',    icon: 'text-cyan-400',    hover: 'group-hover:bg-cyan-500/20'    },
    rose:    { bg: 'bg-rose-500/10',    icon: 'text-rose-400',    hover: 'group-hover:bg-rose-500/20'    },
    gray:    { bg: 'bg-gray-500/10',    icon: 'text-gray-400',    hover: 'group-hover:bg-gray-500/20'    },
    teal:    { bg: 'bg-teal-500/10',    icon: 'text-teal-400',    hover: 'group-hover:bg-teal-500/20'    },
  };

  const handleItemClick = (path) => {
    onNavigate(path);
    onClose();
  };

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Sidebar panel */}
      <div
        className={`fixed left-0 top-0 w-72 h-screen bg-gray-950 border-r border-white/8
          z-50 transform transition-transform duration-300 ease-in-out flex flex-col
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-white/8 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-md shadow-emerald-500/20">
              <Eye className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-white tracking-tight" style={{ fontFamily: "'Syne', sans-serif" }}>
                JASOOS<span className="text-emerald-400">.</span>AI
              </p>
              <p className="text-[11px] text-gray-500 font-medium">Educator Dashboard</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/6 transition-colors text-gray-500 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* User pill */}
        {user && (
          <div className="mx-4 mt-4 px-4 py-3 rounded-xl bg-white/4 border border-white/6 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                {(user.name || user.email || 'E')[0].toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white truncate">{user.name || 'Educator'}</p>
                <p className="text-[11px] text-gray-500 truncate">{user.email}</p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-5 space-y-7">
          {menuItems.map((section, idx) => (
            <div key={idx}>
              <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-2 px-3">
                {section.category}
              </p>
              <div className="space-y-0.5">
                {section.items.map((item, i) => {
                  if (item.auth && !user) return null;
                  const Icon = item.icon;
                  const c = colorMap[item.color] || colorMap.gray;
                  return (
                    <button
                      key={i}
                      onClick={() => handleItemClick(item.path)}
                      className="group flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-all duration-150"
                    >
                      <div className={`w-8 h-8 rounded-lg ${c.bg} ${c.hover} flex items-center justify-center flex-shrink-0 transition-colors`}>
                        <Icon className={`w-4 h-4 ${c.icon}`} />
                      </div>
                      <span className="text-sm font-medium">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer — AI Proctoring status, no fake numbers */}
        <div className="px-4 pb-5 flex-shrink-0">
          <div className="rounded-xl border border-emerald-500/15 bg-emerald-500/5 px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-semibold text-white">AI Proctoring</span>
              </div>
              <span className="text-[10px] text-gray-600">v2.1.0</span>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-emerald-400 font-medium">Active</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}