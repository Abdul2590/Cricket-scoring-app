import { Match, Team, Innings, DashboardConfig } from '../types';

export const DEFAULT_TEAMS: Team[] = [
  {
    id: 'team-ind',
    name: 'India',
    shortName: 'IND',
    color: '#0284c7', // Sky Blue
    players: [
      { id: 'ind-1', name: 'Rohit Sharma', role: 'batsman', isCaptain: true },
      { id: 'ind-2', name: 'Virat Kohli', role: 'batsman' },
      { id: 'ind-3', name: 'Suryakumar Yadav', role: 'batsman' },
      { id: 'ind-4', name: 'Rishabh Pant', role: 'wicket_keeper', isWicketKeeper: true },
      { id: 'ind-5', name: 'Hardik Pandya', role: 'all_rounder' },
      { id: 'ind-6', name: 'Ravindra Jadeja', role: 'all_rounder' },
      { id: 'ind-7', name: 'Axar Patel', role: 'all_rounder' },
      { id: 'ind-8', name: 'Jasprit Bumrah', role: 'bowler' },
      { id: 'ind-9', name: 'Arshdeep Singh', role: 'bowler' },
      { id: 'ind-10', name: 'Kuldeep Yadav', role: 'bowler' },
      { id: 'ind-11', name: 'Mohammed Siraj', role: 'bowler' },
    ],
  },
  {
    id: 'team-pak',
    name: 'Pakistan',
    shortName: 'PAK',
    color: '#15803d', // Green
    players: [
      { id: 'pak-1', name: 'Babar Azam', role: 'batsman', isCaptain: true },
      { id: 'pak-2', name: 'Mohammad Rizwan', role: 'wicket_keeper', isWicketKeeper: true },
      { id: 'pak-3', name: 'Fakhar Zaman', role: 'batsman' },
      { id: 'pak-4', name: 'Iftikhar Ahmed', role: 'all_rounder' },
      { id: 'pak-5', name: 'Shadab Khan', role: 'all_rounder' },
      { id: 'pak-6', name: 'Imad Wasim', role: 'all_rounder' },
      { id: 'pak-7', name: 'Shaheen Afridi', role: 'bowler' },
      { id: 'pak-8', name: 'Naseem Shah', role: 'bowler' },
      { id: 'pak-9', name: 'Haris Rauf', role: 'bowler' },
      { id: 'pak-10', name: 'Mohammad Amir', role: 'bowler' },
      { id: 'pak-11', name: 'Abrar Ahmed', role: 'bowler' },
    ],
  },
  {
    id: 'team-aus',
    name: 'Australia',
    shortName: 'AUS',
    color: '#eab308', // Canary Yellow
    players: [
      { id: 'aus-1', name: 'Travis Head', role: 'batsman' },
      { id: 'aus-2', name: 'David Warner', role: 'batsman' },
      { id: 'aus-3', name: 'Mitchell Marsh', role: 'all_rounder', isCaptain: true },
      { id: 'aus-4', name: 'Glenn Maxwell', role: 'all_rounder' },
      { id: 'aus-5', name: 'Marcus Stoinis', role: 'all_rounder' },
      { id: 'aus-6', name: 'Tim David', role: 'batsman' },
      { id: 'aus-7', name: 'Matthew Wade', role: 'wicket_keeper', isWicketKeeper: true },
      { id: 'aus-8', name: 'Pat Cummins', role: 'bowler' },
      { id: 'aus-9', name: 'Mitchell Starc', role: 'bowler' },
      { id: 'aus-10', name: 'Adam Zampa', role: 'bowler' },
      { id: 'aus-11', name: 'Josh Hazlewood', role: 'bowler' },
    ],
  },
  {
    id: 'team-eng',
    name: 'England',
    shortName: 'ENG',
    color: '#e11d48', // Red
    players: [
      { id: 'eng-1', name: 'Jos Buttler', role: 'wicket_keeper', isCaptain: true, isWicketKeeper: true },
      { id: 'eng-2', name: 'Phil Salt', role: 'batsman' },
      { id: 'eng-3', name: 'Jonny Bairstow', role: 'batsman' },
      { id: 'eng-4', name: 'Harry Brook', role: 'batsman' },
      { id: 'eng-5', name: 'Liam Livingstone', role: 'all_rounder' },
      { id: 'eng-6', name: 'Moeen Ali', role: 'all_rounder' },
      { id: 'eng-7', name: 'Sam Curran', role: 'all_rounder' },
      { id: 'eng-8', name: 'Chris Jordan', role: 'bowler' },
      { id: 'eng-9', name: 'Jofra Archer', role: 'bowler' },
      { id: 'eng-10', name: 'Adil Rashid', role: 'bowler' },
      { id: 'eng-11', name: 'Mark Wood', role: 'bowler' },
    ],
  },
];

