import React, { useState } from 'react';
import { 
  Calendar, 
  Plus, 
  MapPin, 
  Award, 
  Trash2, 
  Play, 
  CheckCircle2, 
  Sparkles, 
  ArrowRight,
  Shield,
  Layers,
  Users,
  UserPlus,
  FileDown,
  Pencil,
  Check,
  RotateCcw,
  ClipboardList,
  UserCheck
} from 'lucide-react';
import { Match, Team, MatchFormat, Player } from '../types';
import { DEFAULT_TEAMS, createBlankInnings } from '../data/mockData';
import { exportScorecardToPDF } from '../utils/pdfExport';
import { getSavedCustomTeams, saveCustomTeam } from '../utils/customTeamsStorage';
import { CustomTeamsModal } from './CustomTeamsModal';
import { EditSquadsModal } from './EditSquadsModal';
import { Save } from 'lucide-react';

interface FixMatchesModalProps {
  matches: Match[];
  activeMatchId: string;
  onSelectMatch: (matchId: string) => void;
  onCreateMatch: (match: Match) => void;
  onDeleteMatch: (matchId: string) => void;
  onUpdateMatch?: (match: Match) => void;
  onClose: () => void;
}

const clonePlayers = (players: Player[]): Player[] =>
  players.map((p) => ({
    id: p.id,
    name: p.name,
    role: p.role,
    isCaptain: !!p.isCaptain,
    isWicketKeeper: !!p.isWicketKeeper,
  }));

