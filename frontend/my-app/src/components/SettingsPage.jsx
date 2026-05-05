import React, { useState, useEffect, useCallback } from 'react';
import {
  Settings,
  Monitor,
  Type,
  Bell,
  Eye,
  Volume2,
  Save,
  Moon,
  Sun,
  ArrowLeft,
  RotateCcw,
  Download,
  CheckCircle2
} from 'lucide-react';

const STORAGE_KEY = 'jasoos_user_settings';

const DEFAULT_SETTINGS = {
  theme: 'system',
  fontSize: 'medium',
  displayScale: '100',
  contrast: 'normal',
  notifications: true,
  soundAlerts: true,
  autoSave: true,
  language: 'english',
};

// ── Tiny toast component ──────────────────────────────────────────────────────
const Toast = ({ message, visible }) => (
  <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 bg-gray-900 border border-emerald-500/30
    text-white text-sm font-medium px-4 py-3 rounded-xl shadow-2xl transition-all duration-300
    ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3 pointer-events-none'}`}>
    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
    {message}
  </div>
);

// ── Toggle component ──────────────────────────────────────────────────────────
const Toggle = ({ checked, onChange }) => (
  <button
    onClick={() => onChange(!checked)}
    className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors duration-200
      ${checked ? 'bg-emerald-500' : 'bg-gray-700'}`}
  >
    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200
      ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
  </button>
);

// ── Main component ────────────────────────────────────────────────────────────
const SettingsPage = ({ onNavigate }) => {
  const [settings, setSettings] = useState(() => {
    // ✅ Initialise from localStorage immediately — avoids a render cycle where
    //    defaults flash before the useEffect loads saved values.
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  const [toast, setToast] = useState({ visible: false, message: '' });

  // ── Show a toast ──────────────────────────────────────────────────────────
  const showToast = useCallback((message) => {
    setToast({ visible: true, message });
    setTimeout(() => setToast(t => ({ ...t, visible: false })), 2500);
  }, []);

  // ── Persist to localStorage whenever settings change ──────────────────────
  // ✅ This is the key fix: every change is written immediately,
  //    so a refresh never loses work.
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      // localStorage may be unavailable in private browsing with storage blocked
      console.warn('Could not persist settings to localStorage.');
    }
  }, [settings]);

  // ── Apply theme ───────────────────────────────────────────────────────────
  useEffect(() => {
    const root = document.documentElement;
    if (settings.theme === 'dark') {
      root.classList.add('dark');
    } else if (settings.theme === 'light') {
      root.classList.remove('dark');
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.toggle('dark', prefersDark);
    }
  }, [settings.theme]);

  // ── Apply font size ───────────────────────────────────────────────────────
  useEffect(() => {
    document.documentElement.style.fontSize =
      settings.fontSize === 'small' ? '14px' :
      settings.fontSize === 'large' ? '18px' : '16px';
  }, [settings.fontSize]);

  // ── Apply display scale ───────────────────────────────────────────────────
  useEffect(() => {
    document.documentElement.style.zoom = `${settings.displayScale}%`;
  }, [settings.displayScale]);

  // ── Apply contrast ────────────────────────────────────────────────────────
  useEffect(() => {
    document.documentElement.style.filter =
      settings.contrast === 'high' ? 'contrast(1.2)' : 'none';
  }, [settings.contrast]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const update = (key, value) =>
    setSettings(prev => ({ ...prev, [key]: value }));

  const handleSave = () => {
    // localStorage is already up-to-date from the useEffect above,
    // so this is just a confirmation action for the user.
    showToast('Settings saved successfully.');
  };

  const handleReset = () => {
    setSettings(DEFAULT_SETTINGS);
    showToast('Settings restored to defaults.');
  };

  const handleExport = () => {
    try {
      const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'jasoos-settings.json';
      a.click();
      URL.revokeObjectURL(url);
      showToast('Settings exported.');
    } catch {
      showToast('Export failed — please try again.');
    }
  };

  // ── Sections data ─────────────────────────────────────────────────────────
  const themeOptions = [
    { value: 'light',  icon: Sun,     label: 'Light'  },
    { value: 'dark',   icon: Moon,    label: 'Dark'   },
    { value: 'system', icon: Monitor, label: 'System' },
  ];

  const fontOptions = [
    { value: 'small',  label: 'Small',  cls: 'text-sm'  },
    { value: 'medium', label: 'Medium', cls: 'text-base' },
    { value: 'large',  label: 'Large',  cls: 'text-lg'  },
  ];

  const toggleOptions = [
    { key: 'notifications', label: 'Desktop Notifications', desc: 'Receive alerts for suspicious activity', icon: Bell    },
    { key: 'soundAlerts',   label: 'Sound Alerts',          desc: 'Audio cues for violation events',        icon: Volume2 },
    { key: 'autoSave',      label: 'Auto-save Settings',    desc: 'Persist changes immediately on change',  icon: Eye     },
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-white"
      style={{ fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif" }}>

      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Syne:wght@700;800;900&display=swap');`}</style>

      {/* ── Header ── */}
      <div className="border-b border-white/8 bg-gray-950/95 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => onNavigate('home')}
              className="p-2 rounded-lg hover:bg-white/6 transition-colors text-gray-400 hover:text-white"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-md shadow-emerald-500/20">
                <Settings className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-base font-bold text-white leading-none">Settings</h1>
                <p className="text-xs text-gray-500 mt-0.5">Preferences are saved automatically</p>
              </div>
            </div>
          </div>

          <button
            onClick={handleSave}
            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-semibold
              px-4 py-2.5 rounded-xl transition-all hover:shadow-lg hover:shadow-emerald-500/25"
          >
            <Save className="w-4 h-4" />
            Save
          </button>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="max-w-5xl mx-auto px-5 py-8 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Display Settings */}
          <div className="bg-gray-900 border border-white/6 rounded-2xl p-6 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <Monitor className="w-4.5 h-4.5 text-blue-400" style={{ width: '1.1rem', height: '1.1rem' }} />
              </div>
              <h2 className="text-sm font-bold text-white">Display</h2>
            </div>

            {/* Theme */}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 block">Theme</label>
              <div className="grid grid-cols-3 gap-2">
                {themeOptions.map(({ value, icon: Icon, label }) => (
                  <button
                    key={value}
                    onClick={() => update('theme', value)}
                    className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border text-xs font-medium transition-all
                      ${settings.theme === value
                        ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                        : 'bg-white/4 border-white/6 text-gray-400 hover:bg-white/8 hover:text-white'}`}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Display Scale */}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Display Scale</label>
              <select
                value={settings.displayScale}
                onChange={e => update('displayScale', e.target.value)}
                className="w-full bg-gray-800 border border-white/8 rounded-xl px-3 py-2.5 text-sm text-white
                  focus:outline-none focus:border-emerald-500/40 transition-colors"
              >
                <option value="75">75%</option>
                <option value="100">100% (Default)</option>
                <option value="125">125%</option>
                <option value="150">150%</option>
              </select>
            </div>

            {/* Contrast */}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Contrast</label>
              <div className="grid grid-cols-2 gap-2">
                {['normal', 'high'].map(c => (
                  <button
                    key={c}
                    onClick={() => update('contrast', c)}
                    className={`py-2.5 rounded-xl border text-xs font-medium capitalize transition-all
                      ${settings.contrast === c
                        ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                        : 'bg-white/4 border-white/6 text-gray-400 hover:bg-white/8 hover:text-white'}`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Typography */}
          <div className="bg-gray-900 border border-white/6 rounded-2xl p-6 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <Type className="w-4 h-4 text-emerald-400" />
              </div>
              <h2 className="text-sm font-bold text-white">Typography & Text</h2>
            </div>

            {/* Font size */}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 block">Font Size</label>
              <div className="grid grid-cols-3 gap-2">
                {fontOptions.map(({ value, label, cls }) => (
                  <button
                    key={value}
                    onClick={() => update('fontSize', value)}
                    className={`py-2.5 rounded-xl border transition-all font-medium ${cls}
                      ${settings.fontSize === value
                        ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                        : 'bg-white/4 border-white/6 text-gray-400 hover:bg-white/8 hover:text-white'}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Preview */}
            <div className="bg-gray-800/60 border border-white/6 rounded-xl p-4">
              <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-widest mb-2">Preview</p>
              <div className={`text-white font-semibold leading-snug
                ${settings.fontSize === 'small' ? 'text-sm' :
                  settings.fontSize === 'large' ? 'text-lg' : 'text-base'}`}>
                Exam Proctoring Dashboard
              </div>
              <div className={`text-gray-400 leading-relaxed mt-1 font-light
                ${settings.fontSize === 'small' ? 'text-xs' :
                  settings.fontSize === 'large' ? 'text-base' : 'text-sm'}`}>
                Monitor student activity with AI-powered detection.
              </div>
            </div>

            {/* Language */}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Interface Language</label>
              <select
                value={settings.language}
                onChange={e => update('language', e.target.value)}
                className="w-full bg-gray-800 border border-white/8 rounded-xl px-3 py-2.5 text-sm text-white
                  focus:outline-none focus:border-emerald-500/40 transition-colors"
              >
                <option value="english">English</option>
                <option value="hindi">हिन्दी</option>
                <option value="spanish">Español</option>
                <option value="french">Français</option>
                <option value="german">Deutsch</option>
              </select>
            </div>
          </div>

          {/* Notifications + Actions */}
          <div className="bg-gray-900 border border-white/6 rounded-2xl p-6 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <Bell className="w-4 h-4 text-amber-400" />
              </div>
              <h2 className="text-sm font-bold text-white">Notifications & Audio</h2>
            </div>

            <div className="space-y-3">
              {toggleOptions.map(({ key, label, desc, icon: Icon }) => (
                <div key={key} className="flex items-center justify-between gap-4 bg-white/3 border border-white/6 rounded-xl px-4 py-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon className="w-4 h-4 text-gray-500 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white leading-none">{label}</p>
                      <p className="text-xs text-gray-500 mt-0.5 leading-tight">{desc}</p>
                    </div>
                  </div>
                  <Toggle checked={settings[key]} onChange={val => update(key, val)} />
                </div>
              ))}
            </div>

            {/* Quick actions */}
            <div className="pt-2 border-t border-white/6 space-y-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Quick Actions</p>

              <button
                onClick={handleReset}
                className="w-full flex items-center gap-3 px-4 py-3 bg-white/3 hover:bg-white/6 border border-white/6
                  hover:border-white/10 rounded-xl text-sm text-gray-300 hover:text-white transition-all text-left"
              >
                <RotateCcw className="w-4 h-4 text-gray-500 flex-shrink-0" />
                <div>
                  <p className="font-medium leading-none">Reset to Defaults</p>
                  <p className="text-xs text-gray-600 mt-0.5">Restore original configuration</p>
                </div>
              </button>

              <button
                onClick={handleExport}
                className="w-full flex items-center gap-3 px-4 py-3 bg-white/3 hover:bg-white/6 border border-white/6
                  hover:border-white/10 rounded-xl text-sm text-gray-300 hover:text-white transition-all text-left"
              >
                <Download className="w-4 h-4 text-gray-500 flex-shrink-0" />
                <div>
                  <p className="font-medium leading-none">Export Settings</p>
                  <p className="text-xs text-gray-600 mt-0.5">Download as JSON</p>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Info banner */}
        <div className="flex items-center gap-3 bg-emerald-500/6 border border-emerald-500/15 rounded-xl px-5 py-3.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <p className="text-sm text-emerald-300/80 font-light">
            Preferences are stored locally in your browser and applied automatically on every page load.
          </p>
        </div>
      </div>

      <Toast message={toast.message} visible={toast.visible} />
    </div>
  );
};

export default SettingsPage;