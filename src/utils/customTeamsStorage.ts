import { Team, Player } from '../types';
import { DEFAULT_TEAMS } from '../data/mockData';

export const STORAGE_KEY_CUSTOM_TEAMS = 'criclive_custom_teams_v1';

// Seed sample custom club teams if the user has not saved any yet
export const DEFAULT_CUSTOM_TEAMS_SEED: Team[] = [
  {
    id: 'custom-team-royal-strikers',
    name: 'Royal Strikers',
    shortName: 'RST',
    color: '#7c3aed', // Royal Violet
    players: [
      { id: 'rst-1', name: 'Zain Malik', role: 'batsman', isCaptain: true },
      { id: 'rst-2', name: 'Kabir Khan', role: 'batsman' },
      { id: 'rst-3', name: 'Hamza Tariq', role: 'wicket_keeper', isWicketKeeper: true },
      { id: 'rst-4', name: 'Farhan Ali', role: 'all_rounder' },
      { id: 'rst-5', name: 'Danish Aziz', role: 'all_rounder' },
      { id: 'rst-6', name: 'Usman Qadir', role: 'all_rounder' },
      { id: 'rst-7', name: 'Bilal Asif', role: 'batsman' },
      { id: 'rst-8', name: 'Wahab Riaz', role: 'bowler' },
      { id: 'rst-9', name: 'Zahid Mahmood', role: 'bowler' },
      { id: 'rst-10', name: 'Sohail Tanvir', role: 'bowler' },
      { id: 'rst-11', name: 'Mohammad Irfan', role: 'bowler' },
    ],
  },
  {
    id: 'custom-team-thunderbolts',
    name: 'Thunderbolts CC',
    shortName: 'TBC',
    color: '#ea580c', // Electric Orange
    players: [
      { id: 'tbc-1', name: 'Ayaan Shaikh', role: 'batsman', isCaptain: true },
      { id: 'tbc-2', name: 'Rohan Sharma', role: 'batsman' },
      { id: 'tbc-3', name: 'Samir Verma', role: 'batsman' },
      { id: 'tbc-4', name: 'Dev Patel', role: 'wicket_keeper', isWicketKeeper: true },
      { id: 'tbc-5', name: 'Aryan Joshi', role: 'all_rounder' },
      { id: 'tbc-6', name: 'Aditya Nair', role: 'all_rounder' },
      { id: 'tbc-7', name: 'Kunal Deshmukh', role: 'all_rounder' },
      { id: 'tbc-8', name: 'Varun Chakravarthy', role: 'bowler' },
      { id: 'tbc-9', name: 'Mayank Markande', role: 'bowler' },
      { id: 'tbc-10', name: 'Siddharth Kaul', role: 'bowler' },
      { id: 'tbc-11', name: 'Chetan Sakariya', role: 'bowler' },
    ],
  },
];

/**
 * Load saved custom teams from localStorage
 */
export function getSavedCustomTeams(): Team[] {
  if (typeof window === 'undefined') return DEFAULT_CUSTOM_TEAMS_SEED;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CUSTOM_TEAMS);
    if (!raw) {
      // Seed with initial club teams for immediate availability
      localStorage.setItem(STORAGE_KEY_CUSTOM_TEAMS, JSON.stringify(DEFAULT_CUSTOM_TEAMS_SEED));
      return DEFAULT_CUSTOM_TEAMS_SEED;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return DEFAULT_CUSTOM_TEAMS_SEED;
  } catch (err) {
    console.error('Failed to parse custom teams from storage:', err);
    return DEFAULT_CUSTOM_TEAMS_SEED;
  }
}

/**
 * Save or update a custom team in localStorage
 */
export function saveCustomTeam(team: Team): Team[] {
  const current = getSavedCustomTeams();
  const existingIdx = current.findIndex((t) => t.id === team.id);
  let updated: Team[];

  if (existingIdx >= 0) {
    updated = [...current];
    updated[existingIdx] = team;
  } else {
    updated = [team, ...current];
  }

  try {
    localStorage.setItem(STORAGE_KEY_CUSTOM_TEAMS, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save custom teams to storage:', e);
  }

  return updated;
}

/**
 * Delete a custom team from localStorage
 */
export function deleteCustomTeam(teamId: string): Team[] {
  const current = getSavedCustomTeams();
  const updated = current.filter((t) => t.id !== teamId);
  try {
    localStorage.setItem(STORAGE_KEY_CUSTOM_TEAMS, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to delete custom team from storage:', e);
  }
  return updated;
}

/**
 * Get all available teams (Saved Custom Teams + Default International Teams)
 */
export function getAllAvailableTeams(customTeams?: Team[]): { custom: Team[]; international: Team[]; all: Team[] } {
  const custom = customTeams || getSavedCustomTeams();
  const international = DEFAULT_TEAMS;
  return {
    custom,
    international,
    all: [...custom, ...international],
  };
}

/**
 * Helper to generate a blank team template ready for customization
 */
export function createNewBlankTeam(name?: string, shortName?: string, color?: string): Team {
  const teamId = `custom-team-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const finalName = name || 'New Custom Team';
  const finalShort = shortName || finalName.replace(/[^A-Za-z0-9]/g, '').substring(0, 3).toUpperCase() || 'NEW';
  const finalColor = color || '#059669'; // default emerald

  const defaultRoles: Player['role'][] = [
    'batsman',
    'batsman',
    'batsman',
    'wicket_keeper',
    'all_rounder',
    'all_rounder',
    'all_rounder',
    'bowler',
    'bowler',
    'bowler',
    'bowler',
  ];

  const players: Player[] = defaultRoles.map((role, idx) => ({
    id: `${finalShort.toLowerCase()}-${idx + 1}-${Date.now()}`,
    name: `${finalShort} Player ${idx + 1}`,
    role,
    isCaptain: idx === 0,
    isWicketKeeper: role === 'wicket_keeper',
  }));

  return {
    id: teamId,
    name: finalName,
    shortName: finalShort,
    color: finalColor,
    players,
  };
}

/**
 * Helper to duplicate an existing team into a new custom team
 */
export function duplicateCustomTeam(team: Team): Team {
  const newId = `custom-team-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const newShort = `${team.shortName.substring(0, 2)}2`;
  return {
    id: newId,
    name: `${team.name} (Copy)`,
    shortName: newShort,
    color: team.color,
    players: team.players.map((p, idx) => ({
      id: `${newShort.toLowerCase()}-${idx + 1}-${Date.now()}`,
      name: p.name,
      role: p.role,
      isCaptain: p.isCaptain,
      isWicketKeeper: p.isWicketKeeper,
    })),
  };
}
