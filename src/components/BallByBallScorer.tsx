import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { 
  RotateCcw, 
  ArrowLeftRight, 
  UserCheck, 
  MessageSquare, 
  AlertCircle, 
  ChevronRight, 
  Sparkles, 
  Award,
  Play,
  CheckCircle2,
  X,
  Pencil,
  Users,
  SlidersHorizontal,
  Check,
  Save,
  HelpCircle,
  Undo2
} from 'lucide-react';
import { Match, DismissalType, DashboardConfig, Player } from '../types';
import { 
  formatOvers, 
  calculateCRR, 
  calculateRRR, 
  getBattingTeam, 
  getBowlingTeam, 
  getPlayerById, 
  recordBall, 
  revertLastBall,
  startSecondInnings,
  updatePlayerName,
  changeActiveBatsmen
} from '../utils/cricketEngine';
import { cricketSound } from '../utils/audio';
import { EditSquadsModal } from './EditSquadsModal';
import { ChangeBatsmanModal } from './ChangeBatsmanModal';

interface BallByBallScorerProps {
  match: Match;
  onUpdateMatch: (updatedMatch: Match) => void;
  config: DashboardConfig;
  onOpenScorecard: () => void;
}

export const BallByBallScorer: React.FC<BallByBallScorerProps> = ({
  match,
  onUpdateMatch,
  config,
  onOpenScorecard,
}) => {
  // Undo history stack with sessionStorage persistence per match
  const [history, setHistory] = useState<Match[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = sessionStorage.getItem(`criclive_undo_stack_${match.id}`);
        if (stored) return JSON.parse(stored);
      } catch (e) {
        console.warn('Failed to parse saved undo stack', e);
      }
    }
    return [];
  });

  // Sync undo history to sessionStorage so navigating between tabs does not lose undo state
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem(`criclive_undo_stack_${match.id}`, JSON.stringify(history.slice(-30)));
      } catch (e) {
        console.warn('Failed to save undo stack', e);
      }
    }
  }, [history, match.id]);
  
  // Modals & form states
  const [showWicketModal, setShowWicketModal] = useState(false);
  const [wicketType, setWicketType] = useState<DismissalType>('caught');
  const [outPlayerId, setOutPlayerId] = useState<string>('');
  const [newBatsmanId, setNewBatsmanId] = useState<string>('');
  const [fielderName, setFielderName] = useState('');

  const [showBowlerModal, setShowBowlerModal] = useState(false);
  const [customCommentary, setCustomCommentary] = useState('');
  const [showCommentaryInput, setShowCommentaryInput] = useState(false);

  // Change Batsman States
  const [showChangeBatsmanModal, setShowChangeBatsmanModal] = useState(false);
  const [changeBatsmanTarget, setChangeBatsmanTarget] = useState<'both' | 'striker' | 'non_striker'>('both');

  // Player Editing States
  const [showEditSquadsModal, setShowEditSquadsModal] = useState(false);
  const [focusPlayerId, setFocusPlayerId] = useState<string | undefined>(undefined);
  const [focusTeamId, setFocusTeamId] = useState<string | undefined>(undefined);
  const [quickEditPlayer, setQuickEditPlayer] = useState<{ id: string; name: string; role?: Player['role'] } | null>(null);

  // Extras mode: default to 'wide_noball'
  const [extrasMode, setExtrasMode] = useState<'wide_noball' | 'all'>(
    config.extrasMode || 'wide_noball'
  );
  const [showExtrasSubModal, setShowExtrasSubModal] = useState<'wide' | 'no_ball' | null>(null);

  const [lastNotification, setLastNotification] = useState<string | null>(null);

  const currentInnings = match.innings[match.currentInningsNumber - 1];

  if (!currentInnings) {
    return (
      <div className="p-6 text-center text-slate-400">
        <AlertCircle className="w-8 h-8 mx-auto mb-2 text-amber-400" />
        <p>No active innings found for this match.</p>
      </div>
    );
  }

  const battingTeam = getBattingTeam(match).team;
  const bowlingTeam = getBowlingTeam(match).team;

  const striker = getPlayerById(match, currentInnings.currentStrikerId);
  const nonStriker = getPlayerById(match, currentInnings.currentNonStrikerId);
  const bowler = getPlayerById(match, currentInnings.currentBowlerId);

  const strikerStats = currentInnings.battingScorecard[currentInnings.currentStrikerId];
  const nonStrikerStats = currentInnings.battingScorecard[currentInnings.currentNonStrikerId];
  const bowlerStats = currentInnings.bowlingScorecard[currentInnings.currentBowlerId];

  // Eligible un-batted players for new batsman selection
  const remainingBatsmen = battingTeam.players.filter(
    (p) =>
      p.id !== currentInnings.currentStrikerId &&
      p.id !== currentInnings.currentNonStrikerId &&
      !currentInnings.battingScorecard[p.id]?.isOut
  );

  // Eligible bowlers from bowling team (excluding current bowler)
  const eligibleBowlers = bowlingTeam.players.filter(
    (p) => p.id !== currentInnings.currentBowlerId
  );

  // Ball Recording Handler
  const handleRecordBall = (
    runs: number,
    extraType?: 'wide' | 'no_ball' | 'bye' | 'leg_bye',
    extraRuns = 0,
    isWicket = false,
    wType?: DismissalType,
    outId?: string,
    nextBatId?: string,
    fielder?: string
  ) => {
    // Save current match to undo history
    setHistory((prev) => [...prev, JSON.parse(JSON.stringify(match))]);

    // Audio effects
    if (config.soundEnabled) {
      if (isWicket) {
        cricketSound.playWicket();
      } else if (runs === 4) {
        cricketSound.playBoundaryFour();
      } else if (runs === 6) {
        cricketSound.playSix();
      } else if (extraType) {
        cricketSound.playExtra();
      } else {
        cricketSound.playBatHit();
      }
    }

    // Confetti on big moments
    if (runs === 6 || runs === 4 || isWicket) {
      confetti({
        particleCount: isWicket ? 45 : runs === 6 ? 60 : 35,
        spread: 60,
        origin: { y: 0.7 },
        colors: isWicket ? ['#ef4444', '#dc2626', '#f87171'] : ['#3b82f6', '#10b981', '#f59e0b'],
      });
    }

    const res = recordBall(match, {
      runs,
      extraType,
      extraRuns,
      isWicket,
      wicketType: wType,
      outPlayerId: outId,
      newBatsmanId: nextBatId,
      fielderName: fielder,
      customCommentary: customCommentary.trim() || undefined,
    });

    onUpdateMatch(res.updatedMatch);
    setCustomCommentary('');
    setShowCommentaryInput(false);

    if (res.updatedMatch.status === 'completed') {
      confetti({ particleCount: 100, spread: 90, origin: { y: 0.5 } });
      setLastNotification(res.updatedMatch.resultSummary || 'Match Finished!');
    } else if (res.isOverFinished) {
      setLastNotification(res.message);
      setShowBowlerModal(true);
    } else {
      setLastNotification(res.message);
    }

    setTimeout(() => setLastNotification(null), 3500);
  };

  // Undo Ball with SessionStorage snapshot + Engine Revert Fallback
  const handleUndo = () => {
    // 1. Try saved snapshot from history stack
    if (history.length > 0) {
      const previous = history[history.length - 1];
      const newHistory = history.slice(0, history.length - 1);
      setHistory(newHistory);
      onUpdateMatch(previous);

      if (config.soundEnabled) cricketSound.playClick();
      if (config.hapticsEnabled && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate?.([20, 35, 20]);
      }

      const currInn = match.innings[match.currentInningsNumber - 1];
      const lastBall = currInn?.recentBalls?.[0];
      let desc = 'Ball reverted';
      if (lastBall) {
        if (lastBall.isWicket) desc = `Wicket (${lastBall.wicketType || 'Out'}) reverted`;
        else if (lastBall.isExtra) desc = `${lastBall.extraType?.toUpperCase()} extra reverted`;
        else desc = `${lastBall.runs} run(s) reverted`;
      }
      setLastNotification(`↩ Undo Successful: ${desc}`);
      setTimeout(() => setLastNotification(null), 3000);
      return;
    }

    // 2. Engine fallback if history array was cleared or reloaded
    if (currentInnings.recentBalls.length > 0) {
      const res = revertLastBall(match);
      if (res.revertedBall) {
        onUpdateMatch(res.updatedMatch);
        if (config.soundEnabled) cricketSound.playClick();
        if (config.hapticsEnabled && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
          navigator.vibrate?.([20, 35, 20]);
        }
        setLastNotification(`↩ Undo Successful: ${res.message}`);
        setTimeout(() => setLastNotification(null), 3000);
      }
      return;
    }

    setLastNotification('No previous balls to undo in this innings.');
    setTimeout(() => setLastNotification(null), 2500);
  };

  // Keyboard shortcut listener for fast scorer undo (Ctrl+Z or U)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        handleUndo();
      } else if (e.key.toLowerCase() === 'u' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        handleUndo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [history, match, currentInnings]);

  // Swap ends / rotate strike manually
  const handleSwapStrike = () => {
    const updated: Match = JSON.parse(JSON.stringify(match));
    const inn = updated.innings[updated.currentInningsNumber - 1];
    if (!inn) return;
    const temp = inn.currentStrikerId;
    inn.currentStrikerId = inn.currentNonStrikerId;
    inn.currentNonStrikerId = temp;
    onUpdateMatch(updated);
    if (config.soundEnabled) cricketSound.playClick();
    setLastNotification('Strike rotated between batsmen');
    setTimeout(() => setLastNotification(null), 2000);
  };

  // Change Batsmen (Openers or Crease Batsmen)
  const handleChangeBatsmen = (newStrikerId: string, newNonStrikerId: string) => {
    const updated = changeActiveBatsmen(match, {
      strikerId: newStrikerId,
      nonStrikerId: newNonStrikerId,
    });
    onUpdateMatch(updated);
    if (config.soundEnabled) cricketSound.playClick();
    const st = getPlayerById(updated, newStrikerId);
    const nst = getPlayerById(updated, newNonStrikerId);
    setLastNotification(`Batsmen set: ${st?.name || 'Striker'} (Strike) & ${nst?.name || 'Non-Striker'}`);
    setTimeout(() => setLastNotification(null), 3000);
  };

  // Quick edit player name
  const handleSaveQuickEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickEditPlayer || !quickEditPlayer.name.trim()) return;

    const updated = updatePlayerName(
      match,
      quickEditPlayer.id,
      quickEditPlayer.name.trim(),
      quickEditPlayer.role
    );
    onUpdateMatch(updated);
    setQuickEditPlayer(null);
    if (config.soundEnabled) cricketSound.playClick();
    setLastNotification(`Updated name to "${quickEditPlayer.name.trim()}"`);
    setTimeout(() => setLastNotification(null), 2500);
  };

  // Change bowler
  const handleChangeBowler = (newBowlerId: string) => {
    const updated: Match = JSON.parse(JSON.stringify(match));
    const inn = updated.innings[updated.currentInningsNumber - 1];
    if (!inn) return;
    inn.currentBowlerId = newBowlerId;
    onUpdateMatch(updated);
    setShowBowlerModal(false);
    if (config.soundEnabled) cricketSound.playClick();
    const newBowler = getPlayerById(match, newBowlerId);
    setLastNotification(`Bowler changed to ${newBowler?.name}`);
    setTimeout(() => setLastNotification(null), 2000);
  };

  // Confirm Wicket
  const handleConfirmWicket = (e: React.FormEvent) => {
    e.preventDefault();
    const targetOutId = outPlayerId || currentInnings.currentStrikerId;
    handleRecordBall(
      0,
      undefined,
      0,
      true,
      wicketType,
      targetOutId,
      newBatsmanId || undefined,
      fielderName.trim() || undefined
    );
    setShowWicketModal(false);
    setFielderName('');
    setNewBatsmanId('');
  };

  // Calculations for display
  const crr = calculateCRR(currentInnings.totalRuns, currentInnings.legalBallsBowled);
  const totalMaxBalls = currentInnings.totalOversLimit * 6;
  const ballsRemaining = Math.max(0, totalMaxBalls - currentInnings.legalBallsBowled);
  const target = match.target || (match.innings[0]?.totalRuns ? match.innings[0].totalRuns + 1 : undefined);
  const runsNeeded = target ? Math.max(0, target - currentInnings.totalRuns) : undefined;
  const rrr = target ? calculateRRR(target, currentInnings.totalRuns, ballsRemaining) : undefined;

  // Recent balls in current over
  const currentOverIndex = Math.floor(currentInnings.legalBallsBowled / 6);
  const overBalls = currentInnings.recentBalls
    .filter((b) => b.overIndex === currentOverIndex)
    .reverse();

  // Undo calculations and preview of the last ball to revert
  const lastBallEvent = currentInnings.recentBalls?.[0];
  const canUndo = history.length > 0 || currentInnings.recentBalls.length > 0;
  const undoCount = history.length > 0 ? history.length : currentInnings.recentBalls.length;

  let lastBallSummary = '';
  if (lastBallEvent) {
    if (lastBallEvent.isWicket) {
      lastBallSummary = `Wicket (${lastBallEvent.wicketType?.replace('_', ' ') || 'Out'})`;
    } else if (lastBallEvent.isExtra) {
      lastBallSummary = `${lastBallEvent.extraType?.toUpperCase()} (+${lastBallEvent.extraRuns || 1})`;
    } else {
      lastBallSummary = lastBallEvent.runs === 0 ? 'Dot (0)' : `${lastBallEvent.runs} run${lastBallEvent.runs > 1 ? 's' : ''}`;
    }
  }

  // Check if scoring has not started yet (0 balls bowled in this innings)
  const isBeforeScoring =
    currentInnings.legalBallsBowled === 0 &&
    currentInnings.recentBalls.length === 0 &&
    match.status !== 'completed' &&
    match.status !== 'innings_break';

  return (
    <div className="p-3.5 sm:p-5 space-y-3.5 pb-24">
      {/* Toast Notification Banner */}
      {lastNotification && (
        <div className="bg-emerald-600 text-white text-xs font-semibold px-3 py-2 rounded-xl shadow-lg flex items-center justify-between animate-fadeIn">
          <span>{lastNotification}</span>
          <button onClick={() => setLastNotification(null)}>
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Innings Finished / Match Completed Callout */}
      {match.status === 'innings_break' && (
        <div className="p-4 rounded-2xl bg-amber-950/60 border border-amber-600/60 text-center space-y-2">
          <Award className="w-8 h-8 text-amber-400 mx-auto" />
          <h3 className="text-sm font-bold text-white">Innings 1 Completed!</h3>
          <p className="text-xs text-amber-200">
            {battingTeam.name} scored {currentInnings.totalRuns}/{currentInnings.totalWickets} in {formatOvers(currentInnings.legalBallsBowled)} overs.
          </p>
          <p className="text-xs font-bold text-emerald-400">
            Target: {match.target} runs in {match.overs} overs
          </p>
          <button
            onClick={() => {
              const updated = startSecondInnings(match);
              onUpdateMatch(updated);
            }}
            className="mt-2 py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg transition-all"
          >
            Start 2nd Innings Live Scoring
          </button>
        </div>
      )}

      {match.status === 'completed' && (
        <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-600/60 text-center space-y-2">
          <Sparkles className="w-8 h-8 text-emerald-400 mx-auto" />
          <h3 className="text-base font-bold text-white font-['Outfit']">Match Concluded!</h3>
          <p className="text-sm font-bold text-emerald-300">{match.resultSummary}</p>
          <button
            onClick={onOpenScorecard}
            className="py-1.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium inline-flex items-center gap-1.5"
          >
            View Full Official Scorecard <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Scorer Live Match Header Box */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 p-4 rounded-2xl border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="flex items-center justify-between text-xs mb-2">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
            <span className="font-bold text-slate-200 uppercase tracking-wider text-[11px]">
              {battingTeam.shortName} Batting (Inn {match.currentInningsNumber})
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="scorer-header-undo-btn"
              onClick={handleUndo}
              disabled={!canUndo}
              className="py-1 px-2.5 rounded-lg bg-slate-800 text-slate-300 disabled:opacity-30 hover:bg-slate-700 hover:text-white text-[11px] font-medium flex items-center gap-1.5 transition-all border border-slate-700/60"
              title={canUndo ? `Undo / Revert Last Ball (${lastBallSummary})` : 'No balls to undo'}
            >
              <RotateCcw className="w-3 h-3 text-amber-400" />
              <span>Undo ({undoCount})</span>
            </button>
            <button
              onClick={onOpenScorecard}
              className="text-[11px] text-emerald-400 hover:underline font-medium"
            >
              Scorecard
            </button>
          </div>
        </div>

        {/* Primary Score Numbers */}
        <div className="flex items-baseline justify-between py-1">
          <div>
            <div className="text-3xl sm:text-4xl font-extrabold text-white font-['Chakra_Petch'] tracking-tight">
              {currentInnings.totalRuns}
              <span className="text-slate-400 font-normal text-2xl">/{currentInnings.totalWickets}</span>
            </div>
            <div className="text-xs text-slate-400 font-mono mt-0.5">
              Overs: <span className="text-white font-bold">{formatOvers(currentInnings.legalBallsBowled)}</span> / {currentInnings.totalOversLimit}
            </div>
          </div>

          <div className="text-right text-xs space-y-0.5">
            <div className="text-slate-400">
              CRR: <span className="text-emerald-400 font-bold font-mono">{crr}</span>
            </div>
            {target && (
              <>
                <div className="text-amber-400 font-bold">
                  Target: {target}
                </div>
                <div className="text-[11px] text-slate-300 font-medium">
                  Need <span className="text-sky-400 font-bold">{runsNeeded}</span> in <span className="text-white font-bold">{ballsRemaining}</span>b (RRR {rrr})
                </div>
              </>
            )}
          </div>
        </div>

        {/* Over Timeline Balls */}
        <div className="mt-3 pt-2.5 border-t border-slate-800/80">
          <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5">
            <span>This Over:</span>
            <span className="font-mono text-slate-300">Over #{Math.floor(currentInnings.legalBallsBowled / 6) + 1}</span>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto py-1">
            {overBalls.length === 0 ? (
              <span className="text-xs text-slate-500 italic">No balls yet in this over</span>
            ) : (
              overBalls.map((b) => {
                let badgeStyle = 'bg-slate-800 text-slate-200 border-slate-700';
                let label = b.runs.toString();

                if (b.isWicket) {
                  badgeStyle = 'bg-red-600 text-white font-extrabold border-red-500 shadow-md shadow-red-950';
                  label = 'W';
                } else if (b.runs === 6) {
                  badgeStyle = 'bg-purple-600 text-white font-extrabold border-purple-400 shadow-md shadow-purple-950';
                  label = '6';
                } else if (b.runs === 4) {
                  badgeStyle = 'bg-sky-600 text-white font-extrabold border-sky-400 shadow-md shadow-sky-950';
                  label = '4';
                } else if (b.isExtra) {
                  badgeStyle = 'bg-amber-500 text-slate-950 font-bold border-amber-400';
                  label = b.extraType === 'wide' ? `${b.extraRuns}wd` : `${b.extraRuns}nb`;
                } else if (b.runs === 0) {
                  badgeStyle = 'bg-slate-900 text-slate-500 border-slate-800';
                  label = '•';
                }

                return (
                  <div
                    key={b.id}
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-mono font-bold border shrink-0 ${badgeStyle}`}
                    title={b.commentary}
                  >
                    {label}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Before Scoring Starts: Prominent Opening Pair Setup Bar */}
      {isBeforeScoring && (
        <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-emerald-950/70 via-slate-900 to-sky-950/60 border border-emerald-500/40 shadow-xl space-y-2.5 animate-fadeIn">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping shrink-0" />
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-emerald-400" />
                  <span>Ready to Start Scoring • Select Opening Pair</span>
                </h4>
                <p className="text-[11px] text-slate-300">
                  Verify or change opening batsmen before bowling Ball 1 of Innings {match.currentInningsNumber}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setChangeBatsmanTarget('both');
                  setShowChangeBatsmanModal(true);
                }}
                className="py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-950 transition-all active:scale-95"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Change Openers</span>
              </button>
              <button
                type="button"
                onClick={handleSwapStrike}
                className="py-1.5 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1 transition-all"
                title="Swap Striker and Non-Striker ends"
              >
                <ArrowLeftRight className="w-3 h-3" />
                <span>Swap Strike</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs pt-1 border-t border-slate-800/80">
            {/* Striker Quick Preview */}
            <div className="p-2.5 rounded-xl bg-slate-950/90 border border-emerald-500/40 flex items-center justify-between">
              <div className="min-w-0 pr-2">
                <div className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1">
                  <span>★ Striker (Facing 1st Ball)</span>
                </div>
                <div className="text-xs font-extrabold text-white truncate mt-0.5">
                  {striker?.name || 'Striker'}
                </div>
                <div className="text-[10px] text-slate-400 capitalize">
                  {striker?.role.replace('_', ' ') || 'Batsman'}
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setChangeBatsmanTarget('striker');
                  setShowChangeBatsmanModal(true);
                }}
                className="px-2 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-300 text-[11px] font-bold shrink-0 transition-colors"
              >
                Change
              </button>
            </div>

            {/* Non-Striker Quick Preview */}
            <div className="p-2.5 rounded-xl bg-slate-950/90 border border-slate-800 flex items-center justify-between">
              <div className="min-w-0 pr-2">
                <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                  Non-Striker (Runner End)
                </div>
                <div className="text-xs font-bold text-slate-200 truncate mt-0.5">
                  {nonStriker?.name || 'Non-Striker'}
                </div>
                <div className="text-[10px] text-slate-500 capitalize">
                  {nonStriker?.role.replace('_', ' ') || 'Batsman'}
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setChangeBatsmanTarget('non_striker');
                  setShowChangeBatsmanModal(true);
                }}
                className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-[11px] font-semibold shrink-0 transition-colors"
              >
                Change
              </button>
            </div>

            {/* Opening Bowler Quick Preview */}
            <div className="p-2.5 rounded-xl bg-slate-950/90 border border-sky-500/30 flex items-center justify-between">
              <div className="min-w-0 pr-2">
                <div className="text-[10px] text-sky-400 font-semibold uppercase tracking-wider">
                  Opening Bowler
                </div>
                <div className="text-xs font-bold text-white truncate mt-0.5">
                  {bowler?.name || 'Bowler'}
                </div>
                <div className="text-[10px] text-slate-400 capitalize">
                  {bowler?.role.replace('_', ' ') || 'Bowler'}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowBowlerModal(true)}
                className="px-2 py-1 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/30 text-sky-300 text-[11px] font-bold shrink-0 transition-colors"
              >
                Change
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Crease Live Status: Striker, Non-Striker & Bowler */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs px-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Live Pitch & Crease
          </span>
          <button
            type="button"
            onClick={() => {
              setFocusTeamId(battingTeam.id);
              setShowEditSquadsModal(true);
            }}
            className="text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 px-2.5 py-1 rounded-lg border border-emerald-500/30 transition-all active:scale-95"
            title="Edit all player names and squad roles"
          >
            <Users className="w-3.5 h-3.5" />
            <span>Edit Squad & Players</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {/* Batsmen on Crease */}
          <div className="bg-slate-900/80 p-3 rounded-2xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <span>Batsmen on Crease</span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setChangeBatsmanTarget('both');
                    setShowChangeBatsmanModal(true);
                  }}
                  className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 text-[11px] normal-case font-medium bg-emerald-500/10 hover:bg-emerald-500/20 px-2 py-0.5 rounded-lg border border-emerald-500/30 transition-all"
                  title="Change Striker or Non-Striker batsman"
                >
                  <UserCheck className="w-3 h-3" />
                  <span>Change Batsman</span>
                </button>
                <button
                  onClick={handleSwapStrike}
                  className="text-slate-300 hover:text-white flex items-center gap-1 text-[11px] normal-case"
                  title="Swap Striker and Non-Striker ends"
                >
                  <ArrowLeftRight className="w-3 h-3" />
                  <span>Swap Strike</span>
                </button>
              </div>
            </div>

            {/* Striker */}
            <div 
              className="p-2 rounded-xl bg-slate-950/80 border border-emerald-500/40 flex items-center justify-between hover:border-emerald-400 transition-colors"
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-emerald-400 font-bold text-xs shrink-0">★</span>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-white flex items-center gap-1.5 flex-wrap">
                    <span 
                      onClick={handleSwapStrike}
                      className="cursor-pointer hover:underline truncate"
                      title="Click to swap strike"
                    >
                      {striker?.name || 'Striker'}
                    </span>
                    <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-400 font-mono shrink-0">STRIKE</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setChangeBatsmanTarget('striker');
                        setShowChangeBatsmanModal(true);
                      }}
                      className="px-1.5 py-0.5 rounded-md bg-slate-800 hover:bg-emerald-500/20 border border-slate-700 hover:border-emerald-500/40 text-emerald-400 text-[10px] font-semibold flex items-center gap-1 transition-colors"
                      title="Change Striker Batsman"
                    >
                      <UserCheck className="w-2.5 h-2.5" />
                      <span>Change</span>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (striker) setQuickEditPlayer({ id: striker.id, name: striker.name, role: striker.role });
                      }}
                      className="p-1 rounded-md hover:bg-slate-800 text-slate-400 hover:text-emerald-400 transition-colors"
                      title="Edit Striker Name"
                    >
                      <Pencil className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="text-[10px] text-slate-400">
                    4s: {strikerStats?.fours || 0} • 6s: {strikerStats?.sixes || 0} • SR: {strikerStats?.strikeRate || 0}
                  </div>
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-sm font-extrabold text-white font-mono">
                  {strikerStats?.runs || 0}
                  <span className="text-xs text-slate-400 font-normal">({strikerStats?.balls || 0})</span>
                </div>
              </div>
            </div>

            {/* Non-Striker */}
            <div 
              className="p-2 rounded-xl bg-slate-950/50 border border-slate-800/80 flex items-center justify-between hover:border-slate-700 transition-colors"
            >
              <div className="min-w-0">
                <div className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 flex-wrap">
                  <span 
                    onClick={handleSwapStrike}
                    className="cursor-pointer hover:underline truncate"
                    title="Click to swap strike"
                  >
                    {nonStriker?.name || 'Non-Striker'}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setChangeBatsmanTarget('non_striker');
                      setShowChangeBatsmanModal(true);
                    }}
                    className="px-1.5 py-0.5 rounded-md bg-slate-800 hover:bg-sky-500/20 border border-slate-700 hover:border-sky-500/40 text-slate-300 hover:text-sky-300 text-[10px] font-semibold flex items-center gap-1 transition-colors"
                    title="Change Non-Striker Batsman"
                  >
                    <UserCheck className="w-2.5 h-2.5" />
                    <span>Change</span>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (nonStriker) setQuickEditPlayer({ id: nonStriker.id, name: nonStriker.name, role: nonStriker.role });
                    }}
                    className="p-1 rounded-md hover:bg-slate-800 text-slate-400 hover:text-emerald-400 transition-colors"
                    title="Edit Non-Striker Name"
                  >
                    <Pencil className="w-3 h-3" />
                  </button>
                </div>
                <div className="text-[10px] text-slate-500">
                  4s: {nonStrikerStats?.fours || 0} • 6s: {nonStrikerStats?.sixes || 0} • SR: {nonStrikerStats?.strikeRate || 0}
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-sm font-bold text-slate-300 font-mono">
                  {nonStrikerStats?.runs || 0}
                  <span className="text-xs text-slate-500 font-normal">({nonStrikerStats?.balls || 0})</span>
                </div>
              </div>
            </div>
          </div>

          {/* Active Bowler */}
          <div className="bg-slate-900/80 p-3 rounded-2xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <span>Current Bowler</span>
              <button
                onClick={() => setShowBowlerModal(true)}
                className="text-sky-400 hover:text-sky-300 flex items-center gap-1 text-[11px] normal-case"
              >
                <UserCheck className="w-3 h-3" />
                Change Bowler
              </button>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
              <div className="min-w-0">
                <div className="text-xs font-bold text-white flex items-center gap-1.5 flex-wrap">
                  <span className="truncate">{bowler?.name || 'Bowler'}</span>
                  <button
                    type="button"
                    onClick={() => {
                      if (bowler) setQuickEditPlayer({ id: bowler.id, name: bowler.name, role: bowler.role });
                    }}
                    className="p-1 rounded-md hover:bg-slate-800 text-slate-400 hover:text-sky-400 transition-colors"
                    title="Edit Bowler Name"
                  >
                    <Pencil className="w-3 h-3" />
                  </button>
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Overs: {bowlerStats?.overs || '0.0'} • Maidens: {bowlerStats?.maidens || 0} • Dots: {bowlerStats?.dots || 0}
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-sm font-extrabold text-sky-400 font-mono">
                  {bowlerStats?.wickets || 0}/{bowlerStats?.runsConceded || 0}
                </div>
                <div className="text-[10px] text-slate-400">
                  Econ: <span className="text-slate-200 font-mono">{bowlerStats?.economy || '0.00'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Optional Ball Commentary Input Bar */}
      {showCommentaryInput ? (
        <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800 flex items-center gap-2">
          <input
            type="text"
            placeholder="Type custom ball commentary..."
            value={customCommentary}
            onChange={(e) => setCustomCommentary(e.target.value)}
            className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
          <button
            onClick={() => setShowCommentaryInput(false)}
            className="text-xs text-slate-400 px-2 py-1"
          >
            Cancel
          </button>
        </div>
      ) : (
        <div className="flex justify-end">
          <button
            onClick={() => setShowCommentaryInput(true)}
            className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center gap-1"
          >
            <MessageSquare className="w-3 h-3" />
            + Add Custom Ball Note
          </button>
        </div>
      )}

      {/* Main Scorer Controls Panel */}
      <div className="bg-slate-900 p-3.5 rounded-2xl border border-slate-800 shadow-2xl space-y-3">
        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
          <span>Upload Ball-to-Ball Score</span>
          <span className="text-emerald-400 text-[10px]">Instant Live Sync</span>
        </div>

        {/* Runs Keypad: 0, 1, 2, 3, 4, 6 */}
        <div className="grid grid-cols-6 gap-1.5 sm:gap-2">
          {[
            { val: 0, label: '0', sub: 'Dot', color: 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700' },
            { val: 1, label: '1', sub: 'Single', color: 'bg-slate-800 hover:bg-slate-700 text-emerald-400 border-slate-700' },
            { val: 2, label: '2', sub: 'Double', color: 'bg-slate-800 hover:bg-slate-700 text-emerald-400 border-slate-700' },
            { val: 3, label: '3', sub: 'Three', color: 'bg-slate-800 hover:bg-slate-700 text-emerald-400 border-slate-700' },
            { val: 4, label: '4', sub: 'FOUR', color: 'bg-sky-900/80 hover:bg-sky-800 text-sky-200 border-sky-600 font-extrabold' },
            { val: 6, label: '6', sub: 'SIX', color: 'bg-purple-900/80 hover:bg-purple-800 text-purple-200 border-purple-500 font-extrabold' },
          ].map((btn) => (
            <button
              key={btn.val}
              onClick={() => handleRecordBall(btn.val)}
              className={`h-14 rounded-xl border flex flex-col items-center justify-center transition-all active:scale-95 shadow-md ${btn.color}`}
            >
              <span className="text-lg font-bold font-['Chakra_Petch'] leading-none">{btn.label}</span>
              <span className="text-[9px] text-slate-400 font-medium uppercase mt-0.5">{btn.sub}</span>
            </button>
          ))}
        </div>

        {/* Quick Actions Row: Prominent Undo Button & Quick Strike Swap */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
          {/* Main Scorer Undo Button */}
          <button
            id="scorer-undo-button"
            type="button"
            onClick={handleUndo}
            disabled={!canUndo}
            className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-slate-800 via-slate-800 to-slate-850 hover:from-slate-750 hover:to-slate-800 border-2 border-slate-700 hover:border-amber-500/70 text-slate-200 font-bold text-xs flex items-center justify-between active:scale-95 transition-all shadow-md group disabled:opacity-40 disabled:pointer-events-none"
            title={canUndo ? `Undo / Revert last recorded ball (Hotkey: Ctrl+Z or U) - ${lastBallSummary}` : 'No balls to undo'}
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:bg-amber-500/20 group-hover:-rotate-45 transition-all shrink-0">
                <RotateCcw className="w-4 h-4" />
              </div>
              <div className="text-left min-w-0">
                <div className="flex items-center gap-1.5 leading-tight">
                  <span className="text-white font-bold tracking-wide">UNDO LAST BALL</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 font-mono font-bold">
                    {undoCount}
                  </span>
                </div>
                <div className="text-[10px] text-amber-300/80 font-mono mt-0.5 truncate max-w-[170px]">
                  {canUndo ? `Reverts: ${lastBallSummary || 'Last entry'}` : 'No balls recorded yet'}
                </div>
              </div>
            </div>
            <span className="hidden sm:inline-block text-[10px] font-mono text-slate-400 bg-slate-900/90 px-1.5 py-0.5 rounded border border-slate-800 shrink-0">
              Ctrl+Z / U
            </span>
          </button>

          {/* Quick Strike Rotation */}
          <button
            id="scorer-swap-strike-button"
            type="button"
            onClick={handleSwapStrike}
            className="py-2.5 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-750 border border-slate-700 hover:border-emerald-500/50 text-slate-200 font-bold text-xs flex items-center justify-between active:scale-95 transition-all shadow-sm group"
            title="Rotate / Swap Strike between batsmen"
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500/20 transition-all shrink-0">
                <ArrowLeftRight className="w-4 h-4" />
              </div>
              <div className="text-left min-w-0">
                <div className="text-white font-bold tracking-wide leading-tight">SWAP STRIKE</div>
                <div className="text-[10px] text-emerald-400/90 font-medium mt-0.5 truncate max-w-[170px]">
                  ★ {striker?.name?.split(' ')?.[0] || 'Striker'} ⇄ {nonStriker?.name?.split(' ')?.[0] || 'Non'}
                </div>
              </div>
            </div>
            <span className="text-[10px] text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800 shrink-0">
              Ends
            </span>
          </button>
        </div>

        {/* Extras Options Strip with Mode Selector */}
        <div className="pt-1 space-y-2">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <span>Extras Scoring</span>
              <span className="text-[10px] text-amber-400 font-mono">
                {extrasMode === 'wide_noball' ? '(Wide & NB Only)' : '(Full Extras)'}
              </span>
            </span>

            {/* Mode Switcher */}
            <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800">
              <button
                type="button"
                onClick={() => setExtrasMode('wide_noball')}
                className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                  extrasMode === 'wide_noball'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Only Wide & No Ball (Street/Gully/Tape-Ball rules)"
              >
                ⚡ Only Wide & NB
              </button>
              <button
                type="button"
                onClick={() => setExtrasMode('all')}
                className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                  extrasMode === 'all'
                    ? 'bg-slate-700 text-white border border-slate-600 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="All Extras (ICC Rules with Leg Bye & Bye)"
              >
                All Extras
              </button>
            </div>
          </div>

          {/* Primary Extras Buttons */}
          {extrasMode === 'wide_noball' ? (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                {/* Wide Only (+1) */}
                <button
                  type="button"
                  onClick={() => handleRecordBall(0, 'wide', 0)}
                  className="py-3 px-3 rounded-xl bg-gradient-to-r from-amber-950/80 to-amber-900/60 hover:from-amber-900 hover:to-amber-800 border-2 border-amber-500/70 text-amber-300 font-bold text-xs flex flex-col items-center justify-center active:scale-95 transition-all shadow-md group"
                >
                  <span className="text-sm font-extrabold tracking-wide flex items-center gap-1">
                    <span>WIDE ONLY</span>
                    <span className="text-amber-200 font-mono text-sm">(+1)</span>
                  </span>
                  <span className="text-[10px] text-amber-400/90 font-normal">1 extra run • Ball not counted</span>
                </button>

                {/* No Ball Only (+1) */}
                <button
                  type="button"
                  onClick={() => handleRecordBall(0, 'no_ball', 0)}
                  className="py-3 px-3 rounded-xl bg-gradient-to-r from-orange-950/80 to-orange-900/60 hover:from-orange-900 hover:to-orange-800 border-2 border-orange-500/70 text-orange-300 font-bold text-xs flex flex-col items-center justify-center active:scale-95 transition-all shadow-md group"
                >
                  <span className="text-sm font-extrabold tracking-wide flex items-center gap-1">
                    <span>NO BALL ONLY</span>
                    <span className="text-orange-200 font-mono text-sm">(+1)</span>
                  </span>
                  <span className="text-[10px] text-orange-400/90 font-normal">1 penalty run • Free Hit</span>
                </button>
              </div>

              {/* Wide & No Ball Run Options Bar */}
              <div className="bg-slate-950/80 p-2 rounded-xl border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span className="font-semibold text-amber-400">⚡ Wide Options:</span>
                  <button
                    type="button"
                    onClick={() => setShowExtrasSubModal('wide')}
                    className="text-amber-400 hover:text-amber-300 underline text-[10px]"
                  >
                    View details
                  </button>
                </div>
                <div className="grid grid-cols-4 gap-1">
                  {[
                    { runs: 0, extra: 0, label: 'Wd Only', score: '+1' },
                    { runs: 0, extra: 1, label: 'Wd + 1', score: '+2' },
                    { runs: 0, extra: 2, label: 'Wd + 2', score: '+3' },
                    { runs: 0, extra: 4, label: 'Wd + 4 (4s)', score: '+5' },
                  ].map((opt) => (
                    <button
                      key={opt.label}
                      type="button"
                      onClick={() => handleRecordBall(opt.runs, 'wide', opt.extra)}
                      className="py-1 px-1.5 rounded-lg bg-amber-950/30 hover:bg-amber-900/50 border border-amber-700/40 text-amber-300 text-[10px] font-bold text-center active:scale-95 transition-all truncate"
                    >
                      <span>{opt.label}</span>
                      <span className="text-slate-400 font-normal ml-0.5">({opt.score})</span>
                    </button>
                  ))}
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-900">
                  <span className="font-semibold text-orange-400">⚡ No Ball Options:</span>
                  <button
                    type="button"
                    onClick={() => setShowExtrasSubModal('no_ball')}
                    className="text-orange-400 hover:text-orange-300 underline text-[10px]"
                  >
                    View details
                  </button>
                </div>
                <div className="grid grid-cols-5 gap-1">
                  {[
                    { runs: 0, label: 'NB Only', score: '+1' },
                    { runs: 1, label: 'NB + 1', score: '+2' },
                    { runs: 2, label: 'NB + 2', score: '+3' },
                    { runs: 4, label: 'NB + 4s', score: '+5' },
                    { runs: 6, label: 'NB + 6s', score: '+7' },
                  ].map((opt) => (
                    <button
                      key={opt.label}
                      type="button"
                      onClick={() => handleRecordBall(opt.runs, 'no_ball', 0)}
                      className="py-1 px-1 rounded-lg bg-orange-950/30 hover:bg-orange-900/50 border border-orange-700/40 text-orange-300 text-[10px] font-bold text-center active:scale-95 transition-all truncate"
                    >
                      <span>{opt.label}</span>
                      <span className="text-slate-400 font-normal ml-0.5">({opt.score})</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* All Extras Mode: Wide, No Ball, Leg Bye, Bye */
            <div className="space-y-1.5">
              <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
                <button
                  type="button"
                  onClick={() => handleRecordBall(0, 'wide', 0)}
                  className="py-2.5 px-2 rounded-xl bg-amber-950/60 hover:bg-amber-900/70 border border-amber-600/70 text-amber-300 font-bold text-xs flex flex-col items-center justify-center active:scale-95 transition-all"
                >
                  <span>WIDE</span>
                  <span className="text-[9px] text-amber-400 font-normal">+1 Extra</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleRecordBall(0, 'no_ball', 0)}
                  className="py-2.5 px-2 rounded-xl bg-orange-950/60 hover:bg-orange-900/70 border border-orange-600/70 text-orange-300 font-bold text-xs flex flex-col items-center justify-center active:scale-95 transition-all"
                >
                  <span>NO BALL</span>
                  <span className="text-[9px] text-orange-400 font-normal">+1 Free Hit</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleRecordBall(1, 'leg_bye')}
                  className="py-2.5 px-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-semibold text-xs flex flex-col items-center justify-center active:scale-95 transition-all"
                >
                  <span>LEG BYE</span>
                  <span className="text-[9px] text-slate-400 font-normal">+1 LB</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleRecordBall(1, 'bye')}
                  className="py-2.5 px-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-semibold text-xs flex flex-col items-center justify-center active:scale-95 transition-all"
                >
                  <span>BYE</span>
                  <span className="text-[9px] text-slate-400 font-normal">+1 B</span>
                </button>
              </div>

              {/* Quick options buttons for wide & NB in all extras mode */}
              <div className="flex items-center justify-between text-[10px] text-slate-400 px-1 pt-0.5">
                <button
                  type="button"
                  onClick={() => setShowExtrasSubModal('wide')}
                  className="text-amber-400 hover:underline flex items-center gap-1"
                >
                  <span>+ Wide runs options</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowExtrasSubModal('no_ball')}
                  className="text-orange-400 hover:underline flex items-center gap-1"
                >
                  <span>+ No Ball runs options</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Wicket Dismissal Trigger Button */}
        <div className="pt-1 space-y-2">
          <button
            id="scorer-record-wicket-btn"
            onClick={() => {
              setOutPlayerId(currentInnings.currentStrikerId);
              setShowWicketModal(true);
            }}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-extrabold text-sm shadow-lg shadow-red-950/50 flex items-center justify-center gap-2 active:scale-98 transition-all tracking-wider"
          >
            <span className="text-base leading-none">⚡</span>
            RECORD WICKET (DISMISSAL)
          </button>

          {/* Undo Quick Assist Banner */}
          {canUndo && (
            <div className="flex items-center justify-between px-3 py-2 bg-slate-950/90 border border-slate-800/80 rounded-xl text-xs text-slate-400 shadow-inner">
              <div className="flex items-center gap-2 truncate">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0"></span>
                <span className="truncate">Scoring error on last ball?</span>
              </div>
              <button
                type="button"
                onClick={handleUndo}
                className="text-amber-400 hover:text-amber-300 font-bold hover:underline flex items-center gap-1 shrink-0 ml-2 text-[11px]"
              >
                <RotateCcw className="w-3 h-3" />
                Revert Last Entry
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Wicket Modal */}
      {showWicketModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-red-800/80 rounded-2xl w-full max-w-sm p-4 space-y-3.5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="text-sm font-bold text-red-400 uppercase tracking-wide flex items-center gap-1.5">
                <span>🔴</span> Fall of Wicket
              </h3>
              <button onClick={() => setShowWicketModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmWicket} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Dismissal Method</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['bowled', 'caught', 'lbw', 'run_out', 'stumped', 'hit_wicket'] as DismissalType[]).map((t) => (
                    <button
                      type="button"
                      key={t}
                      onClick={() => setWicketType(t)}
                      className={`p-1.5 rounded-lg text-xs font-semibold capitalize transition-all border ${
                        wicketType === t
                          ? 'bg-red-600 border-red-400 text-white'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {t.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Dismissed Player</label>
                <select
                  value={outPlayerId}
                  onChange={(e) => setOutPlayerId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-red-500"
                >
                  <option value={currentInnings.currentStrikerId}>{striker?.name} (Striker)</option>
                  <option value={currentInnings.currentNonStrikerId}>{nonStriker?.name} (Non-Striker)</option>
                </select>
              </div>

              {(wicketType === 'caught' || wicketType === 'run_out' || wicketType === 'stumped') && (
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    {wicketType === 'caught' ? 'Caught By (Fielder)' : 'Fielder / Thrower'}
                  </label>
                  <input
                    type="text"
                    placeholder="Enter fielder name..."
                    value={fielderName}
                    onChange={(e) => setFielderName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-red-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Incoming Batsman ({remainingBatsmen.length} remaining)
                </label>
                {remainingBatsmen.length > 0 ? (
                  <select
                    value={newBatsmanId}
                    onChange={(e) => setNewBatsmanId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-red-500"
                    required
                  >
                    <option value="">Select Next Batsman...</option>
                    {remainingBatsmen.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.role.replace('_', ' ')})
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="text-xs text-amber-400 bg-amber-950/40 p-2 rounded-lg border border-amber-900/60">
                    All Out! No more batsmen remaining in squad.
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowWicketModal(false)}
                  className="flex-1 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-lg shadow-red-950"
                >
                  Confirm Wicket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change Bowler Modal */}
      {showBowlerModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-sky-800/80 rounded-2xl w-full max-w-sm p-4 space-y-3.5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="text-sm font-bold text-sky-400 uppercase tracking-wide flex items-center gap-1.5">
                <UserCheck className="w-4 h-4" /> Select Next Bowler
              </h3>
              <button onClick={() => setShowBowlerModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
              {eligibleBowlers.map((p) => {
                const bStats = currentInnings.bowlingScorecard[p.id];
                return (
                  <button
                    key={p.id}
                    onClick={() => handleChangeBowler(p.id)}
                    className="w-full p-2 rounded-xl bg-slate-950 hover:bg-slate-800/80 border border-slate-800 flex items-center justify-between transition-colors text-left"
                  >
                    <div>
                      <div className="text-xs font-bold text-white">{p.name}</div>
                      <div className="text-[10px] text-slate-400 capitalize">{p.role.replace('_', ' ')}</div>
                    </div>
                    <div className="text-right text-[11px] font-mono text-slate-300">
                      {bStats ? `${bStats.overs} ov • ${bStats.wickets}/${bStats.runsConceded}` : 'Yet to bowl'}
                    </div>
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setShowBowlerModal(false)}
              className="w-full py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
            >
              Keep Current Bowler
            </button>
          </div>
        </div>
      )}

      {/* Quick Edit Player Name Modal */}
      {quickEditPlayer && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-emerald-500/50 rounded-2xl w-full max-w-xs p-4 space-y-3 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <Pencil className="w-4 h-4 text-emerald-400" />
                Edit Player Name
              </h3>
              <button
                type="button"
                onClick={() => setQuickEditPlayer(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveQuickEdit} className="space-y-3">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1 font-semibold uppercase">
                  Player Name
                </label>
                <input
                  type="text"
                  value={quickEditPlayer.name}
                  onChange={(e) =>
                    setQuickEditPlayer({ ...quickEditPlayer, name: e.target.value })
                  }
                  autoFocus
                  placeholder="Enter player name..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-bold focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setQuickEditPlayer(null)}
                  className="flex-1 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!quickEditPlayer.name.trim()}
                  className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-950 flex items-center justify-center gap-1 disabled:opacity-40"
                >
                  <Check className="w-3.5 h-3.5" />
                  Save Name
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  const pid = quickEditPlayer.id;
                  setQuickEditPlayer(null);
                  setFocusPlayerId(pid);
                  setShowEditSquadsModal(true);
                }}
                className="w-full text-center text-[10px] text-emerald-400 hover:text-emerald-300 pt-1"
              >
                Open full squad & roles manager →
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Wide & No Ball Run Options Sheet Modal */}
      {showExtrasSubModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm p-4 space-y-3.5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                {showExtrasSubModal === 'wide' ? (
                  <span className="text-amber-400 flex items-center gap-1">
                    <span>⚡</span> Wide Ball Run Options
                  </span>
                ) : (
                  <span className="text-orange-400 flex items-center gap-1">
                    <span>⚡</span> No Ball Run Options
                  </span>
                )}
              </h3>
              <button
                type="button"
                onClick={() => setShowExtrasSubModal(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              {showExtrasSubModal === 'wide'
                ? 'Select how many additional runs were taken on this Wide delivery (1 wide penalty included automatically, delivery not counted):'
                : 'Select runs scored off the bat on this No Ball (1 no ball penalty added automatically, free hit next delivery):'}
            </p>

            {showExtrasSubModal === 'wide' ? (
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    handleRecordBall(0, 'wide', 0);
                    setShowExtrasSubModal(null);
                  }}
                  className="p-3 rounded-xl bg-amber-950/40 hover:bg-amber-900/60 border border-amber-600/60 text-amber-300 font-bold text-xs text-left active:scale-95 transition-all"
                >
                  <div className="text-sm font-extrabold font-mono">Wide Only (+1)</div>
                  <div className="text-[10px] text-slate-400 font-normal mt-0.5">1 extra run • Standard</div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    handleRecordBall(0, 'wide', 1);
                    setShowExtrasSubModal(null);
                  }}
                  className="p-3 rounded-xl bg-amber-950/40 hover:bg-amber-900/60 border border-amber-600/60 text-amber-300 font-bold text-xs text-left active:scale-95 transition-all"
                >
                  <div className="text-sm font-extrabold font-mono">Wide + 1 Run (+2)</div>
                  <div className="text-[10px] text-slate-400 font-normal mt-0.5">1 wide + 1 run ran</div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    handleRecordBall(0, 'wide', 2);
                    setShowExtrasSubModal(null);
                  }}
                  className="p-3 rounded-xl bg-amber-950/40 hover:bg-amber-900/60 border border-amber-600/60 text-amber-300 font-bold text-xs text-left active:scale-95 transition-all"
                >
                  <div className="text-sm font-extrabold font-mono">Wide + 2 Runs (+3)</div>
                  <div className="text-[10px] text-slate-400 font-normal mt-0.5">1 wide + 2 runs ran</div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    handleRecordBall(0, 'wide', 3);
                    setShowExtrasSubModal(null);
                  }}
                  className="p-3 rounded-xl bg-amber-950/40 hover:bg-amber-900/60 border border-amber-600/60 text-amber-300 font-bold text-xs text-left active:scale-95 transition-all"
                >
                  <div className="text-sm font-extrabold font-mono">Wide + 3 Runs (+4)</div>
                  <div className="text-[10px] text-slate-400 font-normal mt-0.5">1 wide + 3 runs ran</div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    handleRecordBall(0, 'wide', 4);
                    setShowExtrasSubModal(null);
                  }}
                  className="col-span-2 p-3 rounded-xl bg-amber-950/60 hover:bg-amber-900/80 border border-amber-500 text-amber-200 font-bold text-xs text-left active:scale-95 transition-all shadow-md"
                >
                  <div className="text-sm font-extrabold font-mono">Wide + 4 Boundary (+5)</div>
                  <div className="text-[10px] text-amber-400 font-normal mt-0.5">Wide ball raced away to boundary rope</div>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    handleRecordBall(0, 'no_ball', 0);
                    setShowExtrasSubModal(null);
                  }}
                  className="p-3 rounded-xl bg-orange-950/40 hover:bg-orange-900/60 border border-orange-600/60 text-orange-300 font-bold text-xs text-left active:scale-95 transition-all"
                >
                  <div className="text-sm font-extrabold font-mono">No Ball Only (+1)</div>
                  <div className="text-[10px] text-slate-400 font-normal mt-0.5">1 penalty run • 0 off bat</div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    handleRecordBall(1, 'no_ball', 0);
                    setShowExtrasSubModal(null);
                  }}
                  className="p-3 rounded-xl bg-orange-950/40 hover:bg-orange-900/60 border border-orange-600/60 text-orange-300 font-bold text-xs text-left active:scale-95 transition-all"
                >
                  <div className="text-sm font-extrabold font-mono">NB + 1 Run (+2)</div>
                  <div className="text-[10px] text-slate-400 font-normal mt-0.5">1 off bat + 1 penalty</div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    handleRecordBall(2, 'no_ball', 0);
                    setShowExtrasSubModal(null);
                  }}
                  className="p-3 rounded-xl bg-orange-950/40 hover:bg-orange-900/60 border border-orange-600/60 text-orange-300 font-bold text-xs text-left active:scale-95 transition-all"
                >
                  <div className="text-sm font-extrabold font-mono">NB + 2 Runs (+3)</div>
                  <div className="text-[10px] text-slate-400 font-normal mt-0.5">2 off bat + 1 penalty</div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    handleRecordBall(3, 'no_ball', 0);
                    setShowExtrasSubModal(null);
                  }}
                  className="p-3 rounded-xl bg-orange-950/40 hover:bg-orange-900/60 border border-orange-600/60 text-orange-300 font-bold text-xs text-left active:scale-95 transition-all"
                >
                  <div className="text-sm font-extrabold font-mono">NB + 3 Runs (+4)</div>
                  <div className="text-[10px] text-slate-400 font-normal mt-0.5">3 off bat + 1 penalty</div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    handleRecordBall(4, 'no_ball', 0);
                    setShowExtrasSubModal(null);
                  }}
                  className="p-3 rounded-xl bg-sky-950/50 hover:bg-sky-900/70 border border-sky-500/70 text-sky-200 font-bold text-xs text-left active:scale-95 transition-all"
                >
                  <div className="text-sm font-extrabold font-mono">NB + 4 FOUR (+5)</div>
                  <div className="text-[10px] text-sky-400 font-normal mt-0.5">Four off bat + 1 penalty</div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    handleRecordBall(6, 'no_ball', 0);
                    setShowExtrasSubModal(null);
                  }}
                  className="p-3 rounded-xl bg-purple-950/60 hover:bg-purple-900/80 border border-purple-500 text-purple-200 font-bold text-xs text-left active:scale-95 transition-all shadow-md"
                >
                  <div className="text-sm font-extrabold font-mono">NB + 6 SIX (+7)</div>
                  <div className="text-[10px] text-purple-400 font-normal mt-0.5">Maximum six + 1 penalty</div>
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowExtrasSubModal(null)}
              className="w-full py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Full Squad & Player Names Edit Modal */}
      {showEditSquadsModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
            <EditSquadsModal
              match={match}
              onUpdateMatch={(updated) => {
                onUpdateMatch(updated);
              }}
              onClose={() => {
                setShowEditSquadsModal(false);
                setFocusPlayerId(undefined);
                setFocusTeamId(undefined);
              }}
              initialPlayerId={focusPlayerId}
              initialTeamId={focusTeamId}
            />
          </div>
        </div>
      )}

      {/* Change Batsman (Before Scoring / Crease Change) Modal */}
      {showChangeBatsmanModal && (
        <ChangeBatsmanModal
          match={match}
          targetEnd={changeBatsmanTarget}
          onConfirm={(stId, nstId) => {
            handleChangeBatsmen(stId, nstId);
          }}
          onClose={() => setShowChangeBatsmanModal(false)}
        />
      )}
    </div>
  );
};

