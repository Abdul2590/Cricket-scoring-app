import React, { useState } from 'react';
import { 
  User as UserIcon, 
  LogOut, 
  RefreshCw, 
  Check, 
  AlertCircle, 
  ShieldCheck, 
  HardDrive, 
  Sparkles,
  ExternalLink,
  Trash2,
  ChevronRight,
  UserCheck,
  UserPlus
} from 'lucide-react';
import { useGoogleAuth } from '../hooks/useGoogleAuth';

interface GoogleAccountModalProps {
  onClose?: () => void;
  onOpenDrive?: () => void;
}

export const GoogleAccountModal: React.FC<GoogleAccountModalProps> = ({
  onClose,
  onOpenDrive,
}) => {
  const { 
    user, 
    isAuthLoading, 
    authError, 
    recentUsers, 
    signIn, 
    switchAccount, 
    signOut, 
    forgetRecentUser,
    clearError 
  } = useGoogleAuth();

  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const showSuccess = (msg: string) => {
    setActionSuccess(msg);
    setTimeout(() => setActionSuccess(null), 4000);
  };

  const handleSignIn = async () => {
    clearError();
    setIsProcessing(true);
    try {
      const res = await signIn();
      if (res) {
        showSuccess(`Signed in as ${res.user.displayName || res.user.email}`);
      }
    } catch (e: any) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSwitchAccount = async () => {
    clearError();
    setIsProcessing(true);
    try {
      const res = await switchAccount();
      if (res) {
        showSuccess(`Switched account to ${res.user.displayName || res.user.email}!`);
      }
    } catch (e: any) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSignOut = async () => {
    clearError();
    setIsProcessing(true);
    try {
      await signOut();
      showSuccess('Signed out successfully');
    } catch (e: any) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="p-3.5 sm:p-5 space-y-4 pb-20">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-sky-950/40">
            <UserIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white font-['Outfit'] flex items-center gap-1.5">
              Google Account & Users
            </h2>
            <p className="text-[11px] text-slate-400">
              Sign in, switch between scorer profiles, & sync matches
            </p>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="text-xs px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            Done
          </button>
        )}
      </div>

      {/* Success Notification */}
      {actionSuccess && (
        <div className="p-3 rounded-xl text-xs flex items-center gap-2 border bg-emerald-950/80 border-emerald-500/40 text-emerald-300 transition-all">
          <Check className="w-4 h-4 shrink-0 text-emerald-400" />
          <span className="flex-1 font-medium">{actionSuccess}</span>
        </div>
      )}

      {/* Error Notification */}
      {authError && (
        <div className="p-3 rounded-xl text-xs flex items-center gap-2 border bg-rose-950/80 border-rose-500/40 text-rose-300 transition-all">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span className="flex-1">{authError}</span>
          <button 
            onClick={clearError}
            className="text-[10px] underline text-rose-300 hover:text-white cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Current Active Account Box */}
      <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/5 rounded-full blur-2xl pointer-events-none"></div>

        {user ? (
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'Google Account'}
                    className="w-14 h-14 rounded-2xl border-2 border-emerald-500/60 object-cover shadow-lg"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 border border-emerald-400/40 flex items-center justify-center text-slate-950 text-xl font-bold shadow-lg">
                    {(user.displayName || user.email || 'U')[0].toUpperCase()}
                  </div>
                )}

                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-sm font-bold text-white tracking-wide">
                      {user.displayName || 'Google Scorer'}
                    </h3>
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[9px] font-bold border border-emerald-500/30">
                      <ShieldCheck className="w-2.5 h-2.5" />
                      ACTIVE
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">{user.email}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">UID: {user.uid.slice(0, 14)}...</p>
                </div>
              </div>

              <button
                onClick={handleSignOut}
                disabled={isProcessing || isAuthLoading}
                className="p-2 rounded-xl bg-slate-800/80 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 border border-slate-700/60 hover:border-rose-500/40 transition-colors flex items-center gap-1 text-xs cursor-pointer"
                title="Sign out of this Google Account"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline text-[11px]">Sign out</span>
              </button>
            </div>

            {/* Account Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-slate-800/80">
              {/* Switch Account Button */}
              <button
                id="switch-google-account-button"
                onClick={handleSwitchAccount}
                disabled={isProcessing || isAuthLoading}
                className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-950/50 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                <UserPlus className="w-4 h-4 text-sky-200" />
                <span>Log in with Other User</span>
              </button>

              {/* Cloud Sync with Drive Button */}
              {onOpenDrive && (
                <button
                  onClick={onOpenDrive}
                  className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-white font-semibold text-xs border border-slate-700/80 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <HardDrive className="w-4 h-4 text-sky-400" />
                  <span>Google Drive Sync</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-4 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-slate-800 to-slate-700 border border-slate-600/50 flex items-center justify-center mx-auto shadow-md">
              <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-6 h-6">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
              </svg>
            </div>

            <div className="space-y-1">
              <h3 className="text-sm font-bold text-white">Log in with Google Account</h3>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                Sign in to save ball-by-ball scorecards, export PDFs to Google Drive, and switch between multiple scorer accounts.
              </p>
            </div>

            <div className="pt-2">
              <button
                id="main-google-login-btn"
                onClick={handleSignIn}
                disabled={isProcessing || isAuthLoading}
                className="inline-flex items-center gap-3 px-5 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-semibold text-xs shadow-lg shadow-black/40 transition-all disabled:opacity-60 cursor-pointer"
              >
                <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-4 h-4">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                </svg>
                <span>{isProcessing ? 'Connecting...' : 'Sign in with Google'}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* User Switcher / Recent Accounts Section */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-1.5">
            <UserCheck className="w-3.5 h-3.5 text-sky-400" />
            <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
              Switch Accounts / Other Users
            </span>
          </div>
          <span className="text-[10px] text-slate-500">Google OAuth Account Chooser</span>
        </div>

        {/* Quick Explainer Banner */}
        <div className="p-3 rounded-2xl bg-slate-900/70 border border-slate-800/80 text-xs text-slate-300 space-y-1.5">
          <div className="flex items-center gap-2 font-semibold text-white">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>How to switch or use another Google user:</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Clicking <strong className="text-sky-300">"Log in with Other User"</strong> opens the Google account chooser popup where you can choose another logged-in Google profile or click <strong className="text-emerald-300">"Use another account"</strong> to authenticate with a different email address.
          </p>
        </div>

        {/* Fast Action: Switch with Google Popup */}
        <div className="p-3 rounded-2xl bg-gradient-to-r from-sky-950/40 via-slate-900 to-indigo-950/40 border border-sky-500/20 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 shrink-0">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">Choose or Add Another Account</div>
              <p className="text-[10px] text-slate-400">Launch Google dialog to switch users</p>
            </div>
          </div>

          <button
            onClick={handleSwitchAccount}
            disabled={isProcessing || isAuthLoading}
            className="py-1.5 px-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-sky-950 transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${isProcessing ? 'animate-spin' : ''}`} />
            <span>Switch User</span>
          </button>
        </div>

        {/* Recent Connected Accounts List (if any) */}
        {recentUsers.length > 0 && (
          <div className="space-y-1.5 pt-1">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-1">
              Previously Used On This Device ({recentUsers.length})
            </div>

            <div className="bg-slate-900/80 rounded-2xl border border-slate-800 divide-y divide-slate-800/80 overflow-hidden">
              {recentUsers.map((profile) => {
                const isCurrent = user?.uid === profile.uid || user?.email === profile.email;

                return (
                  <div
                    key={profile.uid}
                    className={`p-2.5 flex items-center justify-between gap-2.5 transition-colors ${
                      isCurrent ? 'bg-emerald-950/20' : 'hover:bg-slate-850'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      {profile.photoURL ? (
                        <img
                          src={profile.photoURL}
                          alt={profile.displayName || 'Google Profile'}
                          className="w-8 h-8 rounded-full border border-slate-700 object-cover shrink-0"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-300 shrink-0">
                          {(profile.displayName || profile.email || 'U')[0].toUpperCase()}
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-white truncate">
                            {profile.displayName || 'Google User'}
                          </span>
                          {isCurrent && (
                            <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 text-[9px] font-bold border border-emerald-500/30">
                              Active
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate">{profile.email}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {!isCurrent ? (
                        <button
                          onClick={handleSwitchAccount}
                          disabled={isProcessing}
                          className="px-2.5 py-1 rounded-lg bg-sky-600/20 hover:bg-sky-600/30 text-sky-400 border border-sky-500/30 text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
                          title="Switch to this or another account"
                        >
                          <span>Switch</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      ) : (
                        <span className="text-[10px] text-emerald-400 font-medium px-2 py-0.5 rounded-full bg-emerald-500/10">
                          Current
                        </span>
                      )}

                      <button
                        onClick={() => forgetRecentUser(profile.uid)}
                        className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Remove from history"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Features Enabled by Google Login */}
      <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          Benefits of Signing In
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300">
          <div className="flex items-start gap-2 p-2 rounded-xl bg-slate-950/60 border border-slate-800/60">
            <HardDrive className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-white text-[11px]">Drive Cloud Sync</div>
              <p className="text-[10px] text-slate-400">Save ball-by-ball matches directly to your Google Drive.</p>
            </div>
          </div>

          <div className="flex items-start gap-2 p-2 rounded-xl bg-slate-950/60 border border-slate-800/60">
            <UserCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-white text-[11px]">Multiple Scorer Roles</div>
              <p className="text-[10px] text-slate-400">Switch between umpire, team manager, or official scorer accounts.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
