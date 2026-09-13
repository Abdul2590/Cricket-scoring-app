import { Match, Innings, BallEvent, DismissalType, Player } from '../types';

export function formatOvers(legalBalls: number): string {
  const overs = Math.floor(legalBalls / 6);
  const balls = legalBalls % 6;
  return `${overs}.${balls}`;
}

export function calculateOversDecimal(legalBalls: number): number {
  const overs = Math.floor(legalBalls / 6);
  const balls = legalBalls % 6;
  return Number(`${overs}.${balls}`);
}

export function calculateCRR(runs: number, legalBalls: number): string {
  if (legalBalls === 0) return '0.00';
  const overs = legalBalls / 6;
  return (runs / overs).toFixed(2);
}

export function calculateRRR(target: number, currentRuns: number, ballsRemaining: number): string {
  if (ballsRemaining <= 0) return currentRuns >= target ? '0.00' : 'Required Overs Exhausted';
  const runsNeeded = target - currentRuns;
  if (runsNeeded <= 0) return '0.00';
  const oversRemaining = ballsRemaining / 6;
  return (runsNeeded / oversRemaining).toFixed(2);
}

export function getBattingTeam(match: Match, inningsNumber?: 1 | 2): { team: Match['teamA'], isTeamA: boolean } {
  const innNum = inningsNumber || match.currentInningsNumber;
  // If toss was won and chosen
  const tossWinnerIsA = match.tossWinnerId === match.teamA.id;
  let firstBattingIsA: boolean;

  if (match.tossChoice) {
    if (match.tossChoice === 'bat') {
      firstBattingIsA = tossWinnerIsA;
    } else {
      firstBattingIsA = !tossWinnerIsA;
    }
  } else {
    firstBattingIsA = true;
  }

  const isCurrentBattingA = innNum === 1 ? firstBattingIsA : !firstBattingIsA;
  return {
    team: isCurrentBattingA ? match.teamA : match.teamB,
    isTeamA: isCurrentBattingA,
  };
}

export function getBowlingTeam(match: Match, inningsNumber?: 1 | 2): { team: Match['teamB'], isTeamA: boolean } {
  const { isTeamA } = getBattingTeam(match, inningsNumber);
  return {
    team: isTeamA ? match.teamB : match.teamA,
    isTeamA: !isTeamA,
  };
}

export function getPlayerById(match: Match, playerId: string): Player | undefined {
  const allPlayers = [...match.teamA.players, ...match.teamB.players];
  return allPlayers.find((p) => p.id === playerId);
}

export function updatePlayerName(
  match: Match,
  playerId: string,
  newName: string,
  newRole?: Player['role'],
  isCaptain?: boolean,
  isWicketKeeper?: boolean
): Match {
  const updated: Match = JSON.parse(JSON.stringify(match));
  const cleanName = newName.trim();
  if (!cleanName) return match;

  let oldName = '';
  // Update in teamA
  const pA = updated.teamA.players.find((p) => p.id === playerId);
  if (pA) {
    oldName = pA.name;
    pA.name = cleanName;
    if (newRole) pA.role = newRole;
    if (isCaptain !== undefined) pA.isCaptain = isCaptain;
    if (isWicketKeeper !== undefined) pA.isWicketKeeper = isWicketKeeper;
  }
  // Update in teamB
  const pB = updated.teamB.players.find((p) => p.id === playerId);
  if (pB) {
    oldName = pB.name;
    pB.name = cleanName;
    if (newRole) pB.role = newRole;
    if (isCaptain !== undefined) pB.isCaptain = isCaptain;
    if (isWicketKeeper !== undefined) pB.isWicketKeeper = isWicketKeeper;
  }

  // Update in all innings scorecards and fall of wickets
  updated.innings.forEach((inn) => {
    if (!inn) return;
    if (inn.battingScorecard && inn.battingScorecard[playerId]) {
      inn.battingScorecard[playerId].playerName = cleanName;
    }
    if (inn.bowlingScorecard && inn.bowlingScorecard[playerId]) {
      inn.bowlingScorecard[playerId].playerName = cleanName;
    }
    if (inn.fallOfWickets && oldName) {
      inn.fallOfWickets.forEach((fow) => {
        if (fow.playerName === oldName) {
          fow.playerName = cleanName;
        }
      });
    }
  });

  return updated;
}

export function addPlayerToTeam(
  match: Match,
  teamId: string,
  playerName: string,
  role: Player['role'] = 'batsman'
): Match {
  const updated: Match = JSON.parse(JSON.stringify(match));
  const cleanName = playerName.trim();
  if (!cleanName) return match;

  const targetTeam = updated.teamA.id === teamId ? updated.teamA : updated.teamB;
  const newPlayerId = `p-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const newPlayer: Player = {
    id: newPlayerId,
    name: cleanName,
    role,
  };
  targetTeam.players.push(newPlayer);
  return updated;
}

export function removePlayerFromTeam(
  match: Match,
  teamId: string,
  playerId: string
): Match {
  const updated: Match = JSON.parse(JSON.stringify(match));
  const currentInnings = updated.innings[updated.currentInningsNumber - 1];
  
  // Guard: cannot delete if player is currently active striker, non-striker, or bowler
  if (
    currentInnings && 
    (currentInnings.currentStrikerId === playerId ||
     currentInnings.currentNonStrikerId === playerId ||
     currentInnings.currentBowlerId === playerId)
  ) {
    return match;
  }

  const targetTeam = updated.teamA.id === teamId ? updated.teamA : updated.teamB;
  targetTeam.players = targetTeam.players.filter((p) => p.id !== playerId);
  return updated;
}

export function changeActiveBatsmen(
  match: Match,
  {
    strikerId,
    nonStrikerId,
  }: {
    strikerId?: string;
    nonStrikerId?: string;
  }
): Match {
  const updated: Match = JSON.parse(JSON.stringify(match));
  const inn = updated.innings[updated.currentInningsNumber - 1];
  if (!inn) return match;

  const currentStriker = inn.currentStrikerId;
  const currentNonStriker = inn.currentNonStrikerId;

  let nextStriker = strikerId || currentStriker;
  let nextNonStriker = nonStrikerId || currentNonStriker;

  // If new striker is current non-striker and nonStrikerId was not provided, swap them
  if (strikerId && strikerId === currentNonStriker && !nonStrikerId) {
    nextNonStriker = currentStriker;
  } else if (nonStrikerId && nonStrikerId === currentStriker && !strikerId) {
    nextStriker = currentNonStriker;
  }

  // Prevent both being identical
  if (nextStriker === nextNonStriker) {
    return match;
  }

  inn.currentStrikerId = nextStriker;
  inn.currentNonStrikerId = nextNonStriker;

  // Initialize batting scorecard for striker if not present
  if (!inn.battingScorecard[nextStriker]) {
    const p = getPlayerById(updated, nextStriker);
    inn.battingScorecard[nextStriker] = {
      playerId: nextStriker,
      playerName: p?.name || 'Batsman',
      runs: 0,
      balls: 0,
      fours: 0,
      sixes: 0,
      strikeRate: 0,
      isOut: false,
    };
  }

  // Initialize batting scorecard for non-striker if not present
  if (!inn.battingScorecard[nextNonStriker]) {
    const p = getPlayerById(updated, nextNonStriker);
    inn.battingScorecard[nextNonStriker] = {
      playerId: nextNonStriker,
      playerName: p?.name || 'Batsman',
      runs: 0,
      balls: 0,
      fours: 0,
      sixes: 0,
      strikeRate: 0,
      isOut: false,
    };
  }

  return updated;
}

export interface RecordBallParams {
  runs: number;
  extraType?: 'wide' | 'no_ball' | 'bye' | 'leg_bye' | 'penalty';
  extraRuns?: number;
  isWicket: boolean;
  wicketType?: DismissalType;
  outPlayerId?: string;
  fielderName?: string;
  newBatsmanId?: string;
  customCommentary?: string;
  shotType?: string;
}

export function recordBall(
  currentMatch: Match,
  params: RecordBallParams
): { updatedMatch: Match; isOverFinished: boolean; message: string } {
  // Deep clone current match
  const match: Match = JSON.parse(JSON.stringify(currentMatch));
  const currentInnings = match.innings[match.currentInningsNumber - 1];

  if (!currentInnings || currentInnings.isCompleted || match.status === 'completed') {
    return { updatedMatch: match, isOverFinished: false, message: 'Innings is already completed.' };
  }

  const battingTeam = getBattingTeam(match).team;
  const bowlingTeam = getBowlingTeam(match).team;

  const strikerId = currentInnings.currentStrikerId;
  const nonStrikerId = currentInnings.currentNonStrikerId;
  const bowlerId = currentInnings.currentBowlerId;

  const strikerPlayer = getPlayerById(match, strikerId);
  const nonStrikerPlayer = getPlayerById(match, nonStrikerId);
  const bowlerPlayer = getPlayerById(match, bowlerId);

  const isWide = params.extraType === 'wide';
  const isNoBall = params.extraType === 'no_ball';
  const isBye = params.extraType === 'bye';
  const isLegBye = params.extraType === 'leg_bye';
  const isLegalBall = !isWide && !isNoBall;

  let runsOffBat = 0;
  let totalExtraRunsForBall = 0;

  if (isWide) {
    totalExtraRunsForBall = 1 + (params.extraRuns || 0) + (params.runs || 0);
  } else if (isNoBall) {
    totalExtraRunsForBall = 1 + (params.extraRuns || 0);
    runsOffBat = params.runs || 0;
  } else if (isBye || isLegBye) {
    totalExtraRunsForBall = params.runs || 1;
    runsOffBat = 0;
  } else {
    runsOffBat = params.runs || 0;
  }

  const ballTotalScore = runsOffBat + totalExtraRunsForBall;
  currentInnings.totalRuns += ballTotalScore;

  // Track extras breakdown
  if (isWide) currentInnings.wides += totalExtraRunsForBall;
  if (isNoBall) currentInnings.noBalls += totalExtraRunsForBall;
  if (isBye) currentInnings.byes += totalExtraRunsForBall;
  if (isLegBye) currentInnings.legByes += totalExtraRunsForBall;

  // Legal balls bowled
  const ballInOverBefore = (currentInnings.legalBallsBowled % 6) + 1;
  const overIndexBefore = Math.floor(currentInnings.legalBallsBowled / 6);

  if (isLegalBall) {
    currentInnings.legalBallsBowled += 1;
  }

  // Ensure scorecards exist
  if (!currentInnings.battingScorecard[strikerId]) {
    currentInnings.battingScorecard[strikerId] = {
      playerId: strikerId,
      playerName: strikerPlayer?.name || 'Batsman',
      runs: 0,
      balls: 0,
      fours: 0,
      sixes: 0,
      strikeRate: 0,
      isOut: false,
    };
  }

  if (!currentInnings.bowlingScorecard[bowlerId]) {
    currentInnings.bowlingScorecard[bowlerId] = {
      playerId: bowlerId,
      playerName: bowlerPlayer?.name || 'Bowler',
      overs: 0,
      maidens: 0,
      runsConceded: 0,
      wickets: 0,
      economy: 0,
      dots: 0,
    };
  }

  const bStats = currentInnings.battingScorecard[strikerId];
  const bowStats = currentInnings.bowlingScorecard[bowlerId];

  // Batsman updates
  if (!isWide) {
    bStats.balls += 1;
    bStats.runs += runsOffBat;
    if (runsOffBat === 4) bStats.fours += 1;
    if (runsOffBat === 6) bStats.sixes += 1;
    bStats.strikeRate = Number(((bStats.runs / bStats.balls) * 100).toFixed(1));
  }

  // Bowler updates
  // In official cricket, Byes and Leg Byes are NOT charged against the bowler
  let runsChargedToBowler = 0;
  if (isBye || isLegBye) {
    runsChargedToBowler = 0;
  } else {
    runsChargedToBowler = runsOffBat + totalExtraRunsForBall;
  }
  bowStats.runsConceded += runsChargedToBowler;

  if (runsChargedToBowler === 0 && isLegalBall && !params.isWicket) {
    bowStats.dots += 1;
  }

  // Calculate bowler overs
  const bowlerLegalBalls = (Math.floor(bowStats.overs) * 6) + Math.round((bowStats.overs % 1) * 10) + (isLegalBall ? 1 : 0);
  bowStats.overs = calculateOversDecimal(bowlerLegalBalls);
  if (bowlerLegalBalls > 0) {
    bowStats.economy = Number(((bowStats.runsConceded / (bowlerLegalBalls / 6))).toFixed(2));
  }

  // Commentary generation
  let commentary = params.customCommentary || '';
  if (!commentary) {
    const sName = strikerPlayer?.name || 'Striker';
    const bName = bowlerPlayer?.name || 'Bowler';
    if (params.isWicket) {
      commentary = `WICKET! ${bName} strikes! ${params.wicketType?.toUpperCase()}! ${params.fielderName ? `Caught by ${params.fielderName}.` : ''} Big breakthrough for ${bowlingTeam.shortName}!`;
    } else if (runsOffBat === 6) {
      commentary = `SIX! Glorious hit by ${sName}! Sent flying over the boundary rope!`;
    } else if (runsOffBat === 4) {
      commentary = `FOUR! Beautifully timed drive through the gap by ${sName} for four!`;
    } else if (isWide) {
      const extraRunCount = (params.extraRuns || 0) + (params.runs || 0);
      commentary = extraRunCount > 0 
        ? `WIDE ball + ${extraRunCount} runs! Total ${totalExtraRunsForBall} extras conceded by ${bName}.`
        : `WIDE ball called by the umpire. Straying down the leg side from ${bName}.`;
    } else if (isNoBall) {
      commentary = runsOffBat > 0 
        ? `NO BALL + ${runsOffBat} runs! Struck by ${sName}. Free Hit coming up!`
        : `NO BALL! Overstepping by ${bName}. Free Hit coming up next!`;
    } else if (runsOffBat === 1) {
      commentary = `${bName} to ${sName}, 1 run, tucked into the gap for a single.`;
    } else if (runsOffBat === 2) {
      commentary = `${bName} to ${sName}, 2 runs, nicely played with great running between wickets.`;
    } else if (runsOffBat === 3) {
      commentary = `${bName} to ${sName}, 3 runs, great fielding on the boundary stops the four.`;
    } else {
      commentary = `${bName} to ${sName}, no run, solidly defended.`;
    }
  }

  // Wicket handling
  if (params.isWicket) {
    currentInnings.totalWickets += 1;
    // Bowler gets credit unless it's a run out
    if (params.wicketType !== 'run_out') {
      bowStats.wickets += 1;
    }

    const outId = params.outPlayerId || strikerId;
    const outPlayer = getPlayerById(match, outId);
    if (currentInnings.battingScorecard[outId]) {
      currentInnings.battingScorecard[outId].isOut = true;
      let dismissalText = '';
      if (params.wicketType === 'bowled') dismissalText = `b ${bowlerPlayer?.name}`;
      else if (params.wicketType === 'caught') dismissalText = `c ${params.fielderName || 'fielder'} b ${bowlerPlayer?.name}`;
      else if (params.wicketType === 'lbw') dismissalText = `lbw b ${bowlerPlayer?.name}`;
      else if (params.wicketType === 'run_out') dismissalText = `run out (${params.fielderName || 'throw'})`;
      else if (params.wicketType === 'stumped') dismissalText = `st b ${bowlerPlayer?.name}`;
      else if (params.wicketType === 'hit_wicket') dismissalText = `hit wicket b ${bowlerPlayer?.name}`;
      currentInnings.battingScorecard[outId].dismissalInfo = dismissalText;
    }

    currentInnings.fallOfWickets.push({
      wicketNumber: currentInnings.totalWickets,
      score: currentInnings.totalRuns,
      over: formatOvers(currentInnings.legalBallsBowled),
      playerName: outPlayer?.name || 'Batsman',
    });

    // Bring in new batsman if available
    if (params.newBatsmanId) {
      const nextPlayer = getPlayerById(match, params.newBatsmanId);
      currentInnings.battingScorecard[params.newBatsmanId] = {
        playerId: params.newBatsmanId,
        playerName: nextPlayer?.name || 'Next Batsman',
        runs: 0,
        balls: 0,
        fours: 0,
        sixes: 0,
        strikeRate: 0,
        isOut: false,
      };
      if (outId === strikerId) {
        currentInnings.currentStrikerId = params.newBatsmanId;
      } else {
        currentInnings.currentNonStrikerId = params.newBatsmanId;
      }
    }
  }

  // Create ball event record
  const ballEvent: BallEvent = {
    id: `ball-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    overIndex: overIndexBefore,
    ballInOver: isLegalBall ? ballInOverBefore : ballInOverBefore,
    runs: runsOffBat,
    isExtra: !isLegalBall || isBye || isLegBye,
    extraType: params.extraType,
    extraRuns: totalExtraRunsForBall,
    isWicket: params.isWicket,
    wicketType: params.wicketType,
    outPlayerId: params.outPlayerId,
    fielderName: params.fielderName,
    strikerId,
    nonStrikerId,
    bowlerId,
    commentary,
    shotType: params.shotType,
    timestamp: Date.now(),
  };

  currentInnings.recentBalls.unshift(ballEvent);
  // Keep recent balls buffer manageable
  if (currentInnings.recentBalls.length > 50) {
    currentInnings.recentBalls = currentInnings.recentBalls.slice(0, 50);
  }

  // Strike rotation for odd runs (1, 3, 5)
  const runsForRotation = runsOffBat + (isBye || isLegBye ? totalExtraRunsForBall : 0) + (isWide ? (params.extraRuns || 0) : 0);
  if (runsForRotation % 2 === 1 && !params.isWicket) {
    const temp = currentInnings.currentStrikerId;
    currentInnings.currentStrikerId = currentInnings.currentNonStrikerId;
    currentInnings.currentNonStrikerId = temp;
  }

  // Check Over Completion
  const isOverFinished = isLegalBall && (currentInnings.legalBallsBowled % 6 === 0);
  if (isOverFinished) {
    // Rotate strike at end of over
    const temp = currentInnings.currentStrikerId;
    currentInnings.currentStrikerId = currentInnings.currentNonStrikerId;
    currentInnings.currentNonStrikerId = temp;

    // Track previous bowler
    currentInnings.previousBowlerId = bowlerId;
  }

  // Check match or innings completion conditions
  const maxLegalBalls = currentInnings.totalOversLimit * 6;
  const isAllOut = currentInnings.totalWickets >= (battingTeam.players.length - 1) || currentInnings.totalWickets >= 10;
  const isOversFinished = currentInnings.legalBallsBowled >= maxLegalBalls;

  if (match.currentInningsNumber === 1) {
    if (isAllOut || isOversFinished) {
      currentInnings.isCompleted = true;
      match.target = currentInnings.totalRuns + 1;
      match.status = 'innings_break';
      match.resultSummary = `Innings 1 finished. ${bowlingTeam.name} needs ${match.target} runs to win.`;
    }
  } else if (match.currentInningsNumber === 2) {
    const target = match.target || (match.innings[0]?.totalRuns ? match.innings[0].totalRuns + 1 : 0);
    if (currentInnings.totalRuns >= target) {
      // 2nd batting team wins!
      currentInnings.isCompleted = true;
      match.status = 'completed';
      match.winnerTeamId = battingTeam.id;
      const wicketsLeft = (battingTeam.players.length - 1) - currentInnings.totalWickets;
      match.resultSummary = `${battingTeam.name} won by ${Math.max(1, wicketsLeft)} wickets!`;
    } else if (isAllOut || isOversFinished) {
      currentInnings.isCompleted = true;
      match.status = 'completed';
      if (currentInnings.totalRuns === target - 1) {
        match.resultSummary = 'Match Tied! Thrilling finish!';
      } else {
        const runsWonBy = target - 1 - currentInnings.totalRuns;
        match.winnerTeamId = bowlingTeam.id;
        match.resultSummary = `${bowlingTeam.name} won by ${runsWonBy} runs!`;
      }
    }
  }

  return {
    updatedMatch: match,
    isOverFinished,
    message: isOverFinished ? `Over finished! (${formatOvers(currentInnings.legalBallsBowled)} ov)` : 'Ball recorded successfully.',
  };
}

