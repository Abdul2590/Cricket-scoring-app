import React, { useState, useEffect } from 'react';
import { 
  Wifi, 
  BatteryMedium, 
  Radio, 
  Smartphone, 
  Maximize2, 
  Volume2, 
  VolumeX, 
  Activity, 
  Trophy, 
  Sliders, 
  FileText,
  Clock,
  HardDrive,
  Download,
  Shield
} from 'lucide-react';
import { AppTab, DashboardConfig, Match } from '../types';
import { OfflineIndicator } from './OfflineIndicator';
import { useGoogleAuth } from '../hooks/useGoogleAuth';

interface AndroidFrameProps {
  children: React.ReactNode;
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  config: DashboardConfig;
  updateConfig: (updater: (prev: DashboardConfig) => DashboardConfig) => void;
  activeMatch: Match | null;
  onOpenFixModal: () => void;
}

export const AndroidFrame: React.FC<AndroidFrameProps> = ({
  children,
  activeTab,
  setActiveTab,
  config,
  updateConfig,
  activeMatch,
  onOpenFixModal,
}) => {
  const [currentTime, setCurrentTime] = useState('19:42');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }));
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  const { user } = useGoogleAuth();

  const toggleSound = () => {
    updateConfig((prev) => ({ ...prev, soundEnabled: !prev.soundEnabled }));
  };

  const toggleDeviceFrame = () => {
    updateConfig((prev) => ({ ...prev, showAndroidFrame: !prev.showAndroidFrame }));
  };

  // Content container
  const innerContent = (
    <div className="flex flex-col h-full w-full bg-slate-950 text-slate-100 overflow-hidden relative select-none">
      {/* Android Status Bar */}
      <div 
        id="android-status-bar"
        className="w-full bg-slate-950/95 backdrop-blur-md px-5 py-2 flex items-center justify-between text-xs text-slate-300 z-50 border-b border-slate-900 shrink-0 select-none"
      >
        <div className="flex items-center gap-2 font-semibold tracking-wide">
          <span>{currentTime}</span>
          {activeMatch?.status === 'live' && (
            <span className="flex items-center gap-1 text-[10px] text-red-400 bg-red-950/70 border border-red-800/80 px-1.5 py-0.5 rounded-full font-mono font-bold animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span> LIVE
            </span>
          )}
        </div>

        {/* Camera Hole cutout for realistic Android phone punch-hole */}
        {config.showAndroidFrame && (
          <div className="w-3.5 h-3.5 rounded-full bg-black border border-slate-800 shadow-inner"></div>
        )}

        <div className="flex items-center gap-2 text-slate-300">
          <span className="text-[10px] font-bold text-emerald-400 tracking-wider">5G</span>
          <Radio className="w-3.5 h-3.5 text-slate-400" />
          <Wifi className="w-3.5 h-3.5 text-slate-300" />
          <div className="flex items-center gap-1">
            <span className="text-[10px] font-mono font-medium">96%</span>
            <BatteryMedium className="w-3.5 h-3.5 text-emerald-400" />
          </div>
        </div>
      </div>

      {/* Android Top App Bar */}
      <header 
        id="android-top-app-bar"
        className="w-full bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 px-4 py-2.5 flex items-center justify-between border-b border-slate-800/80 z-40 shrink-0"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-md shadow-emerald-950">
            <Trophy className="w-4 h-4 text-slate-950" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-sm font-bold tracking-tight text-white font-['Outfit']">CricLive</h1>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-semibold border border-emerald-500/30 uppercase tracking-widest">
                Android
              </span>
            </div>
            <p className="text-[10px] text-slate-400 truncate max-w-[170px] sm:max-w-xs">
              {activeMatch ? `${activeMatch.teamA.shortName} vs ${activeMatch.teamB.shortName}` : 'Live Cricket Scoring'}
            </p>
          </div>
        </div>

        {/* Quick Action Icons */}
        <div className="flex items-center gap-1">
          {/* Google User Profile / Switch User Button */}
          <button
            id="top-google-account-button"
            onClick={() => setActiveTab('account')}
            title={user ? `Logged in: ${user.displayName || user.email} (Tap to manage or switch user)` : "Sign in with Google Account"}
            className={`px-2 py-1 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'account'
                ? 'bg-sky-500 text-white shadow-md shadow-sky-950'
                : user
                ? 'bg-slate-800/90 hover:bg-slate-750 text-slate-200 border border-slate-700/80'
                : 'bg-white hover:bg-slate-100 text-slate-900 shadow-sm'
            }`}
          >
            {user ? (
              <>
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'Google Account'}
                    className="w-4 h-4 rounded-full object-cover border border-emerald-400 shrink-0"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-4 h-4 rounded-full bg-emerald-600 text-white text-[9px] flex items-center justify-center font-bold shrink-0">
                    {(user.displayName || user.email || 'U')[0].toUpperCase()}
                  </div>
                )}
                <span className="hidden sm:inline text-[11px] max-w-[70px] truncate">
                  {user.displayName?.split(' ')[0] || user.email?.split('@')[0]}
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0"></span>
              </>
            ) : (
              <>
                <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-3.5 h-3.5 shrink-0">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                </svg>
                <span className="text-[11px] font-bold">Sign in</span>
              </>
            )}
          </button>

          <button
            id="toggle-sound-button"
            onClick={toggleSound}
            title={config.soundEnabled ? 'Mute Sounds' : 'Enable Match Sounds'}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 transition-colors"
          >
            {config.soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
          </button>

          <button
            id="quick-fix-match-button"
            onClick={onOpenFixModal}
            className="px-2 py-1 text-[11px] font-medium rounded-lg bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600/30 transition-all flex items-center gap-1"
            title="Fix Matches (Schedule fixtures)"
          >
            <Clock className="w-3 h-3" />
            <span className="hidden sm:inline">Fix</span> Matches
          </button>

          <button
            id="quick-drive-button"
            onClick={() => setActiveTab('drive')}
            title="Google Drive Cloud Sync & Backups"
            className={`p-1.5 rounded-lg transition-colors ${
              activeTab === 'drive'
                ? 'text-sky-400 bg-sky-500/20'
                : 'text-slate-400 hover:text-sky-400 hover:bg-slate-800/80'
            }`}
          >
            <HardDrive className="w-4 h-4" />
          </button>

          <button
            id="quick-install-app-button"
            onClick={() => setActiveTab('install')}
            className={`px-2 py-1 text-[11px] font-bold rounded-lg transition-all flex items-center gap-1 shadow-sm ${
              activeTab === 'install'
                ? 'bg-emerald-500 text-slate-950 shadow-emerald-950/50'
                : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25'
            }`}
            title="Install Android App on Mobile"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Install</span>
          </button>

          <button
            id="toggle-device-frame-button"
            onClick={toggleDeviceFrame}
            title={config.showAndroidFrame ? 'Switch to Full Screen View' : 'Switch to Android Phone Mockup Frame'}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 transition-colors"
          >
            {config.showAndroidFrame ? <Maximize2 className="w-4 h-4 text-sky-400" /> : <Smartphone className="w-4 h-4 text-slate-400" />}
          </button>
        </div>
      </header>

      {/* Scrollable Viewport Body */}
      <main id="app-main-viewport" className="flex-1 overflow-y-auto overflow-x-hidden relative scroll-smooth">
        <OfflineIndicator />
        {children}
      </main>

      {/* Android Material 3 Bottom Navigation Bar */}
      <nav 
        id="android-bottom-navigation"
        className="w-full bg-slate-900/95 backdrop-blur-lg border-t border-slate-800/90 px-2 py-1.5 flex items-center justify-around z-40 shrink-0"
      >
        <button
          id="nav-tab-dashboard"
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${
            activeTab === 'dashboard'
              ? 'text-emerald-400 bg-emerald-500/10'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Activity className="w-4 h-4 mb-0.5" />
          <span className="text-[10px] font-medium tracking-tight">Live</span>
        </button>

        <button
          id="nav-tab-scorer"
          onClick={() => setActiveTab('scorer')}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all relative ${
            activeTab === 'scorer'
              ? 'text-sky-400 bg-sky-500/10'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="relative">
            <span className="text-base leading-none">🏏</span>
            {activeMatch?.status === 'live' && (
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
            )}
          </div>
          <span className="text-[10px] font-medium tracking-tight">Scorer</span>
        </button>

        <button
          id="nav-tab-fixtures"
          onClick={() => setActiveTab('fixtures')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all ${
            activeTab === 'fixtures'
              ? 'text-amber-400 bg-amber-500/10'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Clock className="w-4 h-4 mb-0.5" />
          <span className="text-[10px] font-medium tracking-tight">Fixtures</span>
        </button>

        <button
          id="nav-tab-teams"
          onClick={() => setActiveTab('custom_teams')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all ${
            activeTab === 'custom_teams'
              ? 'text-sky-400 bg-sky-500/10 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Custom Teams & Squads Library"
        >
          <Shield className="w-4 h-4 mb-0.5" />
          <span className="text-[10px] font-medium tracking-tight">Teams</span>
        </button>

        <button
          id="nav-tab-scorecard"
          onClick={() => setActiveTab('scorecard')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${
            activeTab === 'scorecard'
              ? 'text-indigo-400 bg-indigo-500/10'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileText className="w-4 h-4 mb-0.5" />
          <span className="text-[10px] font-medium tracking-tight">Card</span>
        </button>

        <button
          id="nav-tab-drive"
          onClick={() => setActiveTab('drive')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all ${
            activeTab === 'drive'
              ? 'text-sky-400 bg-sky-500/10'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <HardDrive className="w-4 h-4 mb-0.5" />
          <span className="text-[10px] font-medium tracking-tight">Drive</span>
        </button>

        <button
          id="nav-tab-install"
          onClick={() => setActiveTab('install')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all ${
            activeTab === 'install'
              ? 'text-emerald-400 bg-emerald-500/10 font-bold'
              : 'text-emerald-400/80 hover:text-emerald-300'
          }`}
        >
          <Download className="w-4 h-4 mb-0.5" />
          <span className="text-[10px] font-medium tracking-tight">Install</span>
        </button>

        <button
          id="nav-tab-customize"
          onClick={() => setActiveTab('customize')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all ${
            activeTab === 'customize'
              ? 'text-purple-400 bg-purple-500/10'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sliders className="w-4 h-4 mb-0.5" />
          <span className="text-[10px] font-medium tracking-tight">Custom</span>
        </button>
      </nav>

      {/* Android Gesture Navigation Indicator */}
      <div className="w-full bg-slate-900 pb-1.5 pt-0.5 flex justify-center items-center shrink-0">
        <div className="w-28 h-1 bg-slate-600/60 rounded-full"></div>
      </div>
    </div>
  );

  if (config.showAndroidFrame) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-b from-slate-950 via-slate-900 to-black p-2 sm:p-6 flex flex-col items-center justify-center">
        {/* Android Device Outer Bezel */}
        <div className="w-full max-w-[430px] h-[92vh] max-h-[890px] bg-slate-900 p-2.5 rounded-[42px] shadow-2xl shadow-emerald-950/40 border-4 border-slate-700/60 ring-1 ring-white/10 flex flex-col overflow-hidden relative">
          {/* Side phone buttons simulation */}
          <div className="absolute -left-[7px] top-28 w-[3px] h-12 bg-slate-600 rounded-l-md"></div>
          <div className="absolute -left-[7px] top-44 w-[3px] h-12 bg-slate-600 rounded-l-md"></div>
          <div className="absolute -right-[7px] top-32 w-[3px] h-16 bg-slate-600 rounded-r-md"></div>

          {/* Screen Content */}
          <div className="w-full h-full rounded-[34px] overflow-hidden flex flex-col border border-slate-800">
            {innerContent}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-slate-950 flex flex-col items-center justify-start">
      <div className="w-full max-w-2xl h-screen flex flex-col border-x border-slate-900 shadow-2xl bg-slate-950">
        {innerContent}
      </div>
    </div>
  );
};
