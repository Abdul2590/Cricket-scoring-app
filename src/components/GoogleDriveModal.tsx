import React, { useState, useEffect } from 'react';
import { 
  Cloud, 
  Upload, 
  Download, 
  Trash2, 
  ExternalLink, 
  Search, 
  RefreshCw, 
  Check, 
  AlertCircle, 
  FileText, 
  Database, 
  User as UserIcon, 
  LogOut,
  FolderArchive,
  ArrowDownToLine,
  HardDrive,
  UserPlus
} from 'lucide-react';
import { User } from 'firebase/auth';
import { Match, BatsmanStats, BowlerStats } from '../types';
import { 
  initAuth, 
  googleSignIn, 
  switchGoogleAccount,
  logout, 
  getAccessToken 
} from '../services/firebaseAuth';
import { 
  listDriveFiles, 
  uploadJsonToDrive, 
  uploadTextReportToDrive, 
  downloadDriveFile, 
  deleteDriveFile, 
  formatFileSize,
  DriveFileItem 
} from '../services/googleDriveService';
import { formatOvers, calculateCRR, getBattingTeam } from '../utils/cricketEngine';

interface GoogleDriveModalProps {
  currentMatch: Match | null;
  allMatches: Match[];
  onImportMatch: (importedMatch: Match) => void;
  onImportAllMatches: (importedMatches: Match[]) => void;
  onClose?: () => void;
}