export function startSecondInnings(currentMatch: Match): Match {
  const match: Match = JSON.parse(JSON.stringify(currentMatch));
  if (match.currentInningsNumber !== 1 || !match.innings[0]) return match;

  match.innings[0].isCompleted = true;
  match.target = match.innings[0].totalRuns + 1;
  match.currentInningsNumber = 2;
  match.status = 'live';

  const battingTeam = getBattingTeam(match, 2).team;
  const bowlingTeam = getBowlingTeam(match, 2).team;

  // Create innings 2
  const striker = battingTeam.players[0]?.id || 'p-1';
  const nonStriker = battingTeam.players[1]?.id || 'p-2';
  const bowler = bowlingTeam.players[7]?.id || bowlingTeam.players[0]?.id || 'b-1';

  const inn2: Innings = {
    id: `inn-2-${Date.now()}`,
    battingTeamId: battingTeam.id,
    bowlingTeamId: bowlingTeam.id,
    totalRuns: 0,
    totalWickets: 0,
    legalBallsBowled: 0,
    totalOversLimit: match.overs,
    wides: 0,
    noBalls: 0,
    byes: 0,
    legByes: 0,
    currentStrikerId: striker,
    currentNonStrikerId: nonStriker,
    currentBowlerId: bowler,
    battingScorecard: {},
    bowlingScorecard: {},
    fallOfWickets: [],
    recentBalls: [],
    isCompleted: false,
  };

  battingTeam.players.forEach((p) => {
    inn2.battingScorecard[p.id] = {
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

  bowlingTeam.players.forEach((p) => {
    inn2.bowlingScorecard[p.id] = {
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

  match.innings[1] = inn2;
  return match;
}

/**
 * Reverts the most recent ball event from match history.
 * Correctly restores batsman stats, bowler figures, team totals, wickets, and crease positions.
 */
export function revertLastBall(match: Match): { updatedMatch: Match; revertedBall?: BallEvent; message: string } {
  const updated: Match = JSON.parse(JSON.stringify(match));
  const currentInnings = updated.innings[updated.currentInningsNumber - 1];

  if (!currentInnings || currentInnings.recentBalls.length === 0) {
    return {
      updatedMatch: match,
      message: 'No ball events recorded yet to revert in this innings.',
    };
  }

  // Pop the most recent ball
  const lastBall = currentInnings.recentBalls.shift();
  if (!lastBall) {
    return { updatedMatch: match, message: 'No ball event to revert.' };
  }

  // If match was completed or in innings break, reopen it
  if (updated.status === 'completed' || updated.status === 'innings_break') {
    updated.status = 'live';
    updated.winnerTeamId = undefined;
    updated.resultSummary = undefined;
    currentInnings.isCompleted = false;
  }

  const runsOffBat = lastBall.runs || 0;
  const isExtra = lastBall.isExtra;
  const extraType = lastBall.extraType;
  const extraRuns = lastBall.extraRuns || 0;
  const isLegalBall = !isExtra || extraType === 'bye' || extraType === 'leg_bye';
  
  // Total runs contributed by this ball
  let totalRunsForBall = runsOffBat;
  if (isExtra) {
    if (extraType === 'wide' || extraType === 'no_ball') {
      totalRunsForBall = runsOffBat + extraRuns;
    }
  }

  // 1. Revert Innings Team Totals
  currentInnings.totalRuns = Math.max(0, currentInnings.totalRuns - totalRunsForBall);
  if (isLegalBall) {
    currentInnings.legalBallsBowled = Math.max(0, currentInnings.legalBallsBowled - 1);
  }

  // Extras count reversal
  if (extraType === 'wide') {
    currentInnings.wides = Math.max(0, currentInnings.wides - extraRuns);
  } else if (extraType === 'no_ball') {
    currentInnings.noBalls = Math.max(0, currentInnings.noBalls - 1);
  } else if (extraType === 'bye') {
    currentInnings.byes = Math.max(0, currentInnings.byes - runsOffBat);
  } else if (extraType === 'leg_bye') {
    currentInnings.legByes = Math.max(0, currentInnings.legByes - runsOffBat);
  }

  // 2. Revert Batsman Stats
  const strikerId = lastBall.strikerId;
  const bStats = currentInnings.battingScorecard[strikerId];
  if (bStats) {
    if (extraType !== 'wide') {
      bStats.balls = Math.max(0, bStats.balls - 1);
      bStats.runs = Math.max(0, bStats.runs - runsOffBat);
      if (runsOffBat === 4) bStats.fours = Math.max(0, bStats.fours - 1);
      if (runsOffBat === 6) bStats.sixes = Math.max(0, bStats.sixes - 1);
      bStats.strikeRate = bStats.balls > 0 ? Number(((bStats.runs / bStats.balls) * 100).toFixed(1)) : 0;
    }
  }

  // 3. Revert Bowler Stats
  const bowlerId = lastBall.bowlerId;
  const bowStats = currentInnings.bowlingScorecard[bowlerId];
  if (bowStats) {
    const isBye = extraType === 'bye';
    const isLegBye = extraType === 'leg_bye';
    let runsChargedToBowler = 0;
    if (!isBye && !isLegBye) {
      runsChargedToBowler = runsOffBat + (extraType === 'wide' || extraType === 'no_ball' ? extraRuns : 0);
    }
    bowStats.runsConceded = Math.max(0, bowStats.runsConceded - runsChargedToBowler);

    const currentBowlerLegalBalls = (Math.floor(bowStats.overs) * 6) + Math.round((bowStats.overs % 1) * 10);
    const newBowlerLegalBalls = Math.max(0, currentBowlerLegalBalls - (isLegalBall ? 1 : 0));
    bowStats.overs = calculateOversDecimal(newBowlerLegalBalls);
    bowStats.economy = newBowlerLegalBalls > 0 ? Number(((bowStats.runsConceded / (newBowlerLegalBalls / 6))).toFixed(2)) : 0;

    if (runsChargedToBowler === 0 && isLegalBall && !lastBall.isWicket) {
      bowStats.dots = Math.max(0, bowStats.dots - 1);
    }
  }

  // 4. Revert Wicket
  if (lastBall.isWicket) {
    currentInnings.totalWickets = Math.max(0, currentInnings.totalWickets - 1);
    if (bowStats && lastBall.wicketType !== 'run_out') {
      bowStats.wickets = Math.max(0, bowStats.wickets - 1);
    }

    if (currentInnings.fallOfWickets.length > 0) {
      currentInnings.fallOfWickets.pop();
    }

    const outId = lastBall.outPlayerId || strikerId;
    if (currentInnings.battingScorecard[outId]) {
      currentInnings.battingScorecard[outId].isOut = false;
      currentInnings.battingScorecard[outId].dismissalInfo = undefined;
    }
  }

  // 5. Restore Crease Positions
  currentInnings.currentStrikerId = lastBall.strikerId;
  currentInnings.currentNonStrikerId = lastBall.nonStrikerId;
  currentInnings.currentBowlerId = lastBall.bowlerId;

  let msg = '';
  if (lastBall.isWicket) {
    msg = `Wicket (${lastBall.wicketType}) reverted`;
  } else if (lastBall.isExtra) {
    msg = `${lastBall.extraType?.toUpperCase()} extra reverted`;
  } else {
    msg = `${lastBall.runs} run(s) ball reverted`;
  }

  return {
    updatedMatch: updated,
    revertedBall: lastBall,
    message: msg,
  };
}

