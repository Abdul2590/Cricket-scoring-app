export type MatchFormat = 'T20' | 'ODI' | 'T10' | 'The Hundred' | 'Custom';

export type DismissalType = 'bowled' | 'caught' | 'lbw' | 'run_out' | 'stumped' | 'hit_wicket';

export interface Player {
  id: string;
  name: string;
  role: 'batsman' | 'bowler' | 'all_rounder' | 'wicket_keeper';
  isCaptain?: boolean;
  isWicketKeeper?: boolean;
}

export interface Team {
  id: string;
  name: string;
  shortName: string;
  color: string;
  textColor?: string;
  players: Player[];
}

export interface BallEvent {
  id: string;
  overIndex: number; // 0-indexed (e.g. 0 for 1st over)
  ballInOver: number; // 1 to 6 (for legal balls)
  runs: number;
  isExtra: boolean;
  extraType?: 'wide' | 'no_ball' | 'bye' | 'leg_bye' | 'penalty';
  extraRuns: number;
  isWicket: boolean;
  wicketType?: DismissalType;
  outPlayerId?: string;
  fielderName?: string;
  strikerId: string;
  nonStrikerId: string;
  bowlerId: string;
  commentary: string;
  shotType?: string;
  timestamp: number;
}

export interface BatsmanStats {
  playerId: string;
  playerName: string;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  strikeRate: number;
  isOut: boolean;
  dismissalInfo?: string;
}

export interface BowlerStats {
  playerId: string;
  playerName: string;
  overs: number; // decimal like 3.4
  maidens: number;
  runsConceded: number;
  wickets: number;
  economy: number;
  dots: number;
}

export interface FallOfWicket {
  wicketNumber: number;
  score: number;
  over: string;
  playerName: string;
}

export interface Innings {
  id: string;
  battingTeamId: string;
  bowlingTeamId: string;
  totalRuns: number;
  totalWickets: number;
  legalBallsBowled: number;
  totalOversLimit: number;
  wides: number;
  noBalls: number;
  byes: number;
  legByes: number;
  currentStrikerId: string;
  currentNonStrikerId: string;
  currentBowlerId: string;
  previousBowlerId?: string;
  battingScorecard: Record<string, BatsmanStats>;
  bowlingScorecard: Record<string, BowlerStats>;
  fallOfWickets: FallOfWicket[];
  recentBalls: BallEvent[];
  isCompleted: boolean;
}

export interface Match {
  id: string;
  seriesName: string;
  matchTitle: string;
  teamA: Team;
  teamB: Team;
  overs: number;
  venue: string;
  matchDate: string;
  pitchType: 'Batting Friendly' | 'Bowling Pitch' | 'Balanced' | 'Spin Friendly';
  status: 'upcoming' | 'live' | 'innings_break' | 'completed';
  tossWinnerId?: string;
  tossChoice?: 'bat' | 'bowl';
  currentInningsNumber: 1 | 2;
  innings: [Innings, Innings?];
  target?: number;
  winnerTeamId?: string;
  resultSummary?: string;
  createdAt: number;
}

export type ThemeKey = 'emerald' | 'sapphire' | 'crimson' | 'amber' | 'onyx';

export interface DashboardConfig {
  theme: ThemeKey;
  cardStyle: 'broadcast' | 'compact' | 'detailed';
  density: 'comfortable' | 'compact';
  pinnedMatchId: string | null;
  favoriteTeamId: string | null;
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  showAndroidFrame: boolean;
  extrasMode?: 'wide_noball' | 'all';
  widgets: {
    heroScorecard: boolean;
    liveBallTicker: boolean;
    partnershipBar: boolean;
    currentOverCard: boolean;
    commentaryStream: boolean;
    miniFixturesCarousel: boolean;
    statsHighlight: boolean;
    runRateTracker: boolean;
  };
}

export interface SavedGoogleUserProfile {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  lastLoginAt: number;
}

export type AppTab = 'dashboard' | 'scorer' | 'fixtures' | 'customize' | 'scorecard' | 'drive' | 'install' | 'edit_players' | 'custom_teams' | 'account';
