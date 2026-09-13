import React, { useState } from 'react';
import { 
  Users, 
  UserPlus, 
  Trash2, 
  Check, 
  X, 
  Award, 
  Shield, 
  Save, 
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import { Match, Player, Team } from '../types';
import { updatePlayerName, addPlayerToTeam, removePlayerFromTeam } from '../utils/cricketEngine';
import { saveCustomTeam } from '../utils/customTeamsStorage';

interface EditSquadsModalProps {
  match: Match;
  onUpdateMatch: (updatedMatch: Match) => void;
  onClose: () => void;
  initialPlayerId?: string; // Optional: focus on a specific player
  initialTeamId?: string;
}

export const EditSquadsModal: React.FC<EditSquadsModalProps> = ({
  match,
  onUpdateMatch,
  onClose,
  initialPlayerId,
  initialTeamId,
}) => {
  // Determine starting team tab
  const [activeTeamId, setActiveTeamId] = useState<string>(() => {
    if (initialTeamId) return initialTeamId;
    if (initialPlayerId) {
      const inA = match.teamA.players.some((p) => p.id === initialPlayerId);
      if (inA) return match.teamA.id;
      const inB = match.teamB.players.some((p) => p.id === initialPlayerId);
      if (inB) return match.teamB.id;
    }
    return match.teamA.id;
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerRole, setNewPlayerRole] = useState<Player['role']>('batsman');
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Local editable state of players
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(initialPlayerId || null);
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState<Player['role']>('batsman');
  const [editIsCaptain, setEditIsCaptain] = useState(false);
  const [editIsWk, setEditIsWk] = useState(false);

  const isTeamA = activeTeamId === match.teamA.id;
  const currentTeam = isTeamA ? match.teamA : match.teamB;

  const currentInnings = match.innings[match.currentInningsNumber - 1];
  const activeStrikerId = currentInnings?.currentStrikerId;
  const activeNonStrikerId = currentInnings?.currentNonStrikerId;
  const activeBowlerId = currentInnings?.currentBowlerId;

  const handleStartEdit = (player: Player) => {
    setEditingPlayerId(player.id);
    setEditName(player.name);
    setEditRole(player.role);
    setEditIsCaptain(!!player.isCaptain);
    setEditIsWk(!!player.isWicketKeeper);
  };

  const handleSavePlayer = (playerId: string) => {
    if (!editName.trim()) return;

    const updated = updatePlayerName(
      match,
      playerId,
      editName.trim(),
      editRole,
      editIsCaptain,
      editIsWk
    );

    onUpdateMatch(updated);
    setEditingPlayerId(null);
    setSuccessToast(`Saved player name: "${editName.trim()}"`);
    setTimeout(() => setSuccessToast(null), 2500);
  };

  const handleAddNewPlayer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlayerName.trim()) return;

    const updated = addPlayerToTeam(match, activeTeamId, newPlayerName.trim(), newPlayerRole);
    onUpdateMatch(updated);
    setSuccessToast(`Added ${newPlayerName.trim()} to ${currentTeam.name}`);
    setNewPlayerName('');
    setNewPlayerRole('batsman');
    setTimeout(() => setSuccessToast(null), 2500);
  };

  const handleDeletePlayer = (playerId: string, playerName: string) => {
    if (playerId === activeStrikerId || playerId === activeNonStrikerId || playerId === activeBowlerId) {
      alert(`Cannot remove ${playerName} because they are currently active on the pitch.`);
      return;
    }

    if (confirm(`Remove "${playerName}" from ${currentTeam.name}?`)) {
      const updated = removePlayerFromTeam(match, activeTeamId, playerId);
      onUpdateMatch(updated);
      setSuccessToast(`Removed ${playerName}`);
      setTimeout(() => setSuccessToast(null), 2500);
    }
  };

  const handleSaveSquadAsCustomTeam = () => {
    const defaultName = currentTeam.name;
    const namePrompt = window.prompt('Enter name to save this squad into Custom Teams Library for future matches:', defaultName);
    if (!namePrompt || !namePrompt.trim()) return;

    const trimmed = namePrompt.trim();
    const shortName = trimmed.replace(/[^A-Za-z0-9]/g, '').substring(0, 3).toUpperCase() || 'CST';

    const newTeam: Team = {
      id: `custom-team-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: trimmed,
      shortName,
      color: currentTeam.color || '#0284c7',
      players: currentTeam.players.map((p) => ({ ...p })),
    };

    saveCustomTeam(newTeam);
    setSuccessToast(`Saved "${newTeam.name}" to Custom Teams Library!`);
    setTimeout(() => setSuccessToast(null), 3000);
  };

  const filteredPlayers = currentTeam.players.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-3.5 sm:p-5 space-y-4 pb-20">
      {/* Toast Alert */}
      {successToast && (
        <div className="bg-emerald-600 text-white text-xs font-semibold px-3 py-2 rounded-xl shadow-lg flex items-center justify-between animate-fadeIn">
          <span className="flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5" /> {successToast}
          </span>
          <button onClick={() => setSuccessToast(null)}>
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white font-['Outfit']">Edit Squads & Players</h2>
            <p className="text-[11px] text-slate-400">Rename players, assign roles (C/WK), and add players</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="text-xs px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-colors"
        >
          Done
        </button>
      </div>

      {/* Team Tabs Switcher */}
      <div className="grid grid-cols-2 gap-2 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800">
        <button
          onClick={() => {
            setActiveTeamId(match.teamA.id);
            setEditingPlayerId(null);
          }}
          className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            isTeamA
              ? 'bg-slate-800 text-white shadow-md border border-slate-700'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: match.teamA.color }}
          />
          <span className="truncate">{match.teamA.name} ({match.teamA.players.length})</span>
        </button>

        <button
          onClick={() => {
            setActiveTeamId(match.teamB.id);
            setEditingPlayerId(null);
          }}
          className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            !isTeamA
              ? 'bg-slate-800 text-white shadow-md border border-slate-700'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: match.teamB.color }}
          />
          <span className="truncate">{match.teamB.name} ({match.teamB.players.length})</span>
        </button>
      </div>

      {/* Save Squad to Library for future matches */}
      <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
        <div className="text-[11px] text-slate-300">
          <span className="font-semibold text-white">Save {currentTeam.name}</span>
          <p className="text-[10px] text-slate-500">Store this squad for quick selection in upcoming matches</p>
        </div>
        <button
          type="button"
          onClick={handleSaveSquadAsCustomTeam}
          className="py-1.5 px-3 rounded-lg bg-sky-600/20 hover:bg-sky-600/30 text-sky-300 border border-sky-500/40 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
        >
          <Save className="w-3.5 h-3.5 text-sky-400" />
          <span>Save as Custom Team</span>
        </button>
      </div>

      {/* Add New Player Form */}
      <form onSubmit={handleAddNewPlayer} className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
        <div className="flex items-center justify-between text-[11px] font-bold text-slate-300">
          <span className="flex items-center gap-1.5">
            <UserPlus className="w-3.5 h-3.5 text-emerald-400" />
            Add Player to {currentTeam.name}
          </span>
          <span className="text-[10px] text-slate-500 font-normal">Gully / Local Players</span>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            placeholder="Enter player full name..."
            value={newPlayerName}
            onChange={(e) => setNewPlayerName(e.target.value)}
            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
          <select
            value={newPlayerRole}
            onChange={(e) => setNewPlayerRole(e.target.value as Player['role'])}
            className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
          >
            <option value="batsman">Batsman</option>
            <option value="bowler">Bowler</option>
            <option value="all_rounder">All-Rounder</option>
            <option value="wicket_keeper">Wicket Keeper</option>
          </select>
          <button
            type="submit"
            disabled={!newPlayerName.trim()}
            className="py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-bold text-xs flex items-center justify-center gap-1 transition-all shrink-0"
          >
            <UserPlus className="w-3.5 h-3.5" />
            Add
          </button>
        </div>
      </form>

      {/* Players Squad List */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-400 px-1">
          <span>{currentTeam.name} Squad ({filteredPlayers.length} players)</span>
          <span className="text-[11px] text-emerald-400">Tap name or edit button to rename</span>
        </div>

        <div className="space-y-1.5">
          {filteredPlayers.map((player, idx) => {
            const isEditing = editingPlayerId === player.id;
            const isOnPitch =
              player.id === activeStrikerId
                ? 'Striker'
                : player.id === activeNonStrikerId
                ? 'Non-Striker'
                : player.id === activeBowlerId
                ? 'Current Bowler'
                : null;

            if (isEditing) {
              return (
                <div
                  key={player.id}
                  className="p-3 rounded-2xl bg-slate-900 border-2 border-emerald-500/80 space-y-2.5 shadow-xl animate-fadeIn"
                >
                  <div className="flex items-center justify-between text-xs font-bold text-emerald-400">
                    <span>Editing Player #{idx + 1}</span>
                    <button
                      type="button"
                      onClick={() => setEditingPlayerId(null)}
                      className="text-slate-400 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1 font-semibold uppercase">
                        Player Name
                      </label>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        autoFocus
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-bold focus:outline-none focus:border-emerald-400"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] text-slate-400 mb-1 font-semibold uppercase">
                          Role
                        </label>
                        <select
                          value={editRole}
                          onChange={(e) => setEditRole(e.target.value as Player['role'])}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-400"
                        >
                          <option value="batsman">Batsman</option>
                          <option value="bowler">Bowler</option>
                          <option value="all_rounder">All-Rounder</option>
                          <option value="wicket_keeper">Wicket Keeper</option>
                        </select>
                      </div>

                      <div className="flex items-center gap-3 pt-4">
                        <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={editIsCaptain}
                            onChange={(e) => setEditIsCaptain(e.target.checked)}
                            className="rounded border-slate-700 text-emerald-500 focus:ring-0"
                          />
                          <span>Captain (C)</span>
                        </label>

                        <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={editIsWk}
                            onChange={(e) => setEditIsWk(e.target.checked)}
                            className="rounded border-slate-700 text-emerald-500 focus:ring-0"
                          />
                          <span>Keeper (WK)</span>
                        </label>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setEditingPlayerId(null)}
                        className="flex-1 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSavePlayer(player.id)}
                        className="flex-1 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-md"
                      >
                        <Save className="w-3.5 h-3.5" />
                        Save Name
                      </button>
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={player.id}
                className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-900 border border-slate-800 flex items-center justify-between transition-colors group"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-5 text-[11px] font-mono text-slate-500 text-right">
                    {idx + 1}
                  </span>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        onClick={() => handleStartEdit(player)}
                        className="text-xs font-bold text-white hover:text-emerald-400 cursor-pointer truncate"
                      >
                        {player.name}
                      </span>

                      {player.isCaptain && (
                        <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[9px] font-bold border border-amber-500/30">
                          (C)
                        </span>
                      )}

                      {player.isWicketKeeper && (
                        <span className="px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-300 text-[9px] font-bold border border-sky-500/30">
                          (WK)
                        </span>
                      )}

                      {isOnPitch && (
                        <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 text-[9px] font-mono font-bold">
                          {isOnPitch}
                        </span>
                      )}
                    </div>

                    <div className="text-[10px] text-slate-400 capitalize mt-0.5">
                      {player.role.replace('_', ' ')}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => handleStartEdit(player)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-emerald-600/30 hover:text-emerald-400 text-slate-400 text-xs transition-colors flex items-center gap-1"
                    title="Edit name and role"
                  >
                    <span>Edit</span>
                  </button>

                  <button
                    onClick={() => handleDeletePlayer(player.id, player.name)}
                    disabled={!!isOnPitch || currentTeam.players.length <= 2}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 disabled:opacity-20 hover:bg-red-950/40 transition-colors"
                    title={isOnPitch ? 'Cannot remove active player on pitch' : 'Remove player'}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
