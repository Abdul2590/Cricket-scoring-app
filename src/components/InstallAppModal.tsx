import React, { useState } from 'react';
import { 
  Download, 
  Smartphone, 
  Check, 
  Share2, 
  Sparkles, 
  WifiOff, 
  HardDrive, 
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Zap,
  Info
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface InstallAppModalProps {
  onClose?: () => void;
}

export const InstallAppModal: React.FC<InstallAppModalProps> = ({ onClose }) => {
  const { isInstallable, isInstalled, isIOS, isAndroid, install } = usePWAInstall();
  const [installStatus, setInstallStatus] = useState<'idle' | 'installing' | 'success' | 'dismissed'>('idle');
  const [copiedLink, setCopiedLink] = useState(false);

  const handleInstallClick = async () => {
    setInstallStatus('installing');
    const accepted = await install();
    if (accepted) {
      setInstallStatus('success');
      setTimeout(() => {
        if (onClose) onClose();
      }, 2000);
    } else {
      setInstallStatus('idle');
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  return (
    <div className="p-4 sm:p-5 space-y-4 pb-20 max-w-xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-md">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white font-['Outfit'] flex items-center gap-1.5">
              Install Android Mobile App
            </h2>
            <p className="text-[11px] text-slate-400">
              Run natively on your phone with offline scoring & full screen
            </p>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="text-xs px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 hover:text-white transition-colors"
          >
            Close
          </button>
        )}
      </div>

      {/* App Identity Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 shadow-xl space-y-3">
        <div className="flex items-start gap-3.5">
          <img
            src="/pwa-192x192.png"
            alt="CricLive App Icon"
            className="w-16 h-16 rounded-2xl shadow-lg border border-slate-700/80 shrink-0 bg-slate-950"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white truncate font-['Outfit']">CricLive Scoring</h3>
              <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/30">
                PRO APK
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">Live Cricket Scorer & Fixtures</p>
            
            <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-400 font-mono">
              <span className="flex items-center gap-1 text-amber-400 font-semibold">
                ★ 4.9 (42k)
              </span>
              <span>•</span>
              <span>2.4 MB</span>
              <span>•</span>
              <span className="text-emerald-400">PWA / WebAPK</span>
            </div>
          </div>
        </div>

        {/* Primary Action Button */}
        {isInstalled ? (
          <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>CricLive is already installed and running in native standalone mode on this device!</span>
          </div>
        ) : isInstallable ? (
          <button
            id="pwa-native-install-button"
            onClick={handleInstallClick}
            disabled={installStatus === 'installing'}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-950 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>{installStatus === 'installing' ? 'Installing CricLive...' : 'Install CricLive on this Device'}</span>
          </button>
        ) : (
          <div className="space-y-2">
            <button
              onClick={handleCopyLink}
              className="w-full py-2.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-300" /> : <Share2 className="w-4 h-4" />}
              <span>{copiedLink ? 'Link Copied to Clipboard!' : 'Share / Open on Android Phone'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Android Installation Instructions Guide */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
        <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
          <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
          How to Install on Android Mobile (Chrome / Samsung)
        </h4>

        <div className="space-y-2.5 text-xs text-slate-300">
          <div className="flex items-start gap-2.5 p-2 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
              1
            </div>
            <p>
              Open this app URL in <strong>Google Chrome</strong> or <strong>Samsung Internet</strong> on your Android phone.
            </p>
          </div>

          <div className="flex items-start gap-2.5 p-2 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
              2
            </div>
            <p>
              Tap the browser menu icon (<strong>three dots ⋮</strong> at top-right or bottom-right).
            </p>
          </div>

          <div className="flex items-start gap-2.5 p-2 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
              3
            </div>
            <p>
              Select <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>. Android will build a native WebAPK icon on your phone!
            </p>
          </div>
        </div>
      </div>

      {/* iOS Installation Instructions (if on iPhone/iPad) */}
      {isIOS && (
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
            <Smartphone className="w-3.5 h-3.5 text-sky-400" />
            How to Install on iPhone / iPad (Safari)
          </h4>

          <div className="space-y-2.5 text-xs text-slate-300">
            <div className="flex items-start gap-2.5 p-2 rounded-xl bg-slate-950/60 border border-slate-800">
              <div className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                1
              </div>
              <p>
                Tap the <strong>Share</strong> icon (square with arrow pointing up) at the bottom of Safari.
              </p>
            </div>

            <div className="flex items-start gap-2.5 p-2 rounded-xl bg-slate-950/60 border border-slate-800">
              <div className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                2
              </div>
              <p>
                Scroll down and tap <strong>"Add to Home Screen"</strong>.
              </p>
            </div>

            <div className="flex items-start gap-2.5 p-2 rounded-xl bg-slate-950/60 border border-slate-800">
              <div className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                3
              </div>
              <p>
                Tap <strong>Add</strong> in the top-right. The CricLive app icon will appear on your iOS home screen.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Feature Highlights of the Android App */}
      <div className="grid grid-cols-2 gap-2">
        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-start gap-2">
          <WifiOff className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <h5 className="text-xs font-bold text-white">100% Offline Ready</h5>
            <p className="text-[10px] text-slate-400">Score cricket matches on the ground without cellular data.</p>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-start gap-2">
          <HardDrive className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
          <div>
            <h5 className="text-xs font-bold text-white">Drive Cloud Sync</h5>
            <p className="text-[10px] text-slate-400">Instant cloud backup and restore of match fixtures.</p>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-start gap-2">
          <Zap className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <h5 className="text-xs font-bold text-white">Instant Launch</h5>
            <p className="text-[10px] text-slate-400">Loads in &lt;1 second from cached service workers.</p>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-start gap-2">
          <ShieldCheck className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
          <div>
            <h5 className="text-xs font-bold text-white">Safe & Secure</h5>
            <p className="text-[10px] text-slate-400">Sandboxed storage with zero battery or memory bloat.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
