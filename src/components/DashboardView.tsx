import React from 'react';
import { 
  Radio, 
  MapPin, 
  Clock, 
  Trophy, 
  ChevronRight, 
  TrendingUp, 
  Users, 
  Sparkles,
  Sliders,
  Play,
  HardDrive,
  Cloud,
  Smartphone,
  Download,
  Shield,
  User as UserIcon,
  UserPlus
} from 'lucide-react';
import { Match, DashboardConfig } from '../types';
import { useGoogleAuth } from '../hooks/useGoogleAuth';
import { 
  formatOvers, 
  calculateCRR, 
  calculateRRR, 
  getBattingTeam, 
  getBowlingTeam, 
  getPlayerById 
} from '../utils/cricketEngine';

interface DashboardViewProps {
  match: Match | null;
  allMatches: Match[];
  config: DashboardConfig;
  onSelectMatch: (matchId: string) => void;
  onNavigateToScorer: () => void;
  onOpenFixModal: () => void;
  onOpenCustomise: () => void;
  onOpenScorecard: () => void;
  onOpenDrive: () => void;
  onOpenInstall: () => void;
  onOpenTeams?: () => void;
  onOpenAccount?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  match,
  allMatches,
  config,
  onSelectMatch,
  onNavigateToScorer,
  onOpenFixModal,
  onOpenCustomise,
  onOpenScorecard,
  onOpenDrive,
  onOpenInstall,
  onOpenTeams,
  onOpenAccount,
}) => {
  const { user, signIn, switchAccount } = useGoogleAuth();

  if (!match) {
    return (
      <div className="p-6 text-center text-slate-400 space-y-3">
        <Trophy className="w-10 h-10 text-slate-600 mx-auto" />
        <p className="text-sm">No active match selected.</p>
        <button
          onClick={onOpenFixModal}
          className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold"
        >
          Fix a Match Fixture
        </button>
      </div>
    );
  }

  const currentInnings = match.innings[match.currentInningsNumber - 1];
  const battingTeam = getBattingTeam(match).team;
  const bowlingTeam = getBowlingTeam(match).team;

  const striker = currentInnings ? getPlayerById(match, currentInnings.currentStrikerId) : null;
  const nonStriker = currentInnings ? getPlayerById(match, currentInnings.currentNonStrikerId) : null;
  const bowler = currentInnings ? getPlayerById(match, currentInnings.currentBowlerId) : null;

  const strikerStats = currentInnings?.battingScorecard[currentInnings.currentStrikerId];
  const nonStrikerStats = currentInnings?.battingScorecard[currentInnings.currentNonStrikerId];
  const bowlerStats = currentInnings?.bowlingScorecard[currentInnings.currentBowlerId];

  const crr = currentInnings ? calculateCRR(currentInnings.totalRuns, currentInnings.legalBallsBowled) : '0.00';
  const totalMaxBalls = currentInnings ? currentInnings.totalOversLimit * 6 : 120;
  const ballsRemaining = currentInnings ? Math.max(0, totalMaxBalls - currentInnings.legalBallsBowled) : 0;
  const target = match.target;
  const runsNeeded = target && currentInnings ? Math.max(0, target - currentInnings.totalRuns) : undefined;
  const rrr = target && currentInnings ? calculateRRR(target, currentInnings.totalRuns, ballsRemaining) : undefined;

  // Partnership runs calculation
  const partnershipRuns = (strikerStats?.runs || 0) + (nonStrikerStats?.runs || 0);
  const partnershipBalls = (strikerStats?.balls || 0) + (nonStrikerStats?.balls || 0);

  // Theme styling helpers
  const getThemeHeaderGradient = () => {
    switch (config.theme) {
      case 'sapphire': return 'from-sky-950/80 via-indigo-950/60 to-slate-950 border-sky-800/60';
      case 'crimson': return 'from-rose-950/80 via-slate-900 to-slate-950 border-rose-800/60';
      case 'amber': return 'from-amber-950/80 via-slate-900 to-slate-950 border-amber-800/60';
      case 'onyx': return 'from-slate-900 via-slate-900 to-black border-slate-700/60';
      default: return 'from-emerald-950/80 via-slate-900 to-slate-950 border-emerald-800/60';
    }
  };

  const isComfortable = config.density === 'comfortable';

  return (
    <div className={`space-y-3 ${isComfortable ? 'p-3.5 sm:p-5' : 'p-2.5 sm:p-3'} pb-24`}>
      {/* Mini Fixtures Carousel (if enabled) */}
      {config.widgets.miniFixturesCarousel && allMatches.length > 1 && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold px-1">
            <span className="uppercase tracking-wider">Tournament Fixtures</span>
            <button onClick={onOpenFixModal} className="text-emerald-400 hover:underline">
              Fix Matches →
            </button>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-none">
            {allMatches.map((m) => {
              const isCurrent = m.id === match.id;
              return (
                <div
                  key={m.id}
                  onClick={() => onSelectMatch(m.id)}
                  className={`min-w-[170px] max-w-[190px] p-2 rounded-xl border cursor-pointer transition-all shrink-0 ${
                    isCurrent
                      ? 'bg-slate-900 border-emerald-500/70 shadow-md ring-1 ring-emerald-500/30'
                      : 'bg-slate-900/50 border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between text-[9px] text-slate-400 mb-1">
                    <span className="truncate max-w-[90px]">{m.seriesName}</span>
                    <span className={`font-bold capitalize ${m.status === 'live' ? 'text-red-400' : 'text-slate-400'}`}>
                      {m.status === 'live' ? '● LIVE' : m.status}
                    </span>
                  </div>

                  <div className="flex items-center justify-between font-bold text-xs text-white">
                    <span>{m.teamA.shortName}</span>
                    <span className="text-[10px] text-slate-500 font-normal">vs</span>
                    <span>{m.teamB.shortName}</span>
                  </div>

                  <div className="text-[10px] text-slate-400 truncate mt-1">
                    {m.status === 'live' && m.innings[m.currentInningsNumber - 1]
                      ? `${m.innings[m.currentInningsNumber - 1]?.totalRuns}/${m.innings[m.currentInningsNumber - 1]?.totalWickets} (${formatOvers(m.innings[m.currentInningsNumber - 1]?.legalBallsBowled || 0)})`
                      : m.matchDate}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Hero Scorecard (if enabled) */}
      {config.widgets.heroScorecard && (
        <div className={`rounded-3xl p-4 sm:p-5 border shadow-2xl relative overflow-hidden bg-gradient-to-br ${getThemeHeaderGradient()}`}>
          {/* Top Series & Venue row */}
          <div className="flex items-center justify-between text-xs text-slate-300 border-b border-white/10 pb-2.5 mb-3">
            <div className="flex items-center gap-1.5 truncate max-w-[210px]">
              <Trophy className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="font-semibold text-white truncate">{match.seriesName}</span>
            </div>

            <div className="flex items-center gap-2">
              {match.status === 'live' ? (
                <span className="flex items-center gap-1 text-[10px] font-bold text-red-400 bg-red-950/70 border border-red-800/80 px-2 py-0.5 rounded-full animate-pulse">
                  <Radio className="w-3 h-3 text-red-400" /> LIVE
                </span>
              ) : (
                <span className="text-[10px] font-bold text-slate-300 bg-slate-800/80 px-2 py-0.5 rounded-full capitalize">
                  {match.status}
                </span>
              )}
            </div>
          </div>

          {/* Teams & Score Row */}
          <div className="grid grid-cols-2 gap-3 items-center">
            {/* Batting Team Primary Block */}
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div 
                  className="w-4 h-4 rounded-full border border-white/20" 
                  style={{ backgroundColor: battingTeam.color }} 
                />
                <h2 className="text-base sm:text-lg font-extrabold text-white font-['Outfit'] tracking-tight">
                  {battingTeam.name}
                </h2>
              </div>

              {currentInnings && (
                <div className="text-3xl sm:text-4xl font-extrabold text-white font-['Chakra_Petch'] leading-none">
                  {currentInnings.totalRuns}
                  <span className="text-slate-400 text-2xl font-normal">/{currentInnings.totalWickets}</span>
                </div>
              )}

              {currentInnings && (
                <div className="text-xs font-mono text-slate-300">
                  Overs: <span className="text-emerald-400 font-bold">{formatOvers(currentInnings.legalBallsBowled)}</span> / {currentInnings.totalOversLimit}
                </div>
              )}
            </div>

            {/* Bowling Team / Target Equation Block */}
            <div className="text-right space-y-1 border-l border-white/10 pl-3">
              <div className="flex items-center justify-end gap-2">
                <span className="text-xs sm:text-sm font-semibold text-slate-300">
                  {bowlingTeam.name}
                </span>
                <div 
                  className="w-3.5 h-3.5 rounded-full border border-white/20" 
                  style={{ backgroundColor: bowlingTeam.color }} 
                />
              </div>

              {/* If 2nd innings, show 1st innings score */}
              {match.currentInningsNumber === 2 && match.innings[0] && (
                <div className="text-xs text-slate-400 font-mono">
                  1st Inn: <span className="text-slate-200 font-bold">{match.innings[0].totalRuns}/{match.innings[0].totalWickets}</span>
                </div>
              )}

              <div className="text-xs space-y-0.5">
                <div className="text-slate-400">
                  CRR: <span className="text-emerald-400 font-bold font-mono">{crr}</span>
                </div>
                {target && (
                  <div className="text-amber-400 font-bold text-xs">
                    Target: {target}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Equation Banner */}
          {target && match.status === 'live' && runsNeeded !== undefined && (
            <div className="mt-3 py-1.5 px-3 rounded-xl bg-slate-950/70 border border-amber-500/40 text-center text-xs font-medium text-amber-300">
              {runsNeeded <= 0 ? (
                <span className="text-emerald-400 font-bold">Target reached!</span>
              ) : (
                <span>
                  {battingTeam.name} needs <strong className="text-white font-bold">{runsNeeded} runs</strong> in{' '}
                  <strong className="text-white font-bold">{ballsRemaining} balls</strong> (Req RR: {rrr})
                </span>
              )}
            </div>
          )}

          {/* Match summary / result banner */}
          {match.resultSummary && (
            <div className="mt-3 py-1.5 px-3 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-center text-xs font-bold text-emerald-300">
              {match.resultSummary}
            </div>
          )}

          {/* Stadium & Pitch footer */}
          <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
            <div className="flex items-center gap-1 truncate max-w-[200px]">
              <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
              <span className="truncate">{match.venue}</span>
            </div>
            <div className="text-slate-300">
              Pitch: <span className="text-white font-medium">{match.pitchType}</span>
            </div>
          </div>
        </div>
      )}

      {/* Live Ball-by-Ball Over Strip (if enabled) */}
      {config.widgets.liveBallTicker && currentInnings && (
        <div className="bg-slate-900/90 p-3 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold mb-2">
            <span className="uppercase tracking-wider">Recent Balls</span>
            <span className="text-slate-300 font-mono text-[10px]">
              Over {formatOvers(currentInnings.legalBallsBowled)}
            </span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {currentInnings.recentBalls.length === 0 ? (
              <span className="text-xs text-slate-500 italic py-1">Scoring not started yet</span>
            ) : (
              currentInnings.recentBalls.slice(0, 10).map((b) => {
                let badgeClass = 'bg-slate-800 text-slate-200 border-slate-700';
                let txt = b.runs.toString();

                if (b.isWicket) {
                  badgeClass = 'bg-red-600 text-white font-extrabold border-red-500';
                  txt = 'W';
                } else if (b.runs === 6) {
                  badgeClass = 'bg-purple-600 text-white font-extrabold border-purple-400';
                  txt = '6';
                } else if (b.runs === 4) {
                  badgeClass = 'bg-sky-600 text-white font-extrabold border-sky-400';
                  txt = '4';
                } else if (b.isExtra) {
                  badgeClass = 'bg-amber-500 text-slate-950 font-bold border-amber-400';
                  txt = b.extraType === 'wide' ? `${b.extraRuns}wd` : `${b.extraRuns}nb`;
                } else if (b.runs === 0) {
                  badgeClass = 'bg-slate-950 text-slate-500 border-slate-800';
                  txt = '•';
                }

                return (
                  <div
                    key={b.id}
                    className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-mono font-bold border shrink-0 ${badgeClass}`}
                    title={b.commentary}
                  >
                    {txt}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Crease Status: Batsmen & Bowler spotlight */}
      {currentInnings && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {/* Active Batsmen Card */}
          <div className="bg-slate-900/80 p-3 rounded-2xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <span>Batting</span>
              <span className="text-[10px] text-slate-500">R (B) • 4s • 6s • SR</span>
            </div>

            {/* Striker */}
            <div className="p-2 rounded-xl bg-slate-950/80 border border-emerald-500/30 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-emerald-400 text-xs">★</span>
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1">
                    {striker?.name || 'Striker'}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    {strikerStats?.fours || 0} 4s • {strikerStats?.sixes || 0} 6s • SR {strikerStats?.strikeRate || 0}
                  </div>
                </div>
              </div>
              <div className="text-sm font-bold text-white font-mono">
                {strikerStats?.runs || 0}
                <span className="text-xs text-slate-400 font-normal">({strikerStats?.balls || 0})</span>
              </div>
            </div>

            {/* Non-Striker */}
            <div className="p-2 rounded-xl bg-slate-950/40 border border-slate-800/80 flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-slate-300">{nonStriker?.name || 'Non-Striker'}</div>
                <div className="text-[10px] text-slate-500 font-mono">
                  {nonStrikerStats?.fours || 0} 4s • {nonStrikerStats?.sixes || 0} 6s • SR {nonStrikerStats?.strikeRate || 0}
                </div>
              </div>
              <div className="text-sm font-bold text-slate-300 font-mono">
                {nonStrikerStats?.runs || 0}
                <span className="text-xs text-slate-500 font-normal">({nonStrikerStats?.balls || 0})</span>
              </div>
            </div>
          </div>

          {/* Active Bowler Card */}
          <div className="bg-slate-900/80 p-3 rounded-2xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <span>Bowling</span>
              <span className="text-[10px] text-slate-500">O • M • R • W • Econ</span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-white">{bowler?.name || 'Bowler'}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Maidens: {bowlerStats?.maidens || 0} • Dots: {bowlerStats?.dots || 0}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-extrabold text-sky-400 font-mono">
                  {bowlerStats?.wickets || 0}/{bowlerStats?.runsConceded || 0}
                  <span className="text-xs text-slate-400 font-normal ml-1">({bowlerStats?.overs || '0.0'})</span>
                </div>
                <div className="text-[10px] text-slate-400">
                  Econ: <span className="text-slate-200 font-mono">{bowlerStats?.economy || '0.00'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Partnership Meter (if enabled) */}
      {config.widgets.partnershipBar && currentInnings && (
        <div className="p-3 bg-slate-900/70 rounded-2xl border border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-400" />
            <div>
              <div className="font-semibold text-slate-200">Active Partnership</div>
              <div className="text-[10px] text-slate-400">
                {striker?.name} & {nonStriker?.name}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-bold text-white font-mono">{partnershipRuns} runs</div>
            <div className="text-[10px] text-slate-400">{partnershipBalls} balls</div>
          </div>
        </div>
      )}

      {/* Live Ball-by-Ball Commentary Stream (if enabled) */}
      {config.widgets.commentaryStream && currentInnings && (
        <div className="bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800 space-y-2.5">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-300 uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Live Ball-by-Ball Commentary
            </span>
            <span className="text-[10px] text-slate-500 font-normal">Auto-updating</span>
          </div>

          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {currentInnings.recentBalls.length === 0 ? (
              <p className="text-xs text-slate-500 py-3 text-center">No commentary logged yet.</p>
            ) : (
              currentInnings.recentBalls.slice(0, 8).map((b) => (
                <div key={b.id} className="p-2 rounded-xl bg-slate-950/70 border border-slate-800/80 text-xs flex gap-2.5">
                  <div className="font-mono font-bold text-slate-400 shrink-0 text-[11px] pt-0.5">
                    {b.overIndex}.{b.ballInOver}
                  </div>
                  <div className="flex-1">
                    <p className="text-slate-200 leading-relaxed text-[11px]">{b.commentary}</p>
                    {b.shotType && (
                      <span className="inline-block mt-1 text-[9px] px-1.5 py-0.2 rounded bg-sky-950 text-sky-400 border border-sky-800/60 font-mono">
                        Shot: {b.shotType}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Quick Launch Scorer Action Card */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-900/60 via-slate-900 to-sky-950/60 border border-emerald-500/40 flex items-center justify-between shadow-xl">
        <div>
          <h3 className="text-sm font-bold text-white font-['Outfit']">Official Scorer Console</h3>
          <p className="text-xs text-slate-400 mt-0.5">Upload ball-by-ball score, extras & wickets live</p>
        </div>

        <button
          onClick={onNavigateToScorer}
          className="py-2 px-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-950 transition-all shrink-0"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          Score Live
        </button>
      </div>

      {/* Google Drive Cloud Sync Card */}
      <div className="p-3.5 rounded-2xl bg-gradient-to-r from-sky-950/70 via-slate-900 to-indigo-950/70 border border-sky-500/30 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 shrink-0">
            <HardDrive className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white">Google Drive Cloud Sync</h4>
            <p className="text-[10px] text-slate-400">Backup live matches, export scorecards, & restore files</p>
          </div>
        </div>

        <button
          onClick={onOpenDrive}
          className="py-1.5 px-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs flex items-center gap-1 shadow-md shadow-sky-950 transition-all shrink-0 cursor-pointer"
        >
          <Cloud className="w-3.5 h-3.5" />
          Sync
        </button>
      </div>

      {/* Install Android Mobile App Card */}
      <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-950/70 via-slate-900 to-teal-950/70 border border-emerald-500/30 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <Smartphone className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h4 className="text-xs font-bold text-white">Install Android App</h4>
              <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 text-[9px] font-bold">APK</span>
            </div>
            <p className="text-[10px] text-slate-400">Install CricLive on your phone for full screen & offline scoring</p>
          </div>
        </div>

        <button
          onClick={onOpenInstall}
          className="py-1.5 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1 shadow-md shadow-emerald-950 transition-all shrink-0 cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          Install
        </button>
      </div>

      {/* Custom Teams Library Card */}
      {onOpenTeams && (
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-blue-950/70 via-slate-900 to-indigo-950/70 border border-blue-500/30 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h4 className="text-xs font-bold text-white">Custom Teams Library</h4>
                <span className="px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 text-[9px] font-bold">SAVED SQUADS</span>
              </div>
              <p className="text-[10px] text-slate-400">Manage clubs, gully squads, & save rosters for all future matches</p>
            </div>
          </div>

          <button
            onClick={onOpenTeams}
            className="py-1.5 px-3 rounded-xl bg-blue-500 hover:bg-blue-400 text-slate-950 font-bold text-xs flex items-center gap-1 shadow-md shadow-blue-950 transition-all shrink-0 cursor-pointer"
          >
            <Shield className="w-3.5 h-3.5" />
            Teams
          </button>
        </div>
      )}

      {/* Google User Account & Multi-User Switcher Card */}
      <div className="p-3.5 rounded-2xl bg-gradient-to-r from-sky-950/70 via-slate-900 to-indigo-950/70 border border-sky-500/30 flex items-center justify-between shadow-lg">
        {user ? (
          <>
            <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-2">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'Google Account'}
                  className="w-9 h-9 rounded-xl border border-emerald-400/80 object-cover shadow-sm shrink-0"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-9 h-9 rounded-xl bg-emerald-600/30 border border-emerald-500/50 flex items-center justify-center text-emerald-400 font-bold text-xs shrink-0">
                  {(user.displayName || user.email || 'U')[0].toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h4 className="text-xs font-bold text-white truncate">
                    {user.displayName || 'Google Scorer'}
                  </h4>
                  <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 text-[9px] font-bold shrink-0">
                    LOGGED IN
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 truncate">{user.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                id="dashboard-switch-user-btn"
                onClick={() => switchAccount()}
                className="py-1.5 px-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-[11px] flex items-center gap-1 shadow-md shadow-sky-950 transition-all cursor-pointer"
                title="Log in with another Google user"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Switch User</span>
              </button>

              {onOpenAccount && (
                <button
                  id="dashboard-account-manage-btn"
                  onClick={onOpenAccount}
                  className="py-1.5 px-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white text-[11px] font-semibold border border-slate-700 transition-colors cursor-pointer"
                  title="View Account Details"
                >
                  <UserIcon className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-2">
              <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
                <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-4 h-4">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                </svg>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h4 className="text-xs font-bold text-white">Google Account Sign-In</h4>
                  <span className="px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-300 text-[9px] font-bold">
                    MULTI-USER
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 truncate">Log in to switch users, sync matches & export data</p>
              </div>
            </div>

            <button
              id="dashboard-google-login-btn"
              onClick={() => signIn()}
              className="py-1.5 px-3 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs flex items-center gap-1.5 shadow-md transition-all shrink-0 cursor-pointer"
            >
              <span>Sign in</span>
            </button>
          </>
        )}
      </div>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={onOpenScorecard}
          className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-200 flex items-center justify-center gap-1.5 transition-colors"
        >
          View Full Scorecard <ChevronRight className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={onOpenCustomise}
          className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-purple-400 flex items-center justify-center gap-1.5 transition-colors"
        >
          <Sliders className="w-3.5 h-3.5" /> Customise Dashboard
        </button>
      </div>
    </div>
  );
};
