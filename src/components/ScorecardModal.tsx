import React, { useState } from 'react';
import { 
  FileText, 
  Share2, 
  Check, 
  ChevronRight, 
  Award,
  Users,
  Cloud,
  FileDown,
  Download
} from 'lucide-react';
import { Match, Innings } from '../types';
import { formatOvers, calculateCRR, getBattingTeam, getBowlingTeam, getPlayerById } from '../utils/cricketEngine';
import { exportScorecardToPDF } from '../utils/pdfExport';

interface ScorecardModalProps {
  match: Match;
  onClose?: () => void;
  onExportToDrive?: () => void;
}

export const ScorecardModal: React.FC<ScorecardModalProps> = ({ match, onClose, onExportToDrive }) => {
  const [selectedInningsIndex, setSelectedInningsIndex] = useState<0 | 1>(
    (match.currentInningsNumber - 1) as 0 | 1
  );
  const [copied, setCopied] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const inn: Innings | undefined = match.innings[selectedInningsIndex];
  const innNumber = (selectedInningsIndex + 1) as 1 | 2;
  const battingTeam = getBattingTeam(match, innNumber).team;
  const bowlingTeam = getBowlingTeam(match, innNumber).team;

  const handleDownloadPDF = () => {
    try {
      setDownloadingPdf(true);
      exportScorecardToPDF(match);
      setTimeout(() => setDownloadingPdf(false), 2000);
    } catch (err) {
      console.error('Failed to export PDF:', err);
      setDownloadingPdf(false);
    }
  };

  const handleShare = () => {
    if (!inn) return;
    const crr = calculateCRR(inn.totalRuns, inn.legalBallsBowled);
    const summary = `🏏 ${match.matchTitle}\n${battingTeam.name}: ${inn.totalRuns}/${inn.totalWickets} (${formatOvers(inn.legalBallsBowled)} ov, CRR: ${crr})\n${match.resultSummary || 'Match in progress'}\nLive score on CricLive`;
    
    if (navigator.clipboard) {
      navigator.clipboard.writeText(summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="p-3.5 sm:p-5 space-y-4 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white font-['Outfit']">Official Scorecard</h2>
            <p className="text-[11px] text-slate-400">{match.matchTitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Download PDF Button */}
          <button
            type="button"
            onClick={handleDownloadPDF}
            disabled={downloadingPdf}
            className="p-1.5 px-2.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 transition-all active:scale-95 flex items-center gap-1 text-xs font-semibold"
            title="Download full match scorecard in PDF format"
          >
            {downloadingPdf ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-300" />
                <span>Downloaded!</span>
              </>
            ) : (
              <>
                <FileDown className="w-3.5 h-3.5" />
                <span>Download PDF</span>
              </>
            )}
          </button>

          {onExportToDrive && (
            <button
              onClick={onExportToDrive}
              className="p-1.5 rounded-lg bg-sky-600/20 text-sky-400 hover:bg-sky-600/30 border border-sky-500/30 transition-colors flex items-center gap-1 text-xs"
              title="Backup / Export to Google Drive"
            >
              <Cloud className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Drive</span>
            </button>
          )}

          <button
            onClick={handleShare}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors flex items-center gap-1 text-xs"
            title="Copy match summary text"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5 text-slate-300" />}
            <span className="hidden sm:inline">{copied ? 'Copied' : 'Share'}</span>
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="text-xs px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
            >
              Done
            </button>
          )}
        </div>
      </div>

      {/* Innings Selector Tabs */}
      <div className="flex items-center gap-2 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
        <button
          onClick={() => setSelectedInningsIndex(0)}
          className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
            selectedInningsIndex === 0
              ? 'bg-slate-800 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          1st Inn: {getBattingTeam(match, 1).team.shortName}
          {match.innings[0] && ` (${match.innings[0].totalRuns}/${match.innings[0].totalWickets})`}
        </button>

        {match.innings[1] && (
          <button
            onClick={() => setSelectedInningsIndex(1)}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
              selectedInningsIndex === 1
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            2nd Inn: {getBattingTeam(match, 2).team.shortName}
            {match.innings[1] && ` (${match.innings[1].totalRuns}/${match.innings[1].totalWickets})`}
          </button>
        )}
      </div>

      {!inn ? (
        <div className="p-8 text-center text-slate-500 bg-slate-900/40 rounded-2xl border border-slate-800">
          Innings has not commenced yet.
        </div>
      ) : (
        <div className="space-y-4">
          {/* Innings Total Banner */}
          <div className="p-3.5 bg-gradient-to-r from-slate-900 to-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                {battingTeam.name} Innings
              </span>
              <div className="text-2xl font-extrabold text-white font-['Chakra_Petch']">
                {inn.totalRuns}/{inn.totalWickets}
                <span className="text-sm text-slate-400 font-normal ml-2 font-mono">
                  ({formatOvers(inn.legalBallsBowled)}/{inn.totalOversLimit} Ov)
                </span>
              </div>
            </div>
            <div className="text-right text-xs text-slate-400">
              <div>Run Rate: <strong className="text-emerald-400 font-mono">{calculateCRR(inn.totalRuns, inn.legalBallsBowled)}</strong></div>
              {inn.isCompleted && <span className="text-amber-400 text-[10px] font-bold">COMPLETED</span>}
            </div>
          </div>

          {/* Batting Table */}
          <div className="bg-slate-900/80 rounded-2xl border border-slate-800 overflow-hidden">
            <div className="p-2.5 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between text-[11px] font-bold text-slate-300 uppercase tracking-wider">
              <span>Batter</span>
              <div className="flex items-center gap-3 sm:gap-4 font-mono text-slate-400 pr-2">
                <span className="w-6 text-right text-white">R</span>
                <span className="w-6 text-right">B</span>
                <span className="w-5 text-right">4s</span>
                <span className="w-5 text-right">6s</span>
                <span className="w-10 text-right">SR</span>
              </div>
            </div>

            <div className="divide-y divide-slate-800/60">
              {battingTeam.players.map((p) => {
                const stats = inn.battingScorecard[p.id];
                const isStriker = p.id === inn.currentStrikerId && !inn.isCompleted;
                const isNonStriker = p.id === inn.currentNonStrikerId && !inn.isCompleted;
                const hasBatted = stats && (stats.balls > 0 || stats.isOut || isStriker || isNonStriker);

                if (!hasBatted) return null;

                return (
                  <div key={p.id} className="p-2.5 flex items-center justify-between text-xs hover:bg-slate-800/40 transition-colors">
                    <div className="max-w-[150px] sm:max-w-[190px]">
                      <div className="font-semibold text-white flex items-center gap-1 truncate">
                        {p.name}
                        {(isStriker || isNonStriker) && (
                          <span className="text-[9px] px-1 rounded bg-emerald-500/20 text-emerald-400 font-mono">
                            {isStriker ? '★' : ''}*
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">
                        {stats.isOut ? (stats.dismissalInfo || 'out') : 'not out'}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 sm:gap-4 font-mono text-xs pr-2">
                      <span className="w-6 text-right font-bold text-white">{stats.runs}</span>
                      <span className="w-6 text-right text-slate-400">{stats.balls}</span>
                      <span className="w-5 text-right text-slate-400">{stats.fours}</span>
                      <span className="w-5 text-right text-slate-400">{stats.sixes}</span>
                      <span className="w-10 text-right text-slate-300">{stats.strikeRate}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Extras Row */}
            <div className="p-2.5 bg-slate-950/40 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span>Extras (wd {inn.wides}, nb {inn.noBalls}, b {inn.byes}, lb {inn.legByes})</span>
              <span className="font-mono font-bold text-white pr-2">
                {inn.wides + inn.noBalls + inn.byes + inn.legByes}
              </span>
            </div>

            {/* Total Row */}
            <div className="p-2.5 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between text-xs font-bold text-white">
              <span>Total ({inn.totalWickets} wkts, {formatOvers(inn.legalBallsBowled)} Ov)</span>
              <span className="font-mono text-base text-emerald-400 pr-2">{inn.totalRuns}</span>
            </div>
          </div>

          {/* Fall of Wickets */}
          {inn.fallOfWickets.length > 0 && (
            <div className="bg-slate-900/80 p-3 rounded-2xl border border-slate-800 space-y-1.5">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Fall of Wickets
              </span>
              <div className="flex flex-wrap gap-2 text-xs">
                {inn.fallOfWickets.map((f) => (
                  <span key={f.wicketNumber} className="bg-slate-950 px-2 py-1 rounded-lg border border-slate-800 text-slate-300 font-mono text-[11px]">
                    <strong className="text-white">{f.score}/{f.wicketNumber}</strong> ({f.playerName}, {f.over} ov)
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Bowling Table */}
          <div className="bg-slate-900/80 rounded-2xl border border-slate-800 overflow-hidden">
            <div className="p-2.5 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between text-[11px] font-bold text-slate-300 uppercase tracking-wider">
              <span>Bowler</span>
              <div className="flex items-center gap-3 sm:gap-4 font-mono text-slate-400 pr-2">
                <span className="w-7 text-right text-white">O</span>
                <span className="w-5 text-right">M</span>
                <span className="w-6 text-right">R</span>
                <span className="w-5 text-right text-white">W</span>
                <span className="w-10 text-right">Econ</span>
              </div>
            </div>

            <div className="divide-y divide-slate-800/60">
              {bowlingTeam.players.map((p) => {
                const bStats = inn.bowlingScorecard[p.id];
                if (!bStats || (bStats.overs === 0 && bStats.runsConceded === 0)) return null;

                return (
                  <div key={p.id} className="p-2.5 flex items-center justify-between text-xs hover:bg-slate-800/40 transition-colors">
                    <div className="max-w-[150px] truncate font-semibold text-white">
                      {p.name}
                    </div>

                    <div className="flex items-center gap-3 sm:gap-4 font-mono text-xs pr-2">
                      <span className="w-7 text-right font-bold text-white">{bStats.overs}</span>
                      <span className="w-5 text-right text-slate-400">{bStats.maidens}</span>
                      <span className="w-6 text-right text-slate-400">{bStats.runsConceded}</span>
                      <span className="w-5 text-right font-bold text-emerald-400">{bStats.wickets}</span>
                      <span className="w-10 text-right text-slate-300">{bStats.economy}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Download Full Scorecard PDF Bottom Action Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-emerald-950/40 to-slate-900 border border-emerald-500/30 flex items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                <FileDown className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Full Scorecard (PDF Format)</h4>
                <p className="text-[11px] text-slate-400">Complete multi-innings batting, bowling, fall of wickets & match summary</p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleDownloadPDF}
              disabled={downloadingPdf}
              className="py-2 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-950 transition-all shrink-0 active:scale-95 disabled:opacity-50"
            >
              {downloadingPdf ? (
                <>
                  <Check className="w-4 h-4 text-emerald-200" />
                  <span>Downloaded!</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Download PDF</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