export const FixMatchesModal: React.FC<FixMatchesModalProps> = ({
  matches,
  activeMatchId,
  onSelectMatch,
  onCreateMatch,
  onDeleteMatch,
  onUpdateMatch,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'fixtures' | 'schedule_new' | 'custom_teams' | 'presets'>('fixtures');
  const [filter, setFilter] = useState<'all' | 'live' | 'upcoming' | 'completed'>('all');
  const [savedCustomTeams, setSavedCustomTeams] = useState<Team[]>(() => getSavedCustomTeams());

  const allAvailableTeams = [...savedCustomTeams, ...DEFAULT_TEAMS];

  // Form states for fixing/scheduling new match
  const [seriesName, setSeriesName] = useState('Premier T20 Cup 2026');
  const [matchTitle, setMatchTitle] = useState('Match 1: Group Stage');
  const [teamAId, setTeamAId] = useState(DEFAULT_TEAMS[0].id);
  const [teamBId, setTeamBId] = useState(DEFAULT_TEAMS[1].id);
  const [customTeamAName, setCustomTeamAName] = useState('');
  const [customTeamBName, setCustomTeamBName] = useState('');
  const [overs, setOvers] = useState(20);
  const [matchFormat, setMatchFormat] = useState<MatchFormat>('T20');
  const [venue, setVenue] = useState('Eden Gardens, Kolkata');
  const [matchDate, setMatchDate] = useState('Today, 08:00 PM');
  const [pitchType, setPitchType] = useState<Match['pitchType']>('Batting Friendly');
  const [tossWinner, setTossWinner] = useState<'teamA' | 'teamB'>('teamA');
  const [tossChoice, setTossChoice] = useState<'bat' | 'bowl'>('bat');

  // Player details options while fixing the match
  const [teamAPlayers, setTeamAPlayers] = useState<Player[]>(() =>
    clonePlayers(DEFAULT_TEAMS[0].players)
  );
  const [teamBPlayers, setTeamBPlayers] = useState<Player[]>(() =>
    clonePlayers(DEFAULT_TEAMS[1].players)
  );
  const [squadConfigTab, setSquadConfigTab] = useState<'teamA' | 'teamB'>('teamA');
  const [showBulkPaste, setShowBulkPaste] = useState(false);
  const [bulkPasteText, setBulkPasteText] = useState('');
  const [squadToast, setSquadToast] = useState<string | null>(null);
  const [editingMatchSquad, setEditingMatchSquad] = useState<Match | null>(null);

  // Initial Openers & Bowler selection
  const [openingStrikerId, setOpeningStrikerId] = useState<string>('');
  const [openingNonStrikerId, setOpeningNonStrikerId] = useState<string>('');
  const [openingBowlerId, setOpeningBowlerId] = useState<string>('');

  const filteredMatches = matches.filter((m) => {
    if (filter === 'all') return true;
    return m.status === filter;
  });

  const showToast = (msg: string) => {
    setSquadToast(msg);
    setTimeout(() => setSquadToast(null), 3000);
  };

  const handleSelectTeamA = (newId: string) => {
    setTeamAId(newId);
    const found = allAvailableTeams.find((t) => t.id === newId);
    if (found) {
      setTeamAPlayers(clonePlayers(found.players));
      setCustomTeamAName('');
      showToast(`Loaded squad for ${found.name}`);
    }
  };

  const handleSelectTeamB = (newId: string) => {
    setTeamBId(newId);
    const found = allAvailableTeams.find((t) => t.id === newId);
    if (found) {
      setTeamBPlayers(clonePlayers(found.players));
      setCustomTeamBName('');
      showToast(`Loaded squad for ${found.name}`);
    }
  };

  const handleSaveSquadAsCustomTeam = (teamKey: 'teamA' | 'teamB') => {
    const isA = teamKey === 'teamA';
    const foundBase = allAvailableTeams.find((t) => t.id === (isA ? teamAId : teamBId));
    const defaultName = isA
      ? (customTeamAName.trim() || foundBase?.name || 'Custom Team A')
      : (customTeamBName.trim() || foundBase?.name || 'Custom Team B');

    const namePrompt = window.prompt('Enter a name to save this custom team for future matches:', defaultName);
    if (!namePrompt || !namePrompt.trim()) return;

    const trimmedName = namePrompt.trim();
    const short = trimmedName.replace(/[^A-Za-z0-9]/g, '').substring(0, 3).toUpperCase() || 'CST';
    const teamColor = foundBase?.color || (isA ? '#0284c7' : '#15803d');
    const currentSquad = isA ? teamAPlayers : teamBPlayers;

    const newTeam: Team = {
      id: `custom-team-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: trimmedName,
      shortName: short,
      color: teamColor,
      players: clonePlayers(currentSquad),
    };

    const updated = saveCustomTeam(newTeam);
    setSavedCustomTeams(updated);

    if (isA) {
      setTeamAId(newTeam.id);
      setCustomTeamAName('');
    } else {
      setTeamBId(newTeam.id);
      setCustomTeamBName('');
    }

    showToast(`Team "${newTeam.name}" saved! Available for all future matches.`);
  };

  const handleSelectCustomTeamForMatch = (selectedTeam: Team) => {
    setSavedCustomTeams(getSavedCustomTeams());
    setTeamAId(selectedTeam.id);
    setCustomTeamAName('');
    setTeamAPlayers(clonePlayers(selectedTeam.players));
    setActiveTab('schedule_new');
    showToast(`Selected "${selectedTeam.name}" as Team A`);
  };

  const handlePlayerNameChange = (team: 'teamA' | 'teamB', playerId: string, newName: string) => {
    if (team === 'teamA') {
      setTeamAPlayers((prev) =>
        prev.map((p) => (p.id === playerId ? { ...p, name: newName } : p))
      );
    } else {
      setTeamBPlayers((prev) =>
        prev.map((p) => (p.id === playerId ? { ...p, name: newName } : p))
      );
    }
  };

  const handlePlayerRoleChange = (
    team: 'teamA' | 'teamB',
    playerId: string,
    newRole: Player['role']
  ) => {
    const isWk = newRole === 'wicket_keeper';
    if (team === 'teamA') {
      setTeamAPlayers((prev) =>
        prev.map((p) => (p.id === playerId ? { ...p, role: newRole, isWicketKeeper: isWk || p.isWicketKeeper } : p))
      );
    } else {
      setTeamBPlayers((prev) =>
        prev.map((p) => (p.id === playerId ? { ...p, role: newRole, isWicketKeeper: isWk || p.isWicketKeeper } : p))
      );
    }
  };

  const handleToggleCaptain = (team: 'teamA' | 'teamB', playerId: string) => {
    if (team === 'teamA') {
      setTeamAPlayers((prev) =>
        prev.map((p) => ({
          ...p,
          isCaptain: p.id === playerId ? !p.isCaptain : false,
        }))
      );
    } else {
      setTeamBPlayers((prev) =>
        prev.map((p) => ({
          ...p,
          isCaptain: p.id === playerId ? !p.isCaptain : false,
        }))
      );
    }
  };

  const handleToggleWk = (team: 'teamA' | 'teamB', playerId: string) => {
    if (team === 'teamA') {
      setTeamAPlayers((prev) =>
        prev.map((p) => {
          if (p.id === playerId) {
            const nextWk = !p.isWicketKeeper;
            return {
              ...p,
              isWicketKeeper: nextWk,
              role: nextWk ? 'wicket_keeper' : p.role === 'wicket_keeper' ? 'batsman' : p.role,
            };
          }
          return p;
        })
      );
    } else {
      setTeamBPlayers((prev) =>
        prev.map((p) => {
          if (p.id === playerId) {
            const nextWk = !p.isWicketKeeper;
            return {
              ...p,
              isWicketKeeper: nextWk,
              role: nextWk ? 'wicket_keeper' : p.role === 'wicket_keeper' ? 'batsman' : p.role,
            };
          }
          return p;
        })
      );
    }
  };

  const handleAddPlayer = (team: 'teamA' | 'teamB') => {
    const isA = team === 'teamA';
    const currentList = isA ? teamAPlayers : teamBPlayers;
    const count = currentList.length + 1;
    const newP: Player = {
      id: `${isA ? 'pa' : 'pb'}-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      name: `Player ${count}`,
      role: count <= 4 ? 'batsman' : count <= 7 ? 'all_rounder' : 'bowler',
      isCaptain: false,
      isWicketKeeper: false,
    };
    if (isA) {
      setTeamAPlayers((prev) => [...prev, newP]);
    } else {
      setTeamBPlayers((prev) => [...prev, newP]);
    }
    showToast(`Added Player ${count}`);
  };

  const handleRemovePlayer = (team: 'teamA' | 'teamB', playerId: string) => {
    const isA = team === 'teamA';
    const currentList = isA ? teamAPlayers : teamBPlayers;
    if (currentList.length <= 2) {
      showToast('A team squad must have at least 2 players.');
      return;
    }
    if (isA) {
      setTeamAPlayers((prev) => prev.filter((p) => p.id !== playerId));
    } else {
      setTeamBPlayers((prev) => prev.filter((p) => p.id !== playerId));
    }
  };

  const handleApplyBulkPaste = (team: 'teamA' | 'teamB') => {
    if (!bulkPasteText.trim()) return;
    const names = bulkPasteText
      .split(/[,\n\r;]+/)
      .map((n) => n.trim())
      .filter(Boolean);

    if (names.length === 0) return;

    const isA = team === 'teamA';
    const updated: Player[] = names.map((name, idx) => ({
      id: `${isA ? 'pa' : 'pb'}-${Date.now()}-${idx + 1}`,
      name,
      role: idx === 0 ? 'batsman' : idx === 3 ? 'wicket_keeper' : idx < 5 ? 'batsman' : idx < 7 ? 'all_rounder' : 'bowler',
      isCaptain: idx === 0,
      isWicketKeeper: idx === 3,
    }));

    if (isA) {
      setTeamAPlayers(updated);
    } else {
      setTeamBPlayers(updated);
    }
    setBulkPasteText('');
    setShowBulkPaste(false);
    showToast(`Imported ${names.length} players into ${isA ? 'Team A' : 'Team B'}!`);
  };

  const handleResetSquad = (team: 'teamA' | 'teamB') => {
    const isA = team === 'teamA';
    const defaultTeam = allAvailableTeams.find((t) => t.id === (isA ? teamAId : teamBId)) || (isA ? DEFAULT_TEAMS[0] : DEFAULT_TEAMS[1]);
    if (isA) {
      setTeamAPlayers(clonePlayers(defaultTeam.players));
    } else {
      setTeamBPlayers(clonePlayers(defaultTeam.players));
    }
    showToast(`Reset ${isA ? 'Team A' : 'Team B'} to default squad.`);
  };

  const handleCreateMatch = (e: React.FormEvent) => {
    e.preventDefault();

    const defTeamA = allAvailableTeams.find((t) => t.id === teamAId) || DEFAULT_TEAMS[0];
    const defTeamB = allAvailableTeams.find((t) => t.id === teamBId) || DEFAULT_TEAMS[1];

    const teamAName = customTeamAName.trim() || defTeamA.name;
    const teamBName = customTeamBName.trim() || defTeamB.name;

    const teamAShort = customTeamAName.trim() 
      ? customTeamAName.trim().substring(0, 3).toUpperCase() 
      : defTeamA.shortName;
    const teamBShort = customTeamBName.trim() 
      ? customTeamBName.trim().substring(0, 3).toUpperCase() 
      : defTeamB.shortName;

    // Sanitize players list
    const finalPlayersA: Player[] = (teamAPlayers.length > 0 ? teamAPlayers : defTeamA.players).map((p, idx) => ({
      ...p,
      name: p.name.trim() || `${teamAShort} Player ${idx + 1}`,
      role: p.role || 'batsman',
    }));

    const finalPlayersB: Player[] = (teamBPlayers.length > 0 ? teamBPlayers : defTeamB.players).map((p, idx) => ({
      ...p,
      name: p.name.trim() || `${teamBShort} Player ${idx + 1}`,
      role: p.role || 'batsman',
    }));

    // Ensure Captain and Wicket Keeper
    if (!finalPlayersA.some((p) => p.isCaptain) && finalPlayersA[0]) finalPlayersA[0].isCaptain = true;
    if (!finalPlayersA.some((p) => p.isWicketKeeper) && finalPlayersA[3]) {
      finalPlayersA[3].isWicketKeeper = true;
      finalPlayersA[3].role = 'wicket_keeper';
    }

    if (!finalPlayersB.some((p) => p.isCaptain) && finalPlayersB[0]) finalPlayersB[0].isCaptain = true;
    if (!finalPlayersB.some((p) => p.isWicketKeeper) && finalPlayersB[3]) {
      finalPlayersB[3].isWicketKeeper = true;
      finalPlayersB[3].role = 'wicket_keeper';
    }

    const teamA: Team = {
      id: customTeamAName.trim() ? `team-custom-${Date.now()}-a` : defTeamA.id,
      name: teamAName,
      shortName: teamAShort,
      color: defTeamA.color || '#0284c7',
      players: finalPlayersA,
    };

    const teamB: Team = {
      id: customTeamBName.trim() ? `team-custom-${Date.now()}-b` : defTeamB.id,
      name: teamBName,
      shortName: teamBShort,
      color: defTeamB.color || '#16a34a',
      players: finalPlayersB,
    };

    const tossWinnerId = tossWinner === 'teamA' ? teamA.id : teamB.id;
    const firstBattingTeam = (tossWinnerId === teamA.id && tossChoice === 'bat') || (tossWinnerId === teamB.id && tossChoice === 'bowl')
      ? teamA
      : teamB;
    const firstBowlingTeam = firstBattingTeam.id === teamA.id ? teamB : teamA;

    // Determine initial openers
    const chosenStriker = openingStrikerId && firstBattingTeam.players.some((p) => p.id === openingStrikerId)
      ? openingStrikerId
      : firstBattingTeam.players[0]?.id || 'p-1';
    let chosenNonStriker = openingNonStrikerId && firstBattingTeam.players.some((p) => p.id === openingNonStrikerId)
      ? openingNonStrikerId
      : firstBattingTeam.players[1]?.id || 'p-2';
    if (chosenStriker === chosenNonStriker) {
      chosenNonStriker = firstBattingTeam.players.find((p) => p.id !== chosenStriker)?.id || chosenNonStriker;
    }
    const chosenBowler = openingBowlerId && firstBowlingTeam.players.some((p) => p.id === openingBowlerId)
      ? openingBowlerId
      : firstBowlingTeam.players[7]?.id || firstBowlingTeam.players[0]?.id || 'b-1';

    const newMatch: Match = {
      id: `match-${Date.now()}`,
      seriesName: seriesName || 'T20 Championship',
      matchTitle: matchTitle || `${teamA.shortName} vs ${teamB.shortName}`,
      teamA,
      teamB,
      overs: Number(overs) || 20,
      venue: venue || 'International Stadium',
      matchDate: matchDate || 'Today, 07:30 PM',
      pitchType,
      status: 'upcoming',
      tossWinnerId,
      tossChoice,
      currentInningsNumber: 1,
      innings: [
        createBlankInnings(firstBattingTeam, firstBowlingTeam, Number(overs) || 20, chosenStriker, chosenNonStriker, chosenBowler),
      ],
      createdAt: Date.now(),
    };

    onCreateMatch(newMatch);
    onSelectMatch(newMatch.id);
    setActiveTab('fixtures');
  };

  const applyPreset = (presetKey: string) => {
    let newMatch: Match;
    const now = Date.now();

    if (presetKey === 't20_wc') {
      const ind = DEFAULT_TEAMS[0];
      const pak = DEFAULT_TEAMS[1];
      newMatch = {
        id: `match-preset-${now}`,
        seriesName: 'ICC Men\'s T20 World Cup 2026',
        matchTitle: 'Super 8: India vs Pakistan',
        teamA: ind,
        teamB: pak,
        overs: 20,
        venue: 'Melbourne Cricket Ground (MCG)',
        matchDate: 'Today, 07:30 PM',
        pitchType: 'Batting Friendly',
        status: 'upcoming',
        tossWinnerId: ind.id,
        tossChoice: 'bat',
        currentInningsNumber: 1,
        innings: [createBlankInnings(ind, pak, 20)],
        createdAt: now,
      };
    } else if (presetKey === 'ipl_derby') {
      const mumbai: Team = {
        id: 'team-mi',
        name: 'Mumbai Titans',
        shortName: 'MT',
        color: '#0284c7',
        players: [
          { id: 'mi-1', name: 'Rohit Sharma', role: 'batsman', isCaptain: true },
          { id: 'mi-2', name: 'Ishan Kishan', role: 'wicket_keeper', isWicketKeeper: true },
          { id: 'mi-3', name: 'Suryakumar Yadav', role: 'batsman' },
          { id: 'mi-4', name: 'Tilak Varma', role: 'batsman' },
          { id: 'mi-5', name: 'Hardik Pandya', role: 'all_rounder' },
          { id: 'mi-6', name: 'Tim David', role: 'all_rounder' },
          { id: 'mi-7', name: 'Romario Shepherd', role: 'all_rounder' },
          { id: 'mi-8', name: 'Jasprit Bumrah', role: 'bowler' },
          { id: 'mi-9', name: 'Gerald Coetzee', role: 'bowler' },
          { id: 'mi-10', name: 'Piyush Chawla', role: 'bowler' },
          { id: 'mi-11', name: 'Akash Madhwal', role: 'bowler' },
        ],
      };
      const chennai: Team = {
        id: 'team-csk',
        name: 'Chennai Super Kings',
        shortName: 'CSK',
        color: '#eab308',
        players: [
          { id: 'csk-1', name: 'Ruturaj Gaikwad', role: 'batsman', isCaptain: true },
          { id: 'csk-2', name: 'Rachin Ravindra', role: 'all_rounder' },
          { id: 'csk-3', name: 'Ajinkya Rahane', role: 'batsman' },
          { id: 'csk-4', name: 'Shivam Dube', role: 'all_rounder' },
          { id: 'csk-5', name: 'MS Dhoni', role: 'wicket_keeper', isWicketKeeper: true },
          { id: 'csk-6', name: 'Ravindra Jadeja', role: 'all_rounder' },
          { id: 'csk-7', name: 'Moeen Ali', role: 'all_rounder' },
          { id: 'csk-8', name: 'Deepak Chahar', role: 'bowler' },
          { id: 'csk-9', name: 'Matheesha Pathirana', role: 'bowler' },
          { id: 'csk-10', name: 'Tushar Deshpande', role: 'bowler' },
          { id: 'csk-11', name: 'Maheesh Theekshana', role: 'bowler' },
        ],
      };
      newMatch = {
        id: `match-preset-${now}`,
        seriesName: 'Indian T20 Premier League',
        matchTitle: 'El Clasico: Mumbai vs Chennai',
        teamA: mumbai,
        teamB: chennai,
        overs: 20,
        venue: 'Wankhede Stadium, Mumbai',
        matchDate: 'Tonight, 08:00 PM',
        pitchType: 'Batting Friendly',
        status: 'upcoming',
        tossWinnerId: mumbai.id,
        tossChoice: 'bat',
        currentInningsNumber: 1,
        innings: [createBlankInnings(mumbai, chennai, 20)],
        createdAt: now,
      };
    } else {
      // 10 Overs Blitz
      const aus = DEFAULT_TEAMS[2];
      const eng = DEFAULT_TEAMS[3];
      newMatch = {
        id: `match-preset-${now}`,
        seriesName: 'T10 Super Blitz League',
        matchTitle: 'Express Final: AUS vs ENG',
        teamA: aus,
        teamB: eng,
        overs: 10,
        venue: 'Dubai International Stadium',
        matchDate: 'Live in 30 mins',
        pitchType: 'Batting Friendly',
        status: 'upcoming',
        tossWinnerId: aus.id,
        tossChoice: 'bat',
        currentInningsNumber: 1,
        innings: [createBlankInnings(aus, eng, 10)],
        createdAt: now,
      };
    }

    onCreateMatch(newMatch);
    setActiveTab('fixtures');
  };

  return (
    <div className="p-4 sm:p-5 space-y-4">
      {/* Header with Admin Badge */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white font-['Outfit']">Fix Matches & Fixtures</h2>
            <p className="text-[11px] text-slate-400">Admin Control Center: Schedule matches and manage tournaments</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="text-xs px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
        >
          Close
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-900/90 rounded-xl border border-slate-800">
        <button
          onClick={() => setActiveTab('fixtures')}
          className={`flex-1 py-1.5 px-2.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'fixtures'
              ? 'bg-slate-800 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">All</span> Fixtures ({matches.length})
        </button>

        <button
          onClick={() => setActiveTab('schedule_new')}
          className={`flex-1 py-1.5 px-2.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'schedule_new'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Fix Match</span>
        </button>

        <button
          onClick={() => {
            setSavedCustomTeams(getSavedCustomTeams());
            setActiveTab('custom_teams');
          }}
          className={`flex-1 py-1.5 px-2.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'custom_teams'
              ? 'bg-sky-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Shield className="w-3.5 h-3.5" />
          <span>Custom Teams</span>
        </button>

        <button
          onClick={() => setActiveTab('presets')}
          className={`flex-1 py-1.5 px-2.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'presets'
              ? 'bg-purple-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Presets</span>
        </button>
      </div>

      {/* View 1: List of Fixtures */}
      {activeTab === 'fixtures' && (
        <div className="space-y-3">
          {/* Status Filters */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            {(['all', 'live', 'upcoming', 'completed'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1 rounded-lg capitalize font-medium transition-all ${
                  filter === f
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    : 'bg-slate-900/60 text-slate-400 border border-slate-800/80 hover:text-slate-200'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          {filteredMatches.length === 0 ? (
            <div className="text-center py-10 px-4 bg-slate-900/40 rounded-2xl border border-slate-800/60">
              <Calendar className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-300">No {filter} matches found</p>
              <p className="text-xs text-slate-500 mt-1">Use "Fix New Match" to schedule a fixture</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredMatches.map((m) => {
                const isSelected = m.id === activeMatchId;
                const statusColor = 
                  m.status === 'live' ? 'text-red-400 bg-red-950/80 border-red-800/80' :
                  m.status === 'completed' ? 'text-emerald-400 bg-emerald-950/80 border-emerald-800/80' :
                  'text-amber-400 bg-amber-950/80 border-amber-800/80';

                return (
                  <div
                    key={m.id}
                    className={`p-3.5 rounded-2xl border transition-all ${
                      isSelected
                        ? 'bg-slate-900 border-emerald-500/50 shadow-lg shadow-emerald-950/30'
                        : 'bg-slate-900/60 border-slate-800/90 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider truncate max-w-[200px]">
                        {m.seriesName} • {m.overs} Overs
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border capitalize ${statusColor}`}>
                        {m.status === 'live' ? '● LIVE' : m.status}
                      </span>
                    </div>

                    {/* Teams Row */}
                    <div className="flex items-center justify-between py-1">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3.5 h-3.5 rounded-full" 
                          style={{ backgroundColor: m.teamA.color }}
                        />
                        <span className="text-sm font-bold text-white">{m.teamA.name}</span>
                      </div>
                      <span className="text-xs font-bold text-slate-500">VS</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">{m.teamB.name}</span>
                        <div 
                          className="w-3.5 h-3.5 rounded-full" 
                          style={{ backgroundColor: m.teamB.color }}
                        />
                      </div>
                    </div>

                    {/* Venue & Date */}
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/70 text-[11px] text-slate-400">
                      <div className="flex items-center gap-1 truncate max-w-[180px]">
                        <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                        <span className="truncate">{m.venue}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-500" />
                        <span>{m.matchDate}</span>
                      </div>
                    </div>

                    {/* Result or Status Summary if available */}
                    {m.resultSummary && (
                      <p className="text-[11px] font-medium text-emerald-400 mt-2 bg-emerald-950/30 px-2 py-1 rounded border border-emerald-900/50">
                        {m.resultSummary}
                      </p>
                    )}

                    {/* Action Buttons */}
                    <div className="flex items-center gap-1.5 mt-3 pt-2 flex-wrap">
                      <button
                        onClick={() => onSelectMatch(m.id)}
                        className={`flex-1 min-w-[110px] py-1.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                          isSelected
                            ? 'bg-emerald-500 text-slate-950 font-bold'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                        }`}
                      >
                        {isSelected ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Active Match
                          </>
                        ) : (
                          <>
                            <Play className="w-3.5 h-3.5" />
                            Select & Score
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => setEditingMatchSquad(m)}
                        className="py-1.5 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/80 text-xs font-semibold flex items-center gap-1 transition-colors"
                        title="View or edit players in this fixture"
                      >
                        <Users className="w-3.5 h-3.5 text-sky-400" />
                        <span>Players</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => exportScorecardToPDF(m)}
                        className="py-1.5 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1 transition-colors"
                        title="Download official scorecard PDF"
                      >
                        <FileDown className="w-3.5 h-3.5" />
                        <span>PDF</span>
                      </button>

                      {matches.length > 1 && (
                        <button
                          onClick={() => onDeleteMatch(m.id)}
                          className="p-1.5 rounded-xl bg-red-950/40 text-red-400 border border-red-900/60 hover:bg-red-900/50 transition-colors"
                          title="Delete Match"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* View 2: Fix / Schedule New Match Form */}
      {activeTab === 'schedule_new' && (
        <form onSubmit={handleCreateMatch} className="space-y-3.5 bg-slate-900/70 p-4 rounded-2xl border border-slate-800">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Tournament / Series</label>
              <input
                type="text"
                value={seriesName}
                onChange={(e) => setSeriesName(e.target.value)}
                placeholder="e.g. World Cup 2026"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Match Title / Stage</label>
              <input
                type="text"
                value={matchTitle}
                onChange={(e) => setMatchTitle(e.target.value)}
                placeholder="e.g. 1st Semi Final"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                required
              />
            </div>
          </div>

          {/* Teams Selection */}
          <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800/80 space-y-3">
            <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5" />
              Teams Setup
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Team A (Home)</label>
                <select
                  value={teamAId}
                  onChange={(e) => handleSelectTeamA(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 mb-1.5"
                >
                  {savedCustomTeams.length > 0 && (
                    <optgroup label="⚡ Saved Custom Teams">
                      {savedCustomTeams.map((t) => (
                        <option key={t.id} value={t.id}>
                          🏏 {t.name} ({t.shortName}) - {t.players.length}P
                        </option>
                      ))}
                    </optgroup>
                  )}
                  <optgroup label="🌍 International Teams">
                    {DEFAULT_TEAMS.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.shortName})
                      </option>
                    ))}
                  </optgroup>
                </select>
                <input
                  type="text"
                  placeholder="Or enter custom Team A name"
                  value={customTeamAName}
                  onChange={(e) => setCustomTeamAName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-[11px] text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Team B (Away)</label>
                <select
                  value={teamBId}
                  onChange={(e) => handleSelectTeamB(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 mb-1.5"
                >
                  {savedCustomTeams.length > 0 && (
                    <optgroup label="⚡ Saved Custom Teams">
                      {savedCustomTeams.map((t) => (
                        <option key={t.id} value={t.id}>
                          🏏 {t.name} ({t.shortName}) - {t.players.length}P
                        </option>
                      ))}
                    </optgroup>
                  )}
                  <optgroup label="🌍 International Teams">
                    {DEFAULT_TEAMS.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.shortName})
                      </option>
                    ))}
                  </optgroup>
                </select>
                <input
                  type="text"
                  placeholder="Or enter custom Team B name"
                  value={customTeamBName}
                  onChange={(e) => setCustomTeamBName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-[11px] text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Playing Squad & Player Details Section */}
          {(() => {
            const defTeamAObj = DEFAULT_TEAMS.find((t) => t.id === teamAId) || DEFAULT_TEAMS[0];
            const defTeamBObj = DEFAULT_TEAMS.find((t) => t.id === teamBId) || DEFAULT_TEAMS[1];
            const teamANameDisplay = customTeamAName.trim() || defTeamAObj.name;
            const teamBNameDisplay = customTeamBName.trim() || defTeamBObj.name;
            const activeSquad = squadConfigTab === 'teamA' ? teamAPlayers : teamBPlayers;

            return (
              <div className="p-3.5 bg-slate-950/80 rounded-2xl border border-slate-800/80 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5" />
                      Playing Squad & Player Details
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Customize names, roles, captain & keeper before fixing the match
                    </p>
                  </div>

                  {/* Team Switcher Tabs */}
                  <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
                    <button
                      type="button"
                      onClick={() => setSquadConfigTab('teamA')}
                      className={`px-3 py-1 rounded-lg font-semibold flex items-center gap-1.5 transition-all ${
                        squadConfigTab === 'teamA'
                          ? 'bg-sky-600 text-white shadow'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: defTeamAObj.color }} />
                      <span className="truncate max-w-[110px]">{teamANameDisplay}</span>
                      <span className="px-1.5 py-0.2 rounded-full bg-slate-800/80 text-[10px] font-mono">
                        {teamAPlayers.length}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSquadConfigTab('teamB')}
                      className={`px-3 py-1 rounded-lg font-semibold flex items-center gap-1.5 transition-all ${
                        squadConfigTab === 'teamB'
                          ? 'bg-emerald-600 text-white shadow'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: defTeamBObj.color }} />
                      <span className="truncate max-w-[110px]">{teamBNameDisplay}</span>
                      <span className="px-1.5 py-0.2 rounded-full bg-slate-800/80 text-[10px] font-mono">
                        {teamBPlayers.length}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Squad Notification Toast */}
                {squadToast && (
                  <div className="p-2 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs flex items-center justify-between">
                    <span>{squadToast}</span>
                    <button
                      type="button"
                      onClick={() => setSquadToast(null)}
                      className="text-emerald-400 hover:text-white text-xs ml-2"
                    >
                      ✕
                    </button>
                  </div>
                )}

                {/* Squad Toolbar */}
                <div className="flex items-center justify-between gap-2 flex-wrap pt-1 border-t border-slate-800/60 text-xs">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleAddPlayer(squadConfigTab)}
                      className="py-1 px-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700/80 flex items-center gap-1 font-medium transition-colors"
                    >
                      <Plus className="w-3 h-3 text-emerald-400" />
                      <span>Add Player</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowBulkPaste((prev) => !prev)}
                      className="py-1 px-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700/80 flex items-center gap-1 font-medium transition-colors"
                    >
                      <ClipboardList className="w-3 h-3 text-sky-400" />
                      <span>Quick Paste</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleResetSquad(squadConfigTab)}
                      className="py-1 px-2 rounded-lg text-slate-400 hover:text-slate-200 text-[11px] flex items-center gap-1 transition-colors"
                      title="Reset squad to default players"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Reset</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSaveSquadAsCustomTeam(squadConfigTab)}
                      className="py-1 px-2.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-[11px] flex items-center gap-1 font-bold transition-all"
                      title="Save this squad as a Custom Team for future matches"
                    >
                      <Save className="w-3 h-3 text-emerald-400" />
                      <span>Save as Custom Team</span>
                    </button>
                  </div>

                  <div className="text-[11px] text-slate-400 font-mono">
                    {activeSquad.length} Players {activeSquad.length !== 11 ? '(Custom XI size)' : '(Official XI)'}
                  </div>
                </div>

                {/* Bulk Paste Drawer */}
                {showBulkPaste && (
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-700/80 space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-slate-300">
                      <span className="font-semibold">
                        Paste Names for {squadConfigTab === 'teamA' ? teamANameDisplay : teamBNameDisplay}:
                      </span>
                      <span className="text-slate-400">Comma or line separated</span>
                    </div>
                    <textarea
                      value={bulkPasteText}
                      onChange={(e) => setBulkPasteText(e.target.value)}
                      placeholder="e.g. Rohit Sharma, Shubman Gill, Virat Kohli, KL Rahul, Hardik Pandya..."
                      rows={3}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
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
                        onClick={() => handleApplyBulkPaste(squadConfigTab)}
                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold"
                      >
                        Apply Names
                      </button>
                    </div>
                  </div>
                )}

                {/* Squad List */}
                <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                  {activeSquad.map((p, index) => (
                    <div
                      key={p.id}
                      className="p-2 rounded-xl bg-slate-900/90 border border-slate-800/80 flex items-center gap-2 text-xs hover:border-slate-700 transition-colors"
                    >
                      {/* Jersey Index */}
                      <span className="w-6 text-center font-mono text-[11px] text-slate-500 font-bold shrink-0">
                        #{index + 1}
                      </span>

                      {/* Player Name */}
                      <input
                        type="text"
                        value={p.name}
                        onChange={(e) => handlePlayerNameChange(squadConfigTab, p.id, e.target.value)}
                        placeholder="Player Name"
                        className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                      />

                      {/* Role Selector */}
                      <select
                        value={p.role}
                        onChange={(e) => handlePlayerRoleChange(squadConfigTab, p.id, e.target.value as any)}
                        className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-[11px] text-slate-200 focus:outline-none focus:border-emerald-500 shrink-0"
                      >
                        <option value="batsman">Batsman</option>
                        <option value="bowler">Bowler</option>
                        <option value="all_rounder">All-Rounder</option>
                        <option value="wicket_keeper">Wicket Keeper</option>
                      </select>

                      {/* Captain Toggle */}
                      <button
                        type="button"
                        onClick={() => handleToggleCaptain(squadConfigTab, p.id)}
                        className={`px-2 py-0.5 rounded-md font-bold text-[10px] transition-all shrink-0 ${
                          p.isCaptain
                            ? 'bg-amber-500 text-slate-950 shadow ring-1 ring-amber-400'
                            : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                        title={p.isCaptain ? 'Team Captain (Click to toggle)' : 'Make Captain'}
                      >
                        (C)
                      </button>

                      {/* Wicketkeeper Toggle */}
                      <button
                        type="button"
                        onClick={() => handleToggleWk(squadConfigTab, p.id)}
                        className={`px-1.5 py-0.5 rounded-md font-bold text-[10px] transition-all shrink-0 ${
                          p.isWicketKeeper
                            ? 'bg-sky-500 text-slate-950 shadow ring-1 ring-sky-400'
                            : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                        title={p.isWicketKeeper ? 'Wicket Keeper (Click to toggle)' : 'Make Wicket Keeper'}
                      >
                        (WK)
                      </button>

                      {/* Remove Player */}
                      <button
                        type="button"
                        disabled={activeSquad.length <= 2}
                        onClick={() => handleRemovePlayer(squadConfigTab, p.id)}
                        className="p-1 rounded-lg text-slate-500 hover:text-red-400 disabled:opacity-20 transition-colors shrink-0"
                        title={activeSquad.length <= 2 ? 'Minimum 2 players required' : 'Remove player'}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* Match Overs & Pitch */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Format</label>
              <select
                value={matchFormat}
                onChange={(e) => {
                  const f = e.target.value as MatchFormat;
                  setMatchFormat(f);
                  if (f === 'T20') setOvers(20);
                  if (f === 'ODI') setOvers(50);
                  if (f === 'T10') setOvers(10);
                }}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="T20">T20 (20 Overs)</option>
                <option value="T10">T10 (10 Overs)</option>
                <option value="ODI">ODI (50 Overs)</option>
                <option value="Custom">Custom Overs</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Total Overs</label>
              <input
                type="number"
                min="1"
                max="50"
                value={overs}
                onChange={(e) => setOvers(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                required
              />
            </div>

            <div className="col-span-2 sm:col-span-2">
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Pitch Condition</label>
              <select
                value={pitchType}
                onChange={(e) => setPitchType(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="Batting Friendly">Batting Friendly (High Scoring)</option>
                <option value="Bowling Pitch">Bowling Pitch (Green Seam)</option>
                <option value="Spin Friendly">Spin Friendly (Turn & Bounce)</option>
                <option value="Balanced">Balanced Standard Pitch</option>
              </select>
            </div>
          </div>

          {/* Venue & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Venue / Stadium</label>
              <input
                type="text"
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                placeholder="e.g. Lord's, London"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Match Timing / Date</label>
              <input
                type="text"
                value={matchDate}
                onChange={(e) => setMatchDate(e.target.value)}
                placeholder="e.g. Today, 07:30 PM"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Toss Settings */}
          {(() => {
            const teamAObj = DEFAULT_TEAMS.find((t) => t.id === teamAId) || DEFAULT_TEAMS[0];
            const teamBObj = DEFAULT_TEAMS.find((t) => t.id === teamBId) || DEFAULT_TEAMS[1];
            const isBattingA = (tossWinner === 'teamA' && tossChoice === 'bat') || (tossWinner === 'teamB' && tossChoice === 'bowl');
            const battingSquad = isBattingA ? (teamAPlayers.length > 0 ? teamAPlayers : teamAObj.players) : (teamBPlayers.length > 0 ? teamBPlayers : teamBObj.players);
            const bowlingSquad = isBattingA ? (teamBPlayers.length > 0 ? teamBPlayers : teamBObj.players) : (teamAPlayers.length > 0 ? teamAPlayers : teamAObj.players);
            const battingName = isBattingA ? (customTeamAName || teamAObj.name) : (customTeamBName || teamBObj.name);
            const bowlingName = isBattingA ? (customTeamBName || teamBObj.name) : (customTeamAName || teamAObj.name);

            return (
              <>
                <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800/80 grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">Toss Won By</label>
                    <select
                      value={tossWinner}
                      onChange={(e) => setTossWinner(e.target.value as any)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="teamA">Team A ({customTeamAName || teamAObj.name})</option>
                      <option value="teamB">Team B ({customTeamBName || teamBObj.name})</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">Elected To</label>
                    <select
                      value={tossChoice}
                      onChange={(e) => setTossChoice(e.target.value as any)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="bat">Bat First</option>
                      <option value="bowl">Bowl First</option>
                    </select>
                  </div>
                </div>

                {/* Starting Openers & Bowler (Configurable before scoring starts) */}
                <div className="p-3 bg-slate-950/90 rounded-2xl border border-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                      Starting Openers & Bowler
                    </span>
                    <span className="text-[10px] text-emerald-400 font-medium">
                      {battingName} Batting 1st
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div>
                      <label className="block text-[10px] text-emerald-400 font-bold mb-1">
                        ★ Striker (Facing 1st Ball)
                      </label>
                      <select
                        value={openingStrikerId || battingSquad[0]?.id || ''}
                        onChange={(e) => setOpeningStrikerId(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                      >
                        {battingSquad.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.role.replace('_', ' ')})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-300 font-semibold mb-1">
                        Non-Striker (Runner End)
                      </label>
                      <select
                        value={openingNonStrikerId || battingSquad[1]?.id || ''}
                        onChange={(e) => setOpeningNonStrikerId(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                      >
                        {battingSquad.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.role.replace('_', ' ')})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] text-sky-400 font-bold mb-1">
                        Opening Bowler ({bowlingName})
                      </label>
                      <select
                        value={openingBowlerId || bowlingSquad[7]?.id || bowlingSquad[0]?.id || ''}
                        onChange={(e) => setOpeningBowlerId(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500"
                      >
                        {bowlingSquad.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.role.replace('_', ' ')})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </>
            );
          })()}

          <button
            type="submit"
            className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-950 transition-all flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            Fix & Schedule Match Fixture
          </button>
        </form>
      )}

      {/* View: Custom Teams Library */}
      {activeTab === 'custom_teams' && (
        <CustomTeamsModal
          onSelectTeamForMatch={handleSelectCustomTeamForMatch}
        />
      )}

      {/* View 3: Presets */}
      {activeTab === 'presets' && (
        <div className="space-y-2.5">
          <p className="text-xs text-slate-400">
            Click any tournament preset below to instantly fix the match fixture with pre-loaded squads:
          </p>

          <div
            onClick={() => applyPreset('t20_wc')}
            className="p-3.5 rounded-2xl bg-gradient-to-r from-sky-950/60 to-slate-900 border border-sky-800/60 hover:border-sky-500 cursor-pointer transition-all group"
          >
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-sky-400 tracking-wider">ICC World Cup</span>
                <h4 className="text-sm font-bold text-white group-hover:text-sky-300 transition-colors">
                  India vs Pakistan (T20 Derby)
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">MCG Melbourne • 20 Overs • Star Squads</p>
              </div>
              <ArrowRight className="w-4 h-4 text-sky-400 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          <div
            onClick={() => applyPreset('ipl_derby')}
            className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-950/60 to-slate-900 border border-amber-800/60 hover:border-amber-500 cursor-pointer transition-all group"
          >
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">Indian Premier League</span>
                <h4 className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors">
                  Mumbai Titans vs Chennai Super Kings
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">Wankhede Stadium • 20 Overs • Rohit vs Dhoni</p>
              </div>
              <ArrowRight className="w-4 h-4 text-amber-400 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          <div
            onClick={() => applyPreset('t10_blitz')}
            className="p-3.5 rounded-2xl bg-gradient-to-r from-purple-950/60 to-slate-900 border border-purple-800/60 hover:border-purple-500 cursor-pointer transition-all group"
          >
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-purple-400 tracking-wider">Fast Format</span>
                <h4 className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors">
                  T10 Super Blitz: Australia vs England
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">Dubai Stadium • 10 Overs High Voltage</p>
              </div>
              <ArrowRight className="w-4 h-4 text-purple-400 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      )}

      {/* Fixture Squads / Players Editor Sub-Modal */}
      {editingMatchSquad && (
        <EditSquadsModal
          match={editingMatchSquad}
          onUpdateMatch={(updated) => {
            onUpdateMatch?.(updated);
            setEditingMatchSquad(updated);
          }}
          onClose={() => setEditingMatchSquad(null)}
        />
      )}
    </div>
  );
};
