import React, { useState, useEffect, useRef } from 'react';
import { Eye, Menu, LogOut, ChevronDown, Settings, HelpCircle, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Navbar = ({ currentPage, onNavigate, onToggleSidebar }) => {
  const { user, logout } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Shrink navbar on scroll
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  // Close user dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => {
    setUserMenuOpen(false);
    logout();
    onNavigate('home');
  };

  // Initials avatar from user name or email
  const initials = user
    ? (user.name || user.email || 'E')
        .split(' ')
        .map(w => w[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : '';

  return (
    <nav
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300
        ${scrolled
          ? 'bg-gray-950/96 backdrop-blur-xl border-b border-white/6 shadow-xl shadow-black/20'
          : 'bg-gray-950/80 backdrop-blur-md border-b border-white/5'
        }`}
      style={{ fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif" }}
    >
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Syne:wght@700;800;900&display=swap');`}</style>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-15 py-3">

          {/* ── Left: sidebar toggle + logo ── */}
          <div className="flex items-center gap-3">
            {/* Sidebar toggle — only shown when logged in */}
            {user && (
              <button
                onClick={onToggleSidebar}
                className="p-2 rounded-lg hover:bg-white/6 transition-colors text-gray-400 hover:text-white"
                aria-label="Toggle sidebar"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}

            {/* Logo */}
            <button
              onClick={() => onNavigate('home')}
              className="flex items-center gap-2.5 group"
            >
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-md shadow-emerald-500/20 group-hover:shadow-emerald-500/35 transition-shadow">
                <Eye className="w-4 h-4 text-white" />
              </div>
              <div className="leading-none">
                <span
                  className="text-white font-black text-lg tracking-tight block"
                  style={{ fontFamily: "'Syne', sans-serif" }}
                >
                  JASOOS<span className="text-emerald-400">.</span>AI
                </span>
                <span className="text-[10px] text-gray-600 font-medium tracking-wide">
                  One Stop Exam Solution
                </span>
              </div>
            </button>
          </div>

          {/* ── Right: nav links / user menu ── */}
          <div className="flex items-center gap-2">

            {/* Not logged in: show nav links */}
            {!user && (
              <div className="flex items-center gap-1">
                <NavLink
                  active={currentPage === 'home'}
                  onClick={() => onNavigate('home')}
                >
                  Home
                </NavLink>
                <NavLink
                  active={currentPage === 'login'}
                  onClick={() => onNavigate('login')}
                >
                  Educator Login
                </NavLink>
                <button
                  onClick={() => onNavigate('signup')}
                  className="ml-2 flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-400 text-white text-sm
                    font-semibold px-4 py-2 rounded-xl transition-all hover:shadow-lg hover:shadow-emerald-500/25"
                >
                  Get Started
                </button>
              </div>
            )}

            {/* Logged in: user dropdown */}
            {user && (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setUserMenuOpen(v => !v)}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-xl border transition-all
                    ${userMenuOpen
                      ? 'bg-white/8 border-white/12 text-white'
                      : 'bg-white/4 border-white/6 text-gray-300 hover:bg-white/7 hover:text-white hover:border-white/10'
                    }`}
                >
                  {/* Avatar */}
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center
                    justify-center text-white text-xs font-bold flex-shrink-0">
                    {initials}
                  </div>
                  <div className="hidden sm:block text-left leading-none">
                    <p className="text-sm font-semibold text-white leading-none truncate max-w-[120px]">
                      {user.name || 'Educator'}
                    </p>
                    <p className="text-[11px] text-gray-500 mt-0.5 truncate max-w-[120px]">
                      {user.email}
                    </p>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-200 flex-shrink-0
                    ${userMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown */}
                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-52 bg-gray-900 border border-white/8 rounded-2xl
                    shadow-2xl shadow-black/40 overflow-hidden py-1.5 z-50">

                    {/* User info header */}
                    <div className="px-4 py-3 border-b border-white/6">
                      <p className="text-xs font-semibold text-white truncate">{user.name || 'Educator'}</p>
                      <p className="text-[11px] text-gray-500 truncate mt-0.5">{user.email}</p>
                    </div>

                    {/* Menu items */}
                    <div className="py-1">
                      <DropdownItem
                        icon={LayoutDashboard}
                        label="Dashboard"
                        onClick={() => { setUserMenuOpen(false); onNavigate('home'); }}
                      />
                      <DropdownItem
                        icon={Settings}
                        label="Settings"
                        onClick={() => { setUserMenuOpen(false); onNavigate('/settings'); }}
                      />
                      <DropdownItem
                        icon={HelpCircle}
                        label="Help & Support"
                        onClick={() => { setUserMenuOpen(false); onNavigate('/help'); }}
                      />
                    </div>

                    {/* Logout */}
                    <div className="border-t border-white/6 py-1">
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-rose-400
                          hover:bg-rose-500/8 hover:text-rose-300 transition-colors text-left"
                      >
                        <LogOut className="w-4 h-4 flex-shrink-0" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

// ── Sub-components ─────────────────────────────────────────────────────────────

const NavLink = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={`px-3.5 py-2 rounded-xl text-sm font-medium transition-all
      ${active
        ? 'text-emerald-400 bg-emerald-400/10'
        : 'text-gray-400 hover:text-white hover:bg-white/5'
      }`}
  >
    {children}
  </button>
);

const DropdownItem = ({ icon: Icon, label, onClick }) => (
  <button
    onClick={onClick}
    className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-300
      hover:bg-white/5 hover:text-white transition-colors text-left"
  >
    <Icon className="w-4 h-4 text-gray-500 flex-shrink-0" />
    {label}
  </button>
);

export default Navbar;