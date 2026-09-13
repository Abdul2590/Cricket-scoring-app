import React, { useState } from 'react';
import { 
  X, 
  UserCheck, 
  ArrowLeftRight, 
  Check, 
  Plus, 
  Search, 
  AlertCircle,
  Sparkles,
  Shield
} from 'lucide-react';
import { Match, Player } from '../types';
import { getBattingTeam, getPlayerById, addPlayerToTeam } from '../utils/cricketEngine';

interface ChangeBatsmanModalProps {
  match: Match;
  targetEnd?: 'striker' | 'non_striker' | 'both';
  onClose: () => void;
  onConfirm: (strikerId: string, nonStrikerId: string) => void;
}

export const ChangeBatsmanModal: React.FC<ChangeBatsmanModalProps> = ({
  match,
  targetEnd = 'both',
  onClose,
  onConfirm,
}) => {
  const currentInnings = match.innings[match.currentInningsNumber - 1];
  const battingTeam = getBattingTeam(match).team;

  const [activeTarget, setActiveTarget] = useState<'both' | 'striker' | 'non_striker'>(targetEnd);
  const [selectedStrikerId, setSelectedStrikerId] = useState<string>(
    currentInnings?.currentStrikerId || battingTeam.players[0]?.id || ''
  );
  const [selectedNonStrikerId, setSelectedNonStrikerId] = useState<string>(
    currentInnings?.currentNonStrikerId || battingTeam.players[1]?.id || ''
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [showAddNew, setShowAddNew] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerRole, setNewPlayerRole] = useState<Player['role']>('batsman');
  const [customPlayers, setCustomPlayers] = useState<Player[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const allPlayers = [...battingTeam.players, ...customPlayers];

  const filteredPlayers = allPlayers.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isBeforeScoring =
    !currentInnings ||
    (currentInnings.legalBallsBowled === 0 && currentInnings.recentBalls.length === 0);

  const handleSwapEnds = () => {
    const temp = selectedStrikerId;
    setSelectedStrikerId(selectedNonStrikerId);
    setSelectedNonStrikerId(temp);
    setErrorMessage(null);
  };

  const handleSelectPlayer = (playerId: string, end: 'striker' | 'non_striker') => {
    setErrorMessage(null);
    if (end === 'striker') {
      if (playerId === selectedNonStrikerId) {
        // Swap them if selecting the current non-striker as striker
        setSelectedNonStrikerId(selectedStrikerId);
      }
      setSelectedStrikerId(playerId);
    } else {
      if (playerId === selectedStrikerId) {
        // Swap them if selecting the current striker as non-striker
        setSelectedStrikerId(selectedNonStrikerId);
      }
      setSelectedNonStrikerId(playerId);
    }
  };

  const handleAddNewPlayer = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newPlayerName.trim();
    if (!clean) return;

    const newP: Player = {
      id: `p-custom-${Date.now()}`,
      name: clean,
      role: newPlayerRole,
    };

    setCustomPlayers((prev) => [...prev, newP]);
    setNewPlayerName('');
    setShowAddNew(false);

    // Auto-select as current target
    if (activeTarget === 'striker') {
      handleSelectPlayer(newP.id, 'striker');
    } else if (activeTarget === 'non_striker') {
      handleSelectPlayer(newP.id, 'non_striker');
    } else {
      handleSelectPlayer(newP.id, 'striker');
    }
  };

  const handleSave = () => {
    if (!selectedStrikerId || !selectedNonStrikerId) {
      setErrorMessage('Please select both a Striker and a Non-Striker.');
      return;
    }

    if (selectedStrikerId === selectedNonStrikerId) {
      setErrorMessage('Striker and Non-Striker cannot be the same batsman. Please choose distinct players.');
      return;
    }

    onConfirm(selectedStrikerId, selectedNonStrikerId);
    onClose();
  };

  const strikerPlayer =
    allPlayers.find((p) => p.id === selectedStrikerId) ||
    getPlayerById(match, selectedStrikerId);
  const nonStrikerPlayer =
    allPlayers.find((p) => p.id === selectedNonStrikerId) ||
    getPlayerById(match, selectedNonStrikerId);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <span>Change Batsmen</span>
                {isBeforeScoring ? (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-semibold border border-emerald-500/30">
                    Opening Pair Setup
                  </span>
                ) : (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30">
                    Live Crease Change
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-400">
                {battingTeam.name} • Innings {match.currentInningsNumber}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Informational Sub-Banner */}
        {isBeforeScoring ? (
          <div className="px-4 py-2 bg-emerald-950/40 border-b border-emerald-500/20 text-xs text-emerald-300 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              Scoring has not started yet. Choose who takes strike for Ball 1 and who stands at the non-striker end.
            </span>
          </div>
        ) : (
          <div className="px-4 py-2 bg-slate-950/70 border-b border-slate-800 text-xs text-slate-400 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              Select the active batsmen at both ends of the pitch.
            </span>
          </div>
        )}

        {/* Body Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          
          {/* Target Mode Tabs */}
          <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTarget('both')}
              className={`flex-1 py-1.5 rounded-lg transition-all ${
                activeTarget === 'both'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Set Both Openers
            </button>
            <button
              type="button"
              onClick={() => setActiveTarget('striker')}
              className={`flex-1 py-1.5 rounded-lg transition-all ${
                activeTarget === 'striker'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Change Striker Only
            </button>
            <button
              type="button"
              onClick={() => setActiveTarget('non_striker')}
              className={`flex-1 py-1.5 rounded-lg transition-all ${
                activeTarget === 'non_striker'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Change Non-Striker Only
            </button>
          </div>

          {/* Crease Preview Pair */}
          <div className="p-3.5 rounded-2xl bg-slate-950/90 border border-slate-800/90 space-y-2.5">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>Current Pitch Pair</span>
              <button
                type="button"
                onClick={handleSwapEnds}
                className="text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 normal-case text-xs transition-colors"
                title="Swap Striker and Non-Striker ends"
              >
                <ArrowLeftRight className="w-3.5 h-3.5" />
                <span>Swap Strike Ends</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Striker Preview */}
              <div
                onClick={() => setActiveTarget('striker')}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                  activeTarget === 'striker' || activeTarget === 'both'
                    ? 'bg-emerald-950/30 border-emerald-500/80 shadow-md ring-1 ring-emerald-500/40'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    ★ Striker (Facing 1st Ball)
                  </span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                    STRIKE
                  </span>
                </div>
                <div className="text-sm font-extrabold text-white truncate">
                  {strikerPlayer?.name || 'Select Striker'}
                </div>
                <div className="text-[11px] text-slate-400 capitalize mt-0.5 flex items-center gap-1.5">
                  <span>{strikerPlayer?.role.replace('_', ' ') || 'Batsman'}</span>
                  {strikerPlayer?.isCaptain && (
                    <span className="text-[9px] px-1 rounded bg-amber-500/20 text-amber-400 font-bold">(C)</span>
                  )}
                  {strikerPlayer?.isWicketKeeper && (
                    <span className="text-[9px] px-1 rounded bg-sky-500/20 text-sky-400 font-bold">(WK)</span>
                  )}
                </div>
              </div>

              {/* Non-Striker Preview */}
              <div
                onClick={() => setActiveTarget('non_striker')}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                  activeTarget === 'non_striker'
                    ? 'bg-sky-950/30 border-sky-500/80 shadow-md ring-1 ring-sky-500/40'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className="text-slate-400 font-semibold">
                    Non-Striker (Runner End)
                  </span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-mono">
                    NON-STRIKE
                  </span>
                </div>
                <div className="text-sm font-extrabold text-white truncate">
                  {nonStrikerPlayer?.name || 'Select Non-Striker'}
                </div>
                <div className="text-[11px] text-slate-400 capitalize mt-0.5 flex items-center gap-1.5">
                  <span>{nonStrikerPlayer?.role.replace('_', ' ') || 'Batsman'}</span>
                  {nonStrikerPlayer?.isCaptain && (
                    <span className="text-[9px] px-1 rounded bg-amber-500/20 text-amber-400 font-bold">(C)</span>
                  )}
                  {nonStrikerPlayer?.isWicketKeeper && (
                    <span className="text-[9px] px-1 rounded bg-sky-500/20 text-sky-400 font-bold">(WK)</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Validation Error */}
          {errorMessage && (
            <div className="p-2.5 rounded-xl bg-red-950/60 border border-red-600/60 text-xs text-red-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Squad Player Selection List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="text-xs font-bold text-slate-300">
                Select Batsmen from {battingTeam.name} Squad ({allPlayers.length} Available)
              </span>

              <button
                type="button"
                onClick={() => setShowAddNew((prev) => !prev)}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add New Player</span>
              </button>
            </div>

            {/* Quick Add Form */}
            {showAddNew && (
              <form onSubmit={handleAddNewPlayer} className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="text-xs font-bold text-white">Add Walk-In / Sub Batsman</div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newPlayerName}
                    onChange={(e) => setNewPlayerName(e.target.value)}
                    placeholder="Player Name (e.g. Yashasvi Jaiswal)"
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    autoFocus
                  />
                  <select
                    value={newPlayerRole}
                    onChange={(e) => setNewPlayerRole(e.target.value as any)}
                    className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="batsman">Batsman</option>
                    <option value="all_rounder">All-Rounder</option>
                    <option value="wicket_keeper">Wicket Keeper</option>
                    <option value="bowler">Bowler</option>
                  </select>
                  <button
                    type="submit"
                    disabled={!newPlayerName.trim()}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-30 text-white rounded-lg text-xs font-bold transition-all"
                  >
                    Add
                  </button>
                </div>
              </form>
            )}

            {/* Search Filter */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search squad player..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Players Table / List */}
            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
              {filteredPlayers.map((player, idx) => {
                const isStriker = player.id === selectedStrikerId;
                const isNonStriker = player.id === selectedNonStrikerId;
                const isOut = currentInnings?.battingScorecard[player.id]?.isOut;

                return (
                  <div
                    key={player.id}
                    className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 transition-all ${
                      isStriker
                        ? 'bg-emerald-950/40 border-emerald-500/70'
                        : isNonStriker
                        ? 'bg-sky-950/40 border-sky-500/70'
                        : 'bg-slate-950/80 border-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    {/* Left: Player Info */}
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-5 text-center font-mono text-[11px] text-slate-500 font-bold shrink-0">
                        #{idx + 1}
                      </span>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-white flex items-center gap-1.5 truncate">
                          <span>{player.name}</span>
                          {player.isCaptain && (
                            <span className="text-[9px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-400 font-bold shrink-0">
                              (C)
                            </span>
                          )}
                          {player.isWicketKeeper && (
                            <span className="text-[9px] px-1 py-0.2 rounded bg-sky-500/20 text-sky-400 font-bold shrink-0">
                              (WK)
                            </span>
                          )}
                          {isOut && (
                            <span className="text-[9px] px-1 py-0.2 rounded bg-red-500/20 text-red-400 font-bold shrink-0">
                              OUT
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 capitalize">
                          {player.role.replace('_', ' ')}
                        </div>
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {isStriker && (
                        <span className="px-2 py-0.5 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[10px] font-bold">
                          Striker ★
                        </span>
                      )}

                      {isNonStriker && (
                        <span className="px-2 py-0.5 rounded-lg bg-sky-500/20 border border-sky-500/40 text-sky-400 text-[10px] font-bold">
                          Non-Striker
                        </span>
                      )}

                      {/* Action buttons if not currently assigned */}
                      {!isStriker && (
                        <button
                          type="button"
                          onClick={() => handleSelectPlayer(player.id, 'striker')}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-emerald-600 text-slate-300 hover:text-white text-[11px] font-semibold transition-all"
                          title="Set this batsman on strike"
                        >
                          Make Striker
                        </button>
                      )}

                      {!isNonStriker && (
                        <button
                          type="button"
                          onClick={() => handleSelectPlayer(player.id, 'non_striker')}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-sky-600 text-slate-300 hover:text-white text-[11px] font-semibold transition-all"
                          title="Set this batsman as non-striker"
                        >
                          Make Non-Striker
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-semibold transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-950 flex items-center gap-1.5 transition-all active:scale-95"
          >
            <Check className="w-4 h-4" />
            <span>
              {isBeforeScoring ? 'Set Openers & Start Scoring' : 'Confirm Batsmen on Crease'}
            </span>
          </button>
        </div>

      </div>
    </div>
  );
};
