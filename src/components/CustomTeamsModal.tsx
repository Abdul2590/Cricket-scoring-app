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
  Edit3, 
  Copy, 
  Plus, 
  Search, 
  Calendar, 
  Sparkles, 
  RotateCcw,
  ClipboardList,
  Download,
  Upload,
  ArrowRight,
  CheckCircle2,
  Crown
} from 'lucide-react';
import { Team, Player } from '../types';
import { 
  getSavedCustomTeams, 
  saveCustomTeam, 
  deleteCustomTeam, 
  createNewBlankTeam, 
  duplicateCustomTeam 
} from '../utils/customTeamsStorage';

interface CustomTeamsModalProps {
  onClose?: () => void;
  onSelectTeamForMatch?: (team: Team) => void;
}

const PRESET_COLORS = [
  { name: 'Emerald Green', hex: '#059669' },
  { name: 'Royal Blue', hex: '#2563eb' },
  { name: 'Crimson Red', hex: '#dc2626' },
  { name: 'Electric Orange', hex: '#ea580c' },
  { name: 'Royal Violet', hex: '#7c3aed' },
  { name: 'Amber Gold', hex: '#d97706' },
  { name: 'Cyan Teal', hex: '#0891b2' },
  { name: 'Midnight Charcoal', hex: '#334155' },
];