export const GoogleDriveModal: React.FC<GoogleDriveModalProps> = ({
  currentMatch,
  allMatches,
  onImportMatch,
  onImportAllMatches,
  onClose,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [files, setFiles] = useState<DriveFileItem[]>([]);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Destructive operation confirmation modal state (Required by Workspace Integration guidelines)
  const [fileToDelete, setFileToDelete] = useState<DriveFileItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Preview / import confirmation state
  const [fileToImport, setFileToImport] = useState<{ file: DriveFileItem; parsedData: any; type: 'single' | 'all' } | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    // Listen for auth state
    const unsubscribe = initAuth(
      (authedUser, authedToken) => {
        setUser(authedUser);
        setToken(authedToken);
      },
      () => {
        setUser(null);
        setToken(null);
      }
    );

    return () => unsubscribe();
  }, []);

  // Fetch drive files when token is available
  useEffect(() => {
    if (token) {
      fetchFiles(token);
    }
  }, [token]);

  const showStatus = (type: 'success' | 'error' | 'info', text: string) => {
    setStatusMessage({ type, text });
    setTimeout(() => {
      setStatusMessage(null);
    }, 4500);
  };

  const fetchFiles = async (authToken?: string) => {
    const activeToken = authToken || token || (await getAccessToken());
    if (!activeToken) return;

    setIsLoadingFiles(true);
    try {
      const driveFiles = await listDriveFiles(activeToken, searchQuery);
      setFiles(driveFiles);
    } catch (err: any) {
      showStatus('error', err.message || 'Failed to list files from Google Drive');
    } finally {
      setIsLoadingFiles(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoggingIn(true);
    try {
      const res = await googleSignIn();
      if (res) {
        setUser(res.user);
        setToken(res.accessToken);
        showStatus('success', `Signed in as ${res.user.displayName || res.user.email}`);
        if (res.accessToken) {
          await fetchFiles(res.accessToken);
        }
      }
    } catch (err: any) {
      showStatus('error', err.message || 'Google sign-in failed. Please try again.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleSwitchAccount = async () => {
    setIsLoggingIn(true);
    try {
      const res = await switchGoogleAccount();
      if (res) {
        setUser(res.user);
        setToken(res.accessToken);
        showStatus('success', `Switched account to ${res.user.displayName || res.user.email}!`);
        if (res.accessToken) {
          await fetchFiles(res.accessToken);
        }
      }
    } catch (err: any) {
      showStatus('error', err.message || 'Failed to switch Google account');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleSignOut = async () => {
    await logout();
    setUser(null);
    setToken(null);
    setFiles([]);
    showStatus('info', 'Signed out of Google Drive');
  };

  // 1. Backup current match
  const handleBackupCurrentMatch = async () => {
    if (!token) {
      showStatus('error', 'Please sign in with Google first');
      return;
    }
    if (!currentMatch) {
      showStatus('error', 'No active match to backup');
      return;
    }

    setIsUploading(true);
    try {
      const fileName = `CricLive_${currentMatch.teamA.shortName}_vs_${currentMatch.teamB.shortName}_${Date.now()}.json`;
      const description = `CricLive Match: ${currentMatch.matchTitle} - ${currentMatch.seriesName}`;
      await uploadJsonToDrive(token, fileName, currentMatch, description);
      showStatus('success', `Backed up "${currentMatch.matchTitle}" to Google Drive!`);
      await fetchFiles(token);
    } catch (err: any) {
      showStatus('error', err.message || 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  // 2. Backup all matches & fixtures
  const handleBackupAllMatches = async () => {
    if (!token) {
      showStatus('error', 'Please sign in with Google first');
      return;
    }

    setIsUploading(true);
    try {
      const timestamp = new Date().toISOString().slice(0, 10);
      const fileName = `CricLive_All_Fixtures_${timestamp}_${Date.now()}.json`;
      const payload = {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        totalMatches: allMatches.length,
        matches: allMatches,
      };
      await uploadJsonToDrive(token, fileName, payload, 'Complete CricLive tournament fixtures archive');
      showStatus('success', `Backed up all ${allMatches.length} matches to Google Drive!`);
      await fetchFiles(token);
    } catch (err: any) {
      showStatus('error', err.message || 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  // 3. Export formatted scorecard text to Google Drive
  const handleExportScorecardReport = async () => {
    if (!token) {
      showStatus('error', 'Please sign in with Google first');
      return;
    }
    if (!currentMatch) {
      showStatus('error', 'No active match to export');
      return;
    }

    setIsUploading(true);
    try {
      const inn1 = currentMatch.innings[0];
      const inn2 = currentMatch.innings[1];
      const t1 = getBattingTeam(currentMatch, 1).team;
      const t2 = getBattingTeam(currentMatch, 2).team;

      let report = `=====================================================\n`;
      report += `  CRICLIVE OFFICIAL MATCH SCORECARD REPORT\n`;
      report += `=====================================================\n`;
      report += `Match: ${currentMatch.matchTitle}\n`;
      report += `Series: ${currentMatch.seriesName}\n`;
      report += `Venue: ${currentMatch.venue}\n`;
      report += `Date: ${currentMatch.matchDate}\n`;
      report += `Pitch: ${currentMatch.pitchType}\n`;
      report += `Status: ${currentMatch.status.toUpperCase()}\n`;
      if (currentMatch.resultSummary) {
        report += `Result: ${currentMatch.resultSummary}\n`;
      }
      report += `\n-----------------------------------------------------\n`;
      report += `1st Innings: ${t1.name}\n`;
      if (inn1) {
        report += `Score: ${inn1.totalRuns}/${inn1.totalWickets} (${formatOvers(inn1.legalBallsBowled)} Overs)\n`;
        report += `CRR: ${calculateCRR(inn1.totalRuns, inn1.legalBallsBowled)}\n\n`;
        report += `Batting Summary:\n`;
        (Object.values(inn1.battingScorecard) as BatsmanStats[]).forEach((b) => {
          if (b.balls > 0 || b.isOut) {
            report += `  - ${b.playerName.padEnd(20)} ${b.runs} (${b.balls}b, 4s:${b.fours}, 6s:${b.sixes}) SR: ${b.strikeRate} [${b.isOut ? (b.dismissalInfo || 'out') : 'not out'}]\n`;
          }
        });
        report += `\nBowling Summary:\n`;
        (Object.values(inn1.bowlingScorecard) as BowlerStats[]).forEach((b) => {
          if (b.overs > 0 || b.runsConceded > 0) {
            report += `  - ${b.playerName.padEnd(20)} ${b.overs} ov, ${b.maidens} mdn, ${b.runsConceded} runs, ${b.wickets} wkts (Econ: ${b.economy})\n`;
          }
        });
      }

      if (inn2) {
        report += `\n-----------------------------------------------------\n`;
        report += `2nd Innings: ${t2.name}\n`;
        report += `Score: ${inn2.totalRuns}/${inn2.totalWickets} (${formatOvers(inn2.legalBallsBowled)} Overs)\n`;
        report += `CRR: ${calculateCRR(inn2.totalRuns, inn2.legalBallsBowled)}\n\n`;
        report += `Batting Summary:\n`;
        (Object.values(inn2.battingScorecard) as BatsmanStats[]).forEach((b) => {
          if (b.balls > 0 || b.isOut) {
            report += `  - ${b.playerName.padEnd(20)} ${b.runs} (${b.balls}b, 4s:${b.fours}, 6s:${b.sixes}) SR: ${b.strikeRate} [${b.isOut ? (b.dismissalInfo || 'out') : 'not out'}]\n`;
          }
        });
      }

      report += `\n=====================================================\n`;
      report += `Generated with CricLive Cricket Engine\n`;

      const fileName = `Scorecard_${currentMatch.teamA.shortName}_vs_${currentMatch.teamB.shortName}_${Date.now()}.txt`;
      await uploadTextReportToDrive(token, fileName, report);
      showStatus('success', 'Match scorecard report uploaded to Google Drive!');
      await fetchFiles(token);
    } catch (err: any) {
      showStatus('error', err.message || 'Failed to export scorecard');
    } finally {
      setIsUploading(false);
    }
  };

  // Inspect and prepare file import
  const handleInspectFile = async (file: DriveFileItem) => {
    if (!token) return;
    setIsDownloading(true);
    try {
      const content = await downloadDriveFile(token, file.id);
      let parsed: any;
      try {
        parsed = JSON.parse(content);
      } catch (e) {
        showStatus('error', 'Selected file is not a valid JSON cricket match archive');
        return;
      }

      if (parsed.matches && Array.isArray(parsed.matches)) {
        setFileToImport({ file, parsedData: parsed.matches, type: 'all' });
      } else if (parsed.id && parsed.teamA && parsed.teamB) {
        setFileToImport({ file, parsedData: parsed, type: 'single' });
      } else {
        showStatus('error', 'File does not contain valid CricLive match records');
      }
    } catch (err: any) {
      showStatus('error', err.message || 'Could not download file content');
    } finally {
      setIsDownloading(false);
    }
  };

  // Confirm import
  const handleConfirmImport = () => {
    if (!fileToImport) return;
    if (fileToImport.type === 'all') {
      onImportAllMatches(fileToImport.parsedData);
      showStatus('success', `Restored ${fileToImport.parsedData.length} matches from Google Drive!`);
    } else {
      onImportMatch(fileToImport.parsedData);
      showStatus('success', `Loaded "${fileToImport.parsedData.matchTitle}" into live session!`);
    }
    setFileToImport(null);
  };

  // Confirmed Destructive Delete
  const handleExecuteDelete = async () => {
    if (!token || !fileToDelete) return;
    setIsDeleting(true);
    try {
      await deleteDriveFile(token, fileToDelete.id);
      showStatus('success', `Deleted "${fileToDelete.name}" from Google Drive.`);
      setFiles((prev) => prev.filter((f) => f.id !== fileToDelete.id));
      setFileToDelete(null);
    } catch (err: any) {
      showStatus('error', err.message || 'Failed to delete file');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="p-3.5 sm:p-5 space-y-4 pb-20">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 shadow-md">
            <HardDrive className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white font-['Outfit'] flex items-center gap-1.5">
              Google Drive Cloud Sync
            </h2>
            <p className="text-[11px] text-slate-400">
              Backup matches, export scorecards, & restore fixtures
            </p>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="text-xs px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 hover:text-white transition-colors"
          >
            Done
          </button>
        )}
      </div>

      {/* Status notification toast */}
      {statusMessage && (
        <div
          className={`p-3 rounded-xl text-xs flex items-center gap-2 border transition-all ${
            statusMessage.type === 'success'
              ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300'
              : statusMessage.type === 'error'
              ? 'bg-rose-950/80 border-rose-500/40 text-rose-300'
              : 'bg-sky-950/80 border-sky-500/40 text-sky-300'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <Check className="w-4 h-4 shrink-0 text-emerald-400" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          )}
          <span className="flex-1">{statusMessage.text}</span>
        </div>
      )}

      {/* Account / Google Auth Card */}
      <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 shadow-lg">
        {!user ? (
          <div className="text-center py-3 space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto border border-slate-700">
              <Cloud className="w-6 h-6 text-sky-400" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-white">Connect Google Drive</h3>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                Sign in to save ball-by-ball scorecards, export reports, and restore match fixtures anytime.
              </p>
            </div>

            {/* Official Google Sign-in Button */}
            <button
              id="google-signin-button"
              onClick={handleGoogleSignIn}
              disabled={isLoggingIn}
              className="inline-flex items-center gap-3 px-5 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-800 font-semibold text-xs shadow-md transition-all disabled:opacity-60 cursor-pointer"
            >
              <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-4 h-4">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
              </svg>
              <span>{isLoggingIn ? 'Connecting...' : 'Sign in with Google'}</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'Google User'}
                  className="w-10 h-10 rounded-full border border-emerald-500/40 object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-emerald-600/30 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold">
                  {(user.displayName || user.email || 'U')[0].toUpperCase()}
                </div>
              )}
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-white">{user.displayName || 'Google Account'}</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse"></span>
                </div>
                <p className="text-[11px] text-slate-400 truncate max-w-[190px]">{user.email}</p>
                <span className="text-[9px] text-sky-400 font-mono">
                  {token ? 'Google Drive Connected' : 'Google Account Signed In (Click Authorize Drive)'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                id="drive-switch-user-button"
                onClick={handleSwitchAccount}
                disabled={isLoggingIn}
                className="py-1.5 px-2.5 rounded-xl bg-sky-600/20 hover:bg-sky-600/30 text-sky-400 border border-sky-500/30 transition-colors flex items-center gap-1 text-xs cursor-pointer"
                title="Log in with another Google user"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline text-[11px]">Switch User</span>
              </button>

              <button
                onClick={handleSignOut}
                className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-rose-400 border border-slate-700/60 transition-colors flex items-center gap-1 text-xs cursor-pointer"
                title="Sign out of Google"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign out</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* If signed in to Google but Drive token not yet granted */}
      {user && !token && (
        <div className="p-3 rounded-2xl bg-amber-950/40 border border-amber-500/30 flex items-center justify-between gap-3 text-xs">
          <div>
            <div className="font-bold text-amber-300">Google Drive Permission Required</div>
            <p className="text-[11px] text-slate-400">Grant Drive access to backup match records and scorecards</p>
          </div>
          <button
            onClick={handleGoogleSignIn}
            disabled={isLoggingIn}
            className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shrink-0 cursor-pointer"
          >
            Authorize Drive
          </button>
        </div>
      )}

      {/* Cloud Backup & Export Actions (Only when signed in) */}
      {user && (
        <div className="space-y-2">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">
            Drive Cloud Actions
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {/* Action 1: Current Match Backup */}
            <button
              onClick={handleBackupCurrentMatch}
              disabled={isUploading || !currentMatch}
              className="p-3 rounded-2xl bg-slate-900/90 hover:bg-slate-850 border border-slate-800 text-left transition-all hover:border-emerald-500/40 disabled:opacity-50 group cursor-pointer"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="w-7 h-7 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
                  <Upload className="w-3.5 h-3.5" />
                </div>
                <span className="text-[10px] text-slate-500 font-mono">.JSON</span>
              </div>
              <div className="text-xs font-bold text-white">Backup Active Match</div>
              <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                {currentMatch ? `${currentMatch.teamA.shortName} vs ${currentMatch.teamB.shortName}` : 'No match selected'}
              </p>
            </button>

            {/* Action 2: Export Scorecard Report */}
            <button
              onClick={handleExportScorecardReport}
              disabled={isUploading || !currentMatch}
              className="p-3 rounded-2xl bg-slate-900/90 hover:bg-slate-850 border border-slate-800 text-left transition-all hover:border-sky-500/40 disabled:opacity-50 group cursor-pointer"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="w-7 h-7 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 group-hover:scale-105 transition-transform">
                  <FileText className="w-3.5 h-3.5" />
                </div>
                <span className="text-[10px] text-slate-500 font-mono">.TXT</span>
              </div>
              <div className="text-xs font-bold text-white">Export Scorecard</div>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Formatted match dossier to Drive
              </p>
            </button>

            {/* Action 3: Backup All Fixtures */}
            <button
              onClick={handleBackupAllMatches}
              disabled={isUploading || allMatches.length === 0}
              className="p-3 rounded-2xl bg-slate-900/90 hover:bg-slate-850 border border-slate-800 text-left transition-all hover:border-amber-500/40 disabled:opacity-50 group cursor-pointer"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="w-7 h-7 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform">
                  <FolderArchive className="w-3.5 h-3.5" />
                </div>
                <span className="text-[10px] text-slate-500 font-mono">{allMatches.length} matches</span>
              </div>
              <div className="text-xs font-bold text-white">Full Tournament Archive</div>
              <p className="text-[10px] text-slate-400 mt-0.5">
                All fixtures & squad states
              </p>
            </button>
          </div>
        </div>
      )}

      {/* Drive File Browser (Only when signed in) */}
      {user && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Google Drive Files
            </span>

            <div className="flex items-center gap-1">
              <button
                onClick={() => fetchFiles()}
                disabled={isLoadingFiles}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                title="Refresh files"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingFiles ? 'animate-spin text-emerald-400' : ''}`} />
              </button>
            </div>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search files in Google Drive..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchFiles()}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 pl-9 pr-8 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-sky-500/60"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  fetchFiles();
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 hover:text-white"
              >
                Clear
              </button>
            )}
          </div>

          {/* Files List */}
          <div className="bg-slate-900/80 rounded-2xl border border-slate-800 overflow-hidden divide-y divide-slate-800/80">
            {isLoadingFiles ? (
              <div className="p-8 text-center text-slate-500 space-y-2">
                <RefreshCw className="w-5 h-5 animate-spin mx-auto text-sky-400" />
                <p className="text-xs">Loading files from Google Drive...</p>
              </div>
            ) : files.length === 0 ? (
              <div className="p-8 text-center text-slate-500 space-y-2">
                <Cloud className="w-8 h-8 mx-auto text-slate-600" />
                <p className="text-xs">No files found in Google Drive.</p>
                <p className="text-[11px] text-slate-600">Use the buttons above to backup matches or fixtures.</p>
              </div>
            ) : (
              files.map((file) => {
                const isCricLiveJson = file.name.toLowerCase().includes('criclive') && file.name.endsWith('.json');
                const isScorecard = file.name.toLowerCase().includes('scorecard');

                return (
                  <div key={file.id} className="p-2.5 flex items-center justify-between hover:bg-slate-850 transition-colors gap-2 text-xs">
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center shrink-0">
                        {isScorecard ? (
                          <FileText className="w-3.5 h-3.5 text-sky-400" />
                        ) : isCricLiveJson ? (
                          <Database className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Cloud className="w-3.5 h-3.5 text-slate-400" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-slate-200 truncate" title={file.name}>
                          {file.name}
                        </div>
                        <div className="text-[10px] text-slate-500 flex items-center gap-2 font-mono">
                          <span>{formatFileSize(file.size)}</span>
                          <span>•</span>
                          <span>{new Date(file.modifiedTime).toLocaleDateString()}</span>
                          {isCricLiveJson && (
                            <span className="text-[9px] px-1 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                              Restoreable
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1 shrink-0">
                      {/* Restore / Preview Button if JSON */}
                      {isCricLiveJson && (
                        <button
                          onClick={() => handleInspectFile(file)}
                          disabled={isDownloading}
                          className="px-2 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 text-[11px] font-medium flex items-center gap-1 transition-colors"
                          title="Restore into CricLive"
                        >
                          <ArrowDownToLine className="w-3 h-3" />
                          <span className="hidden sm:inline">Restore</span>
                        </button>
                      )}

                      {/* Open in Drive link */}
                      {file.webViewLink && (
                        <a
                          href={file.webViewLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-sky-400 hover:bg-slate-800 transition-colors"
                          title="Open in Google Drive"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}

                      {/* Delete button (Triggers Mandatory User Confirmation Dialog) */}
                      <button
                        onClick={() => setFileToDelete(file)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                        title="Delete from Google Drive"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MANDATORY USER CONFIRMATION DIALOG FOR DELETION */}
      {/* (Enforces explicit approval before destructive API operations) */}
      {/* ======================================================== */}
      {fileToDelete && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-slate-900 rounded-3xl border border-rose-500/40 p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="text-base font-bold text-white">Delete file from Google Drive?</h3>
              <p className="text-xs text-slate-300">
                You are about to permanently delete:
              </p>
              <div className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-rose-300 truncate">
                {fileToDelete.name}
              </div>
              <p className="text-[11px] text-slate-500">
                This action cannot be undone. Are you sure you want to proceed?
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={() => setFileToDelete(null)}
                disabled={isDeleting}
                className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteDelete}
                disabled={isDeleting}
                className="py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-colors shadow-lg shadow-rose-950 flex items-center justify-center gap-1.5"
              >
                {isDeleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog for Importing Data from Drive */}
      {fileToImport && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-slate-900 rounded-3xl border border-emerald-500/40 p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto">
              <ArrowDownToLine className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="text-base font-bold text-white">
                {fileToImport.type === 'all' ? 'Restore Tournament Fixtures?' : 'Load Match into Live Session?'}
              </h3>
              <p className="text-xs text-slate-300">
                {fileToImport.type === 'all'
                  ? `This file contains ${fileToImport.parsedData.length} match fixtures.`
                  : `Match: ${fileToImport.parsedData.matchTitle || 'Cricket Match'}`}
              </p>
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-left text-xs space-y-1 font-mono">
                <div className="text-slate-400">File: <span className="text-slate-200">{fileToImport.file.name}</span></div>
                {fileToImport.type === 'single' && (
                  <>
                    <div className="text-slate-400">
                      Teams: <span className="text-emerald-400 font-bold">{fileToImport.parsedData.teamA?.shortName} vs {fileToImport.parsedData.teamB?.shortName}</span>
                    </div>
                    <div className="text-slate-400">Venue: <span className="text-slate-300">{fileToImport.parsedData.venue}</span></div>
                  </>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={() => setFileToImport(null)}
                className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmImport}
                className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors shadow-lg shadow-emerald-950"
              >
                {fileToImport.type === 'all' ? 'Restore All' : 'Load Match'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
