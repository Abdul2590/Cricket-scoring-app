import React from 'react';
import { WifiOff, CheckCircle2 } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed top-2 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-full bg-amber-500/95 backdrop-blur-md px-3.5 py-1 text-xs font-semibold text-slate-950 shadow-xl border border-amber-300/40 animate-bounce">
      <WifiOff className="w-3.5 h-3.5" />
      <span>Offline Mode Active — Scoring is saved locally</span>
    </div>
  );
};