export function createBlankInnings(
  battingTeam: Team,
  bowlingTeam: Team,
  totalOvers: number,
  strikerId?: string,
  nonStrikerId?: string,
  bowlerId?: string
): Innings {
  const p1 = strikerId || battingTeam.players[0]?.id || 'p-1';
  const p2 = nonStrikerId || battingTeam.players[1]?.id || 'p-2';
  const b1 = bowlerId || bowlingTeam.players[7]?.id || bowlingTeam.players[0]?.id || 'b-1';

  const battingScorecard: Record<string, any> = {};
  battingTeam.players.forEach((p) => {
    battingScorecard[p.id] = {
      playerId: p.id,
      playerName: p.name,
      runs: 0,
      balls: 0,
      fours: 0,
      sixes: 0,
      strikeRate: 0,
      isOut: false,
    };
  });

  const bowlingScorecard: Record<string, any> = {};
  bowlingTeam.players.forEach((p) => {
    bowlingScorecard[p.id] = {
      playerId: p.id,
      playerName: p.name,
      overs: 0,
      maidens: 0,
      runsConceded: 0,
      wickets: 0,
      economy: 0,
      dots: 0,
    };
  });

  return {
    id: `inn-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    battingTeamId: battingTeam.id,
    bowlingTeamId: bowlingTeam.id,
    totalRuns: 0,
    totalWickets: 0,
    legalBallsBowled: 0,
    totalOversLimit: totalOvers,
    wides: 0,
    noBalls: 0,
    byes: 0,
    legByes: 0,
    currentStrikerId: p1,
    currentNonStrikerId: p2,
    currentBowlerId: b1,
    battingScorecard,
    bowlingScorecard,
    fallOfWickets: [],
    recentBalls: [],
    isCompleted: false,
  };
}

// Initial live seed match
const indTeam = DEFAULT_TEAMS[0];
const pakTeam = DEFAULT_TEAMS[1];

const liveInnings1: Innings = {
  id: 'inn-1',
  battingTeamId: pakTeam.id,
  bowlingTeamId: indTeam.id,
  totalRuns: 159,
  totalWickets: 8,
  legalBallsBowled: 120, // 20.0 overs
  totalOversLimit: 20,
  wides: 4,
  noBalls: 1,
  byes: 2,
  legByes: 1,
  currentStrikerId: 'pak-8',
  currentNonStrikerId: 'pak-9',
  currentBowlerId: 'ind-8',
  battingScorecard: {
    'pak-1': { playerId: 'pak-1', playerName: 'Babar Azam', runs: 0, balls: 1, fours: 0, sixes: 0, strikeRate: 0, isOut: true, dismissalInfo: 'lbw b Arshdeep' },
    'pak-2': { playerId: 'pak-2', playerName: 'Mohammad Rizwan', runs: 4, balls: 12, fours: 0, sixes: 0, strikeRate: 33.3, isOut: true, dismissalInfo: 'c Bhuvneshwar b Arshdeep' },
    'pak-3': { playerId: 'pak-3', playerName: 'Shan Masood', runs: 52, balls: 42, fours: 5, sixes: 0, strikeRate: 123.8, isOut: false },
    'pak-4': { playerId: 'pak-4', playerName: 'Iftikhar Ahmed', runs: 51, balls: 34, fours: 2, sixes: 4, strikeRate: 150.0, isOut: true, dismissalInfo: 'lbw b Shami' },
    'pak-5': { playerId: 'pak-5', playerName: 'Shadab Khan', runs: 5, balls: 6, fours: 1, sixes: 0, strikeRate: 83.3, isOut: true, dismissalInfo: 'c Suryakumar b Hardik' },
    'pak-6': { playerId: 'pak-6', playerName: 'Haider Ali', runs: 2, balls: 4, fours: 0, sixes: 0, strikeRate: 50.0, isOut: true, dismissalInfo: 'c Suryakumar b Hardik' },
    'pak-7': { playerId: 'pak-7', playerName: 'Mohammad Nawaz', runs: 9, balls: 6, fours: 2, sixes: 0, strikeRate: 150.0, isOut: true, dismissalInfo: 'c Karthik b Hardik' },
    'pak-8': { playerId: 'pak-8', playerName: 'Shaheen Afridi', runs: 16, balls: 8, fours: 1, sixes: 1, strikeRate: 200.0, isOut: true, dismissalInfo: 'c & b Bhuvneshwar' },
    'pak-9': { playerId: 'pak-9', playerName: 'Haris Rauf', runs: 6, balls: 4, fours: 0, sixes: 1, strikeRate: 150.0, isOut: false },
  },
  bowlingScorecard: {
    'ind-8': { playerId: 'ind-8', playerName: 'Jasprit Bumrah', overs: 4, maidens: 0, runsConceded: 26, wickets: 2, economy: 6.5, dots: 14 },
    'ind-9': { playerId: 'ind-9', playerName: 'Arshdeep Singh', overs: 4, maidens: 0, runsConceded: 32, wickets: 3, economy: 8.0, dots: 12 },
    'ind-5': { playerId: 'ind-5', playerName: 'Hardik Pandya', overs: 4, maidens: 0, runsConceded: 30, wickets: 3, economy: 7.5, dots: 10 },
    'ind-10': { playerId: 'ind-10', playerName: 'Kuldeep Yadav', overs: 4, maidens: 0, runsConceded: 36, wickets: 0, economy: 9.0, dots: 6 },
    'ind-7': { playerId: 'ind-7', playerName: 'Axar Patel', overs: 4, maidens: 0, runsConceded: 35, wickets: 0, economy: 8.75, dots: 7 },
  },
  fallOfWickets: [
    { wicketNumber: 1, score: 1, over: '1.1', playerName: 'Babar Azam' },
    { wicketNumber: 2, score: 15, over: '3.6', playerName: 'Mohammad Rizwan' },
    { wicketNumber: 3, score: 91, over: '12.2', playerName: 'Iftikhar Ahmed' },
    { wicketNumber: 4, score: 96, over: '13.2', playerName: 'Shadab Khan' },
    { wicketNumber: 5, score: 98, over: '14.1', playerName: 'Haider Ali' },
    { wicketNumber: 6, score: 115, over: '15.5', playerName: 'Mohammad Nawaz' },
    { wicketNumber: 7, score: 151, over: '18.6', playerName: 'Shaheen Afridi' },
  ],
  recentBalls: [],
  isCompleted: true,
};

const liveInnings2: Innings = {
  id: 'inn-2',
  battingTeamId: indTeam.id,
  bowlingTeamId: pakTeam.id,
  totalRuns: 144,
  totalWickets: 4,
  legalBallsBowled: 110, // 18.2 overs
  totalOversLimit: 20,
  wides: 3,
  noBalls: 1,
  byes: 1,
  legByes: 2,
  currentStrikerId: 'ind-2', // Virat Kohli
  currentNonStrikerId: 'ind-5', // Hardik Pandya
  currentBowlerId: 'pak-9', // Haris Rauf
  previousBowlerId: 'pak-7',
  battingScorecard: {
    'ind-1': { playerId: 'ind-1', playerName: 'Rohit Sharma', runs: 4, balls: 7, fours: 0, sixes: 0, strikeRate: 57.1, isOut: true, dismissalInfo: 'c Iftikhar b Haris Rauf' },
    'ind-2': { playerId: 'ind-2', playerName: 'Virat Kohli', runs: 71, balls: 48, fours: 5, sixes: 3, strikeRate: 147.9, isOut: false },
    'ind-3': { playerId: 'ind-3', playerName: 'Suryakumar Yadav', runs: 15, balls: 10, fours: 2, sixes: 0, strikeRate: 150.0, isOut: true, dismissalInfo: 'c Rizwan b Haris Rauf' },
    'ind-4': { playerId: 'ind-4', playerName: 'Axar Patel', runs: 2, balls: 3, fours: 0, sixes: 0, strikeRate: 66.7, isOut: true, dismissalInfo: 'run out (Babar/Rizwan)' },
    'ind-5': { playerId: 'ind-5', playerName: 'Hardik Pandya', runs: 40, balls: 37, fours: 1, sixes: 2, strikeRate: 108.1, isOut: false },
  },
  bowlingScorecard: {
    'pak-7': { playerId: 'pak-7', playerName: 'Shaheen Afridi', overs: 4, maidens: 0, runsConceded: 34, wickets: 0, economy: 8.5, dots: 10 },
    'pak-8': { playerId: 'pak-8', playerName: 'Naseem Shah', overs: 4, maidens: 0, runsConceded: 23, wickets: 1, economy: 5.75, dots: 14 },
    'pak-9': { playerId: 'pak-9', playerName: 'Haris Rauf', overs: 3.2, maidens: 0, runsConceded: 36, wickets: 2, economy: 10.8, dots: 9 },
    'pak-5': { playerId: 'pak-5', playerName: 'Shadab Khan', overs: 4, maidens: 0, runsConceded: 28, wickets: 0, economy: 7.0, dots: 8 },
    'pak-6': { playerId: 'pak-6', playerName: 'Mohammad Nawaz', overs: 3, maidens: 0, runsConceded: 23, wickets: 0, economy: 7.66, dots: 6 },
  },
  fallOfWickets: [
    { wicketNumber: 1, score: 7, over: '1.5', playerName: 'KL Rahul' },
    { wicketNumber: 2, score: 10, over: '3.2', playerName: 'Rohit Sharma' },
    { wicketNumber: 3, score: 26, over: '5.3', playerName: 'Suryakumar Yadav' },
    { wicketNumber: 4, score: 31, over: '6.1', playerName: 'Axar Patel' },
  ],
  recentBalls: [
    {
      id: 'b-1',
      overIndex: 17,
      ballInOver: 5,
      runs: 2,
      isExtra: false,
      extraRuns: 0,
      isWicket: false,
      strikerId: 'ind-2',
      nonStrikerId: 'ind-5',
      bowlerId: 'pak-7',
      commentary: 'Shaheen to Kohli, 2 runs, driven gracefully into the deep cover pocket for a brace!',
      timestamp: Date.now() - 60000,
    },
    {
      id: 'b-2',
      overIndex: 17,
      ballInOver: 6,
      runs: 6,
      isExtra: false,
      extraRuns: 0,
      isWicket: false,
      strikerId: 'ind-2',
      nonStrikerId: 'ind-5',
      bowlerId: 'pak-7',
      commentary: 'SIX! Unbelievable shot straight down the ground! Into the stands!',
      shotType: 'Straight Loft',
      timestamp: Date.now() - 45000,
    },
    {
      id: 'b-3',
      overIndex: 18,
      ballInOver: 1,
      runs: 1,
      isExtra: false,
      extraRuns: 0,
      isWicket: false,
      strikerId: 'ind-5',
      nonStrikerId: 'ind-2',
      bowlerId: 'pak-9',
      commentary: 'Haris Rauf to Hardik, 1 run, pushed towards mid-on for a quick single.',
      timestamp: Date.now() - 25000,
    },
    {
      id: 'b-4',
      overIndex: 18,
      ballInOver: 2,
      runs: 6,
      isExtra: false,
      extraRuns: 0,
      isWicket: false,
      strikerId: 'ind-2',
      nonStrikerId: 'ind-5',
      bowlerId: 'pak-9',
      commentary: 'SIX! Back of a length pulled over fine leg! What a spectator catch in the crowd!',
      shotType: 'Pull Shot',
      timestamp: Date.now() - 10000,
    },
  ],
  isCompleted: false,
};

export const INITIAL_MATCHES: Match[] = [
  {
    id: 'match-ind-pak-live',
    seriesName: 'T20 World Cup Championship',
    matchTitle: 'Match 16: India vs Pakistan (Super 12)',
    teamA: indTeam,
    teamB: pakTeam,
    overs: 20,
    venue: 'Melbourne Cricket Ground (MCG)',
    matchDate: 'Today, 07:00 PM',
    pitchType: 'Batting Friendly',
    status: 'live',
    tossWinnerId: indTeam.id,
    tossChoice: 'bowl',
    currentInningsNumber: 2,
    innings: [liveInnings1, liveInnings2],
    target: 160,
    createdAt: Date.now() - 7200000,
  },
  {
    id: 'match-aus-eng-upcoming',
    seriesName: 'Ashes T20 International Series',
    matchTitle: '1st T20I: Australia vs England',
    teamA: DEFAULT_TEAMS[2], // Australia
    teamB: DEFAULT_TEAMS[3], // England
    overs: 20,
    venue: "Lord's Cricket Ground, London",
    matchDate: 'Tomorrow, 06:30 PM',
    pitchType: 'Balanced',
    status: 'upcoming',
    currentInningsNumber: 1,
    innings: [
      createBlankInnings(DEFAULT_TEAMS[2], DEFAULT_TEAMS[3], 20),
    ],
    createdAt: Date.now() - 86400000,
  },
  {
    id: 'match-club-derby-completed',
    seriesName: 'Metropolitan Super League 2026',
    matchTitle: 'Final: Royal Strikers vs Coastal Knights',
    teamA: {
      id: 'team-rs',
      name: 'Royal Strikers',
      shortName: 'RS',
      color: '#7c3aed',
      players: [
        { id: 'rs-1', name: 'Dev Sharma', role: 'batsman', isCaptain: true },
        { id: 'rs-2', name: 'Karan Mehra', role: 'batsman' },
        { id: 'rs-3', name: 'Zain Malik', role: 'all_rounder' },
        { id: 'rs-4', name: 'Aman Deep', role: 'bowler' },
      ],
    },
    teamB: {
      id: 'team-ck',
      name: 'Coastal Knights',
      shortName: 'CK',
      color: '#0d9488',
      players: [
        { id: 'ck-1', name: 'Farhan Ali', role: 'batsman', isCaptain: true },
        { id: 'ck-2', name: 'Sunny Varma', role: 'batsman' },
        { id: 'ck-3', name: 'Rohan Joshi', role: 'all_rounder' },
        { id: 'ck-4', name: 'Tariq Butt', role: 'bowler' },
      ],
    },
    overs: 10,
    venue: 'National Stadium, Pitch #1',
    matchDate: 'Yesterday',
    pitchType: 'Batting Friendly',
    status: 'completed',
    tossWinnerId: 'team-rs',
    tossChoice: 'bat',
    currentInningsNumber: 2,
    target: 104,
    winnerTeamId: 'team-rs',
    resultSummary: 'Royal Strikers won by 14 runs',
    innings: [
      {
        id: 'inn-c1',
        battingTeamId: 'team-rs',
        bowlingTeamId: 'team-ck',
        totalRuns: 103,
        totalWickets: 3,
        legalBallsBowled: 60,
        totalOversLimit: 10,
        wides: 2,
        noBalls: 0,
        byes: 0,
        legByes: 1,
        currentStrikerId: 'rs-1',
        currentNonStrikerId: 'rs-2',
        currentBowlerId: 'ck-4',
        battingScorecard: {
          'rs-1': { playerId: 'rs-1', playerName: 'Dev Sharma', runs: 58, balls: 28, fours: 6, sixes: 3, strikeRate: 207.1, isOut: false },
          'rs-2': { playerId: 'rs-2', playerName: 'Karan Mehra', runs: 32, balls: 22, fours: 4, sixes: 1, strikeRate: 145.5, isOut: true, dismissalInfo: 'b Tariq' },
        },
        bowlingScorecard: {
          'ck-4': { playerId: 'ck-4', playerName: 'Tariq Butt', overs: 2, maidens: 0, runsConceded: 22, wickets: 2, economy: 11.0, dots: 4 },
        },
        fallOfWickets: [
          { wicketNumber: 1, score: 72, over: '6.4', playerName: 'Karan Mehra' },
        ],
        recentBalls: [],
        isCompleted: true,
      },
      {
        id: 'inn-c2',
        battingTeamId: 'team-ck',
        bowlingTeamId: 'team-rs',
        totalRuns: 89,
        totalWickets: 6,
        legalBallsBowled: 60,
        totalOversLimit: 10,
        wides: 3,
        noBalls: 1,
        byes: 0,
        legByes: 0,
        currentStrikerId: 'ck-1',
        currentNonStrikerId: 'ck-2',
        currentBowlerId: 'rs-4',
        battingScorecard: {
          'ck-1': { playerId: 'ck-1', playerName: 'Farhan Ali', runs: 41, balls: 26, fours: 5, sixes: 1, strikeRate: 157.7, isOut: true, dismissalInfo: 'c Dev b Aman' },
        },
        bowlingScorecard: {
          'rs-4': { playerId: 'rs-4', playerName: 'Aman Deep', overs: 2, maidens: 0, runsConceded: 16, wickets: 3, economy: 8.0, dots: 5 },
        },
        fallOfWickets: [
          { wicketNumber: 1, score: 25, over: '2.3', playerName: 'Sunny Varma' },
        ],
        recentBalls: [],
        isCompleted: true,
      },
    ],
    createdAt: Date.now() - 172800000,
  },
];

export const DEFAULT_DASHBOARD_CONFIG: DashboardConfig = {
  theme: 'emerald',
  cardStyle: 'broadcast',
  density: 'comfortable',
  pinnedMatchId: 'match-ind-pak-live',
  favoriteTeamId: 'team-ind',
  soundEnabled: true,
  hapticsEnabled: true,
  showAndroidFrame: false, // Default to clean responsive edge-to-edge view, with 1-click Android frame toggle
  extrasMode: 'wide_noball',
  widgets: {
    heroScorecard: true,
    liveBallTicker: true,
    partnershipBar: true,
    currentOverCard: true,
    commentaryStream: true,
    miniFixturesCarousel: true,
    statsHighlight: true,
    runRateTracker: true,
  },
};
