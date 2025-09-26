import React, { useState, useEffect } from 'react';
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
  ArrowLeft
} from 'lucide-react';

const SettingsPage = ({ onNavigate }) => {
    const [settings, setSettings] = useState({
      theme: 'system',
      fontSize: 'medium',
      displayScale: '100',
      contrast: 'normal',
      notifications: true,
      soundAlerts: true,
      autoSave: true,
      language: 'english'
    });

    // Load settings from localStorage
    useEffect(() => {
        const saved = localStorage.getItem('userSettings');
        if (saved) setSettings(JSON.parse(saved));
    }, []);

    // Apply theme globally
    useEffect(() => {
        if (settings.theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else if (settings.theme === 'light') {
            document.documentElement.classList.remove('dark');
        } else {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            if (prefersDark) document.documentElement.classList.add('dark');
            else document.documentElement.classList.remove('dark');
        }
    }, [settings.theme]);

    // Font size globally
    useEffect(() => {
        document.documentElement.style.fontSize =
            settings.fontSize === 'small' ? '14px' :
            settings.fontSize === 'large' ? '18px' : '16px';
    }, [settings.fontSize]);

    // Display scale globally
    useEffect(() => {
        document.documentElement.style.zoom = `${settings.displayScale}%`;
    }, [settings.displayScale]);

    // Contrast globally
    useEffect(() => {
        document.documentElement.style.filter = settings.contrast === 'high' ? 'contrast(1.2)' : 'contrast(1)';
    }, [settings.contrast]);

    const handleSave = () => {
        localStorage.setItem('userSettings', JSON.stringify(settings));
        alert('Settings saved successfully!');
        console.log('Settings saved:', settings);
    };

    const updateSetting = (key, value) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    const handleReset = () => {
        const defaultSettings = {
            theme: 'system',
            fontSize: 'medium',
            displayScale: '100',
            contrast: 'normal',
            notifications: true,
            soundAlerts: true,
            autoSave: true,
            language: 'english'
        };
        setSettings(defaultSettings);
        localStorage.setItem('userSettings', JSON.stringify(defaultSettings));
        alert('Settings reset to defaults');
    };

    const handleExport = () => {
        const dataStr = JSON.stringify(settings, null, 2);
        const dataBlob = new Blob([dataStr], {type:'application/json'});
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'settings.json';
        link.click();
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-black">
          {/* Header */}
          <div className="bg-white/50 backdrop-blur-sm border-b border-gray-200/50">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <button
                     onClick={() => onNavigate('home')}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <div className="flex items-center space-x-3">
                    <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-2 rounded-lg">
                      <Settings className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
                      <p className="text-gray-600">Customize your proctoring experience</p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleSave}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:opacity-90 text-white px-6 py-2 rounded-lg font-medium transition-all hover:scale-105 flex items-center space-x-2"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Changes</span>
                </button>
              </div>
            </div>
          </div>

          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Display Settings */}
              <div className="bg-gradient-to-br from-white to-gray-50 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl p-6 border border-gray-200/50">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="bg-blue-500 p-2 rounded-lg">
                    <Monitor className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">Display Settings</h2>
                </div>
                <div className="space-y-6">
                  {/* Theme */}
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-3">Theme</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[{ value: 'light', icon: Sun, label: 'Light' },
                        { value: 'dark', icon: Moon, label: 'Dark' },
                        { value: 'system', icon: Monitor, label: 'System' }].map(({ value, icon: Icon, label }) => (
                        <button
                          key={value}
                          onClick={() => updateSetting('theme', value)}
                          className={`p-3 rounded-lg border transition-all flex flex-col items-center space-y-1 ${
                            settings.theme === value
                              ? 'bg-blue-500 text-white border-blue-500'
                              : 'bg-white hover:bg-gray-50 border-gray-200'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          <span className="text-xs font-medium">{label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* Display Scale */}
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-3">Display Scale</label>
                    <select
                      value={settings.displayScale}
                      onChange={(e) => updateSetting('displayScale', e.target.value)}
                      className="w-full p-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    >
                      <option value="75">75%</option>
                      <option value="100">100% (Recommended)</option>
                      <option value="125">125%</option>
                      <option value="150">150%</option>
                    </select>
                  </div>
                  {/* Contrast */}
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-3">Contrast</label>
                    <div className="grid grid-cols-2 gap-2">
                      {['normal','high'].map((contrast) => (
                        <button
                          key={contrast}
                          onClick={() => updateSetting('contrast', contrast)}
                          className={`p-3 rounded-lg border transition-all capitalize ${
                            settings.contrast===contrast
                              ? 'bg-blue-500 text-white border-blue-500'
                              : 'bg-white hover:bg-gray-50 border-gray-200'
                          }`}
                        >
                          {contrast} Contrast
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Typography & Text */}
              <div className="bg-gradient-to-br from-white to-gray-50 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl p-6 border border-gray-200/50">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="bg-green-500 p-2 rounded-lg">
                    <Type className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">Typography & Text</h2>
                </div>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-3">Font Size</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[{value:'small',label:'Small',size:'text-sm'},
                        {value:'medium',label:'Medium',size:'text-base'},
                        {value:'large',label:'Large',size:'text-lg'}].map(({value,label,size}) => (
                        <button
                          key={value}
                          onClick={()=>updateSetting('fontSize',value)}
                          className={`p-3 rounded-lg border transition-all ${size} ${
                            settings.fontSize===value
                              ? 'bg-green-500 text-white border-green-500'
                              : 'bg-white hover:bg-gray-50 border-gray-200'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <h4 className="text-sm font-medium text-gray-600 mb-2">Preview</h4>
                    <div className={`text-gray-900 ${
                      settings.fontSize==='small'?'text-sm':
                      settings.fontSize==='large'?'text-lg':'text-base'
                    }`}>
                      <p className="font-bold">Exam Proctoring Dashboard</p>
                      <p className="text-gray-600">Monitor student activity during examinations with AI-powered detection</p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-3">Interface Language</label>
                    <select
                      value={settings.language}
                      onChange={(e)=>updateSetting('language',e.target.value)}
                      className="w-full p-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    >
                      <option value="english">English</option>
                      <option value="spanish">Español</option>
                      <option value="french">Français</option>
                      <option value="german">Deutsch</option>
                      <option value="hindi">हिन्दी</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Notifications & Audio */}
              <div className="bg-gradient-to-br from-white to-gray-50 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl p-6 border border-gray-200/50">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="bg-yellow-500 p-2 rounded-lg">
                    <Bell className="w-5 h-5 text-black" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">Notifications & Audio</h2>
                </div>
                <div className="space-y-6">
                  {[{key:'notifications',label:'Desktop Notifications',description:'Receive alerts for suspicious activity',icon:Bell},
                    {key:'soundAlerts',label:'Sound Alerts',description:'Audio notifications for incidents',icon:Volume2},
                    {key:'autoSave',label:'Auto-save Settings',description:'Automatically save preference changes',icon:Eye}].map(({key,label,description,icon:Icon}) => (
                    <div key={key} className="flex items-center justify-between p-4 bg-white/70 rounded-lg border border-gray-200">
                      <div className="flex items-center space-x-3">
                        <Icon className="w-5 h-5 text-gray-600"/>
                        <div>
                          <p className="font-medium text-gray-900">{label}</p>
                          <p className="text-sm text-gray-600">{description}</p>
                        </div>
                      </div>
                      <button
                        onClick={()=>updateSetting(key,!settings[key])}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings[key]?'bg-blue-500':'bg-gray-300'}`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings[key]?'translate-x-6':'translate-x-1'}`}/>
                      </button>
                    </div>
                  ))}
                  <div className="pt-4 border-t border-gray-200">
                    <h4 className="font-medium text-gray-900 mb-3">Quick Actions</h4>
                    <div className="grid grid-cols-1 gap-2">
                      <button onClick={handleReset} className="text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
                        <p className="font-medium text-gray-900">Reset to Defaults</p>
                        <p className="text-sm text-gray-600">Restore all settings to original values</p>
                      </button>
                      <button onClick={handleExport} className="text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
                        <p className="font-medium text-gray-900">Export Settings</p>
                        <p className="text-sm text-gray-600">Download your current configuration</p>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Success Message */}
            <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                  <Eye className="w-3 h-3 text-white" />
                </div>
                <p className="text-green-700 font-medium">
                  All settings are saved locally and will be applied to your proctoring sessions
                </p>
              </div>
            </div>
          </div>
        </div>
    );
};

export default SettingsPage;