export const CustomTeamsModal: React.FC<CustomTeamsModalProps> = ({
  onClose,
  onSelectTeamForMatch,
}) => {
  const [teams, setTeams] = useState<Team[]>(() => getSavedCustomTeams());
  const [searchQuery, setSearchQuery] = useState('');
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Bulk paste drawer state
  const [showBulkPaste, setShowBulkPaste] = useState(false);
  const [bulkPasteText, setBulkPasteText] = useState('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const filteredTeams = teams.filter((t) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      t.name.toLowerCase().includes(q) ||
      t.shortName.toLowerCase().includes(q) ||
      t.players.some((p) => p.name.toLowerCase().includes(q))
    );
  });

  const handleStartCreate = () => {
    const blank = createNewBlankTeam();
    setEditingTeam(blank);
    setIsCreatingNew(true);
  };

  const handleStartEdit = (team: Team) => {
    // deep clone so edits don't mutate state prematurely
    setEditingTeam(JSON.parse(JSON.stringify(team)));
    setIsCreatingNew(false);
  };

  const handleDuplicate = (team: Team) => {
    const cloned = duplicateCustomTeam(team);
    const updated = saveCustomTeam(cloned);
    setTeams(updated);
    showToast(`Duplicated "${team.name}" as "${cloned.name}"`);
  };

  const handleDelete = (teamId: string, teamName: string) => {
    if (window.confirm(`Are you sure you want to delete "${teamName}"? This cannot be undone.`)) {
      const updated = deleteCustomTeam(teamId);
      setTeams(updated);
      if (editingTeam?.id === teamId) {
        setEditingTeam(null);
      }
      showToast(`Deleted team "${teamName}"`);
    }
  };

  // Editor changes
  const handleEditorTeamNameChange = (val: string) => {
    if (!editingTeam) return;
    const shortAuto = !editingTeam.shortName || editingTeam.shortName === 'NEW'
      ? val.replace(/[^A-Za-z0-9]/g, '').substring(0, 3).toUpperCase()
      : editingTeam.shortName;
    setEditingTeam({
      ...editingTeam,
      name: val,
      shortName: shortAuto,
    });
  };

  const handleEditorPlayerChange = (playerId: string, updates: Partial<Player>) => {
    if (!editingTeam) return;
    setEditingTeam({
      ...editingTeam,
      players: editingTeam.players.map((p) => (p.id === playerId ? { ...p, ...updates } : p)),
    });
  };

  const handleEditorToggleCaptain = (playerId: string) => {
    if (!editingTeam) return;
    setEditingTeam({
      ...editingTeam,
      players: editingTeam.players.map((p) => ({
        ...p,
        isCaptain: p.id === playerId ? !p.isCaptain : false,
      })),
    });
  };

  const handleEditorToggleWk = (playerId: string) => {
    if (!editingTeam) return;
    setEditingTeam({
      ...editingTeam,
      players: editingTeam.players.map((p) => {
        if (p.id === playerId) {
          const nextWk = !p.isWicketKeeper;
          return {
            ...p,
            isWicketKeeper: nextWk,
            role: nextWk ? 'wicket_keeper' : p.role === 'wicket_keeper' ? 'batsman' : p.role,
          };
        }
        return p;
      }),
    });
  };

  const handleEditorAddPlayer = () => {
    if (!editingTeam) return;
    const count = editingTeam.players.length + 1;
    const prefix = editingTeam.shortName.toLowerCase() || 'pl';
    const newP: Player = {
      id: `${prefix}-${count}-${Date.now()}`,
      name: `Player ${count}`,
      role: count <= 4 ? 'batsman' : count <= 7 ? 'all_rounder' : 'bowler',
      isCaptain: false,
      isWicketKeeper: false,
    };
    setEditingTeam({
      ...editingTeam,
      players: [...editingTeam.players, newP],
    });
    showToast(`Added Player ${count}`);
  };

  const handleEditorRemovePlayer = (playerId: string) => {
    if (!editingTeam) return;
    if (editingTeam.players.length <= 2) {
      showToast('A team squad must have at least 2 players.');
      return;
    }
    setEditingTeam({
      ...editingTeam,
      players: editingTeam.players.filter((p) => p.id !== playerId),
    });
  };

  const handleApplyBulkPaste = () => {
    if (!editingTeam || !bulkPasteText.trim()) return;
    const names = bulkPasteText
      .split(/[,\n\r;]+/)
      .map((n) => n.trim())
      .filter(Boolean);

    if (names.length === 0) return;

    const prefix = editingTeam.shortName.toLowerCase() || 'pl';
    const newSquad: Player[] = names.map((name, index) => {
      const existing = editingTeam.players[index];
      return {
        id: existing?.id || `${prefix}-${index + 1}-${Date.now()}`,
        name,
        role: existing?.role || (index <= 3 ? 'batsman' : index === 4 ? 'wicket_keeper' : index <= 6 ? 'all_rounder' : 'bowler'),
        isCaptain: index === 0,
        isWicketKeeper: index === 4,
      };
    });

    setEditingTeam({
      ...editingTeam,
      players: newSquad,
    });
    setShowBulkPaste(false);
    setBulkPasteText('');
    showToast(`Applied ${names.length} players from pasted text!`);
  };

  const handleSaveEditingTeam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTeam) return;

    const name = editingTeam.name.trim() || 'Custom Team';
    const shortName = editingTeam.shortName.trim().toUpperCase() || name.substring(0, 3).toUpperCase();
    
    // Sanitize players
    const finalPlayers: Player[] = editingTeam.players.map((p, idx) => ({
      ...p,
      name: p.name.trim() || `${shortName} Player ${idx + 1}`,
      role: p.role || 'batsman',
    }));

    // Ensure Captain and Keeper
    if (!finalPlayers.some((p) => p.isCaptain) && finalPlayers[0]) {
      finalPlayers[0].isCaptain = true;
    }
    if (!finalPlayers.some((p) => p.isWicketKeeper) && finalPlayers[3]) {
      finalPlayers[3].isWicketKeeper = true;
      finalPlayers[3].role = 'wicket_keeper';
    }

    const finalizedTeam: Team = {
      ...editingTeam,
      name,
      shortName,
      players: finalPlayers,
    };

    const updatedList = saveCustomTeam(finalizedTeam);
    setTeams(updatedList);
    setEditingTeam(null);
    setIsCreatingNew(false);
    showToast(`Team "${finalizedTeam.name}" saved! Available for all future matches.`);
  };

  // Export/Import JSON backup of custom teams
  const handleExportJson = () => {
    const jsonStr = JSON.stringify(teams, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `criclive_custom_teams_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Exported custom teams JSON');
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target?.result as string);
        if (Array.isArray(parsed)) {
          let merged = [...teams];
          parsed.forEach((t: any) => {
            if (t.name && Array.isArray(t.players)) {
              merged = saveCustomTeam(t);
            }
          });
          setTeams(merged);
          showToast(`Imported custom teams successfully!`);
        } else {
          showToast('Invalid JSON structure for teams.');
        }
      } catch (err) {
        showToast('Failed to parse teams JSON file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="p-3.5 sm:p-5 space-y-4 pb-24 animate-fadeIn">
      {/* Toast Banner */}
      {toastMessage && (
        <div className="p-3 rounded-2xl bg-emerald-950/90 border border-emerald-500/60 text-emerald-300 text-xs font-semibold shadow-xl flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-emerald-400 hover:text-white text-xs ml-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-slate-950 shadow-md shadow-emerald-950">
              <Shield className="w-4 h-4 text-slate-950" />
            </div>
            <h2 className="text-base font-bold text-white tracking-tight">Custom Teams Library</h2>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold">
              {teams.length} Saved
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Create custom clubs & franchises with full rosters, saved persistently for all future matches
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleExportJson}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs flex items-center gap-1 transition-colors"
            title="Export Teams JSON"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export</span>
          </button>

          <label className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs flex items-center gap-1 transition-colors cursor-pointer" title="Import Teams JSON">
            <Upload className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Import</span>
            <input
              type="file"
              accept=".json"
              onChange={handleImportJson}
              className="hidden"
            />
          </label>

          <button
            type="button"
            onClick={handleStartCreate}
            className="py-2 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-950 transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create New Team</span>
          </button>
        </div>
      </div>

      {/* If Editing/Creating a Team */}
      {editingTeam ? (
        <form onSubmit={handleSaveEditingTeam} className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: editingTeam.color }}
              />
              <h3 className="text-sm font-bold text-white">
                {isCreatingNew ? 'Create New Custom Team' : `Edit "${editingTeam.name}"`}
              </h3>
            </div>
            <button
              type="button"
              onClick={() => {
                setEditingTeam(null);
                setIsCreatingNew(false);
              }}
              className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded-lg bg-slate-800"
            >
              Cancel
            </button>
          </div>

          {/* Team Basic Info */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Team Name *
              </label>
              <input
                type="text"
                required
                value={editingTeam.name}
                onChange={(e) => handleEditorTeamNameChange(e.target.value)}
                placeholder="e.g. Lahore Tigers, Street Strikers CC..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Short Code (3-4 Letters) *
              </label>
              <input
                type="text"
                required
                maxLength={5}
                value={editingTeam.shortName}
                onChange={(e) => setEditingTeam({ ...editingTeam, shortName: e.target.value.toUpperCase() })}
                placeholder="e.g. LT, RST"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white uppercase font-mono font-bold focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Color Picker */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1.5">
              Team Jersey & Crest Color
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c.hex}
                  type="button"
                  onClick={() => setEditingTeam({ ...editingTeam, color: c.hex })}
                  className={`w-7 h-7 rounded-xl flex items-center justify-center transition-all ${
                    editingTeam.color.toLowerCase() === c.hex.toLowerCase()
                      ? 'ring-2 ring-white scale-110 shadow-md'
                      : 'opacity-70 hover:opacity-100 hover:scale-105'
                  }`}
                  style={{ backgroundColor: c.hex }}
                  title={c.name}
                >
                  {editingTeam.color.toLowerCase() === c.hex.toLowerCase() && (
                    <Check className="w-3.5 h-3.5 text-white drop-shadow" />
                  )}
                </button>
              ))}
              <div className="flex items-center gap-1.5 ml-2 bg-slate-950 px-2 py-1 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 font-mono">Custom:</span>
                <input
                  type="color"
                  value={editingTeam.color}
                  onChange={(e) => setEditingTeam({ ...editingTeam, color: e.target.value })}
                  className="w-5 h-5 rounded cursor-pointer bg-transparent border-0"
                />
              </div>
            </div>
          </div>

          {/* Players Roster Section */}
          <div className="pt-2 border-t border-slate-800/80 space-y-2.5">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" />
                  Squad Players ({editingTeam.players.length})
                </h4>
                <p className="text-[11px] text-slate-400">
                  Assign names, roles, captain (C) & wicket-keeper (WK)
                </p>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleEditorAddPlayer}
                  className="py-1 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1 border border-slate-700"
                >
                  <Plus className="w-3 h-3 text-emerald-400" />
                  <span>Add Player</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowBulkPaste((prev) => !prev)}
                  className="py-1 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1 border border-slate-700"
                >
                  <ClipboardList className="w-3 h-3 text-sky-400" />
                  <span>Bulk Paste</span>
                </button>
              </div>
            </div>

            {/* Bulk Paste Drawer */}
            {showBulkPaste && (
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-[11px] text-slate-300">
                  <span className="font-semibold">Paste Player Names:</span>
                  <span className="text-slate-400">Comma, semicolon, or line separated</span>
                </div>
                <textarea
                  value={bulkPasteText}
                  onChange={(e) => setBulkPasteText(e.target.value)}
                  placeholder="e.g. Babar Azam, Mohammad Rizwan, Shaheen Afridi, Naseem Shah, Haris Rauf..."
                  rows={3}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowBulkPaste(false)}
                    className="px-2.5 py-1 text-xs text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleApplyBulkPaste}
                    className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold"
                  >
                    Apply Names
                  </button>
                </div>
              </div>
            )}

            {/* Players List Table/Cards */}
            <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1">
              {editingTeam.players.map((p, index) => (
                <div
                  key={p.id}
                  className="p-2 rounded-xl bg-slate-950/80 border border-slate-800/80 flex items-center gap-2 text-xs hover:border-slate-700 transition-colors"
                >
                  <span className="w-6 text-center font-mono text-[11px] text-slate-500 font-bold shrink-0">
                    #{index + 1}
                  </span>

                  <input
                    type="text"
                    value={p.name}
                    onChange={(e) => handleEditorPlayerChange(p.id, { name: e.target.value })}
                    placeholder={`Player ${index + 1}`}
                    className="flex-1 min-w-0 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />

                  {/* Role */}
                  <select
                    value={p.role}
                    onChange={(e) => handleEditorPlayerChange(p.id, { role: e.target.value as Player['role'] })}
                    className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-[11px] text-slate-300 focus:outline-none focus:border-emerald-500 shrink-0"
                  >
                    <option value="batsman">Batsman</option>
                    <option value="bowler">Bowler</option>
                    <option value="all_rounder">All-Rounder</option>
                    <option value="wicket_keeper">Wicket Keeper</option>
                  </select>

                  {/* Captain Toggle */}
                  <button
                    type="button"
                    onClick={() => handleEditorToggleCaptain(p.id)}
                    className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-colors shrink-0 flex items-center gap-0.5 ${
                      p.isCaptain
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                        : 'bg-slate-900 text-slate-500 border-slate-800 hover:text-slate-300'
                    }`}
                    title="Toggle Team Captain"
                  >
                    <Crown className="w-2.5 h-2.5" />
                    <span>C</span>
                  </button>

                  {/* Wicket Keeper Toggle */}
                  <button
                    type="button"
                    onClick={() => handleEditorToggleWk(p.id)}
                    className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-colors shrink-0 ${
                      p.isWicketKeeper
                        ? 'bg-sky-500/20 text-sky-300 border-sky-500/50'
                        : 'bg-slate-900 text-slate-500 border-slate-800 hover:text-slate-300'
                    }`}
                    title="Toggle Wicket Keeper"
                  >
                    WK
                  </button>

                  {/* Remove Player */}
                  <button
                    type="button"
                    onClick={() => handleEditorRemovePlayer(p.id)}
                    className="p-1 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0"
                    title="Remove Player"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => {
                setEditingTeam(null);
                setIsCreatingNew(false);
              }}
              className="py-2 px-4 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="py-2 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-950 transition-all flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Team Data</span>
            </button>
          </div>
        </form>
      ) : null}

      {/* Search Bar */}
      {!editingTeam && (
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search custom teams by name, short code, or player..."
            className="w-full bg-slate-900/90 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>
      )}

      {/* Teams Grid */}
      {!editingTeam && (
        <div className="space-y-3">
          {filteredTeams.length === 0 ? (
            <div className="text-center py-12 px-4 rounded-2xl bg-slate-900/40 border border-slate-800/80 space-y-3">
              <Shield className="w-10 h-10 text-slate-600 mx-auto" />
              <div>
                <p className="text-sm font-semibold text-slate-300">No custom teams found</p>
                <p className="text-xs text-slate-500 mt-1">
                  Create your own custom team with a custom roster to use in any upcoming match.
                </p>
              </div>
              <button
                type="button"
                onClick={handleStartCreate}
                className="py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-md shadow-emerald-950"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Custom Team</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredTeams.map((team) => {
                const captain = team.players.find((p) => p.isCaptain);
                const keeper = team.players.find((p) => p.isWicketKeeper);

                return (
                  <div
                    key={team.id}
                    className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700/80 space-y-3 shadow-md transition-all group"
                  >
                    {/* Top Row: Crest, Name, Short Code & Quick Action */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {/* Jersey Crest */}
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs text-white shadow-md shrink-0 uppercase tracking-wider"
                          style={{ backgroundColor: team.color }}
                        >
                          {team.shortName.substring(0, 3)}
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-sm font-bold text-white truncate flex items-center gap-1.5">
                            <span>{team.name}</span>
                          </h3>
                          <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                            <span className="font-mono font-semibold text-slate-300 uppercase">
                              {team.shortName}
                            </span>
                            <span>•</span>
                            <span className="text-slate-400">
                              {team.players.length} Players
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Select for Match button (if callback provided) */}
                      {onSelectTeamForMatch && (
                        <button
                          type="button"
                          onClick={() => onSelectTeamForMatch(team)}
                          className="py-1.5 px-3 rounded-xl bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30 text-xs font-bold flex items-center gap-1 transition-all shrink-0 active:scale-95"
                          title="Schedule/Fix a match with this team"
                        >
                          <span>Fix Match</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>

                    {/* Key Players info */}
                    <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 grid grid-cols-2 gap-2 text-[11px]">
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold block">
                          Captain
                        </span>
                        <span className="font-bold text-amber-300 truncate block mt-0.5 flex items-center gap-1">
                          <Crown className="w-2.5 h-2.5 text-amber-400 shrink-0" />
                          <span className="truncate">{captain?.name || 'Not assigned'}</span>
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold block">
                          Wicket-Keeper
                        </span>
                        <span className="font-bold text-sky-300 truncate block mt-0.5">
                          {keeper?.name || 'Not assigned'}
                        </span>
                      </div>
                    </div>

                    {/* Squad preview snippet */}
                    <div className="text-[11px] text-slate-400 line-clamp-1">
                      <span className="text-slate-500 font-semibold">Squad: </span>
                      {team.players.slice(0, 5).map((p) => p.name).join(', ')}
                      {team.players.length > 5 && ` +${team.players.length - 5} more`}
                    </div>

                    {/* Card Footer Actions */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleStartEdit(team)}
                          className="py-1 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium flex items-center gap-1 transition-colors"
                        >
                          <Edit3 className="w-3 h-3 text-emerald-400" />
                          <span>Edit Squad</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDuplicate(team)}
                          className="py-1 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium flex items-center gap-1 transition-colors"
                          title="Duplicate Team"
                        >
                          <Copy className="w-3 h-3 text-sky-400" />
                          <span>Clone</span>
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDelete(team.id, team.name)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        title="Delete Team"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
