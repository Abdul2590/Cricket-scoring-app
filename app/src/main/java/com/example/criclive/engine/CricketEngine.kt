package com.example.criclive.engine

import com.example.criclive.model.*

object CricketEngine {

    fun calculateCRR(runs: Int, legalBalls: Int): String {
        if (legalBalls <= 0) return "0.00"
        val overs = legalBalls.toDouble() / 6.0
        return String.format("%.2f", runs / overs)
    }

    fun calculateRRR(target: Int, currentRuns: Int, ballsRemaining: Int): String {
        if (ballsRemaining <= 0) return if (currentRuns >= target) "0.00" else "Overs Exhausted"
        val runsNeeded = target - currentRuns
        if (runsNeeded <= 0) return "0.00"
        val oversRemaining = ballsRemaining.toDouble() / 6.0
        return String.format("%.2f", runsNeeded / oversRemaining)
    }

    fun recordBall(
        match: Match,
        runs: Int,
        isExtra: Boolean = false,
        extraType: ExtraType? = null,
        extraRuns: Int = 0,
        isWicket: Boolean = false,
        wicketType: DismissalType? = null,
        fielderName: String? = null,
        newBatsmanId: String? = null
    ): Match {
        val currentInn = match.currentInnings ?: return match
        val isLegal = !(isExtra && (extraType == ExtraType.WIDE || extraType == ExtraType.NO_BALL))

        val strikerId = currentInn.currentStrikerId
        val nonStrikerId = currentInn.currentNonStrikerId
        val bowlerId = currentInn.currentBowlerId

        // Total runs added to score
        val totalBallRuns = runs + extraRuns + (if (isExtra && (extraType == ExtraType.WIDE || extraType == ExtraType.NO_BALL)) 1 else 0)

        // Update Innings score
        val newTotalRuns = currentInn.totalRuns + totalBallRuns
        val newLegalBalls = currentInn.legalBallsBowled + (if (isLegal) 1 else 0)
        val newWickets = currentInn.totalWickets + (if (isWicket) 1 else 0)

        // Extras count
        var wides = currentInn.wides
        var noBalls = currentInn.noBalls
        var byes = currentInn.byes
        var legByes = currentInn.legByes
        if (isExtra) {
            when (extraType) {
                ExtraType.WIDE -> wides += (1 + extraRuns)
                ExtraType.NO_BALL -> noBalls += (1 + extraRuns)
                ExtraType.BYE -> byes += extraRuns
                ExtraType.LEG_BYE -> legByes += extraRuns
                else -> {}
            }
        }

        // Update Batsman Stats (only non-wides count as balls faced for batsman; runs off bat go to batsman unless bye/leg-bye)
        val updatedBattingScorecard = currentInn.battingScorecard.toMutableMap()
        val strikerStats = updatedBattingScorecard[strikerId] ?: BatsmanStats(strikerId, "Batsman")

        val runsForBatsman = if (extraType == ExtraType.BYE || extraType == ExtraType.LEG_BYE || extraType == ExtraType.WIDE) 0 else runs
        val ballsFacedInc = if (extraType == ExtraType.WIDE) 0 else 1

        val newStrikerStats = strikerStats.copy(
            runs = strikerStats.runs + runsForBatsman,
            balls = strikerStats.balls + ballsFacedInc,
            fours = strikerStats.fours + (if (runsForBatsman == 4) 1 else 0),
            sixes = strikerStats.sixes + (if (runsForBatsman == 6) 1 else 0),
            isOut = if (isWicket) true else strikerStats.isOut,
            dismissalInfo = if (isWicket) "${wicketType?.label ?: "Out"} ${fielderName?.let { "c $it" } ?: ""}".trim() else strikerStats.dismissalInfo
        )
        updatedBattingScorecard[strikerId] = newStrikerStats

        // If new batsman coming in after wicket
        var nextStrikerId = strikerId
        if (isWicket) {
            val nextBatId = newBatsmanId ?: findNextAvailableBatsman(match.battingTeam, updatedBattingScorecard)
            if (nextBatId != null) {
                nextStrikerId = nextBatId
                if (!updatedBattingScorecard.containsKey(nextBatId)) {
                    val p = match.battingTeam.players.find { it.id == nextBatId }
                    if (p != null) {
                        updatedBattingScorecard[nextBatId] = BatsmanStats(p.id, p.name)
                    }
                }
            }
        }

        // Update Bowler Stats
        val updatedBowlingScorecard = currentInn.bowlingScorecard.toMutableMap()
        val bowlerStats = updatedBowlingScorecard[bowlerId] ?: BowlerStats(bowlerId, "Bowler")
        val runsConcededForBowler = if (extraType == ExtraType.BYE || extraType == ExtraType.LEG_BYE) 0 else totalBallRuns
        val bowlerWicketInc = if (isWicket && wicketType != DismissalType.RUN_OUT) 1 else 0

        val newBowlerStats = bowlerStats.copy(
            legalBallsBowled = bowlerStats.legalBallsBowled + (if (isLegal) 1 else 0),
            runsConceded = bowlerStats.runsConceded + runsConcededForBowler,
            wickets = bowlerStats.wickets + bowlerWicketInc,
            dots = bowlerStats.dots + (if (totalBallRuns == 0) 1 else 0)
        )
        updatedBowlingScorecard[bowlerId] = newBowlerStats

        // Striker rotation: odd runs rotate strike (unless end of over, handled below)
        var finalStrikerId = nextStrikerId
        var finalNonStrikerId = nonStrikerId
        val rotateStrike = (runs % 2 == 1)
        if (rotateStrike && !isWicket) {
            val temp = finalStrikerId
            finalStrikerId = finalNonStrikerId
            finalNonStrikerId = temp
        }

        // Check if over completed (legal balls % 6 == 0)
        val isOverFinished = isLegal && (newLegalBalls % 6 == 0)
        if (isOverFinished) {
            // rotate strike at end of over
            val temp = finalStrikerId
            finalStrikerId = finalNonStrikerId
            finalNonStrikerId = temp
        }

        // Fall of wickets record
        val newFow = currentInn.fallOfWickets.toMutableList()
        if (isWicket) {
            newFow.add(
                FallOfWicket(
                    wicketNumber = newWickets,
                    score = newTotalRuns,
                    over = "${newLegalBalls / 6}.${newLegalBalls % 6}",
                    playerName = strikerStats.playerName
                )
            )
        }

        val ballEvent = BallEvent(
            id = "ball-${System.currentTimeMillis()}",
            overIndex = currentInn.legalBallsBowled / 6,
            ballInOver = (currentInn.legalBallsBowled % 6) + 1,
            runs = runs,
            isExtra = isExtra,
            extraType = extraType,
            extraRuns = extraRuns,
            isWicket = isWicket,
            wicketType = wicketType,
            strikerId = strikerId,
            nonStrikerId = nonStrikerId,
            bowlerId = bowlerId,
            commentary = generateCommentary(runs, isExtra, extraType, isWicket, wicketType, strikerStats.playerName)
        )

        val updatedRecentBalls = (listOf(ballEvent) + currentInn.recentBalls).take(12)

        // Check Innings Completion
        val allOut = newWickets >= (match.battingTeam.players.size - 1).coerceAtLeast(10)
        val oversLimitReached = newLegalBalls >= currentInn.totalOversLimit * 6
        val targetChased = match.target != null && newTotalRuns >= match.target

        val isInningsOver = allOut || oversLimitReached || targetChased

        val updatedInnings = currentInn.copy(
            totalRuns = newTotalRuns,
            totalWickets = newWickets,
            legalBallsBowled = newLegalBalls,
            wides = wides,
            noBalls = noBalls,
            byes = byes,
            legByes = legByes,
            currentStrikerId = finalStrikerId,
            currentNonStrikerId = finalNonStrikerId,
            battingScorecard = updatedBattingScorecard,
            bowlingScorecard = updatedBowlingScorecard,
            fallOfWickets = newFow,
            recentBalls = updatedRecentBalls,
            isCompleted = isInningsOver
        )

        val newInningsList = match.inningsList.toMutableList()
        newInningsList[match.currentInningsNumber - 1] = updatedInnings

        var matchStatus = match.status
        var winnerTeamId = match.winnerTeamId
        var resultSummary = match.resultSummary

        if (isInningsOver) {
            if (match.currentInningsNumber == 1) {
                // Prepare second innings
                matchStatus = MatchStatus.INNINGS_BREAK
            } else {
                // Match finished
                matchStatus = MatchStatus.COMPLETED
                val team1Runs = newInningsList[0].totalRuns
                val team2Runs = updatedInnings.totalRuns
                if (team2Runs > team1Runs) {
                    winnerTeamId = match.bowlingTeam.id // Second batting team
                    resultSummary = "${match.bowlingTeam.name} won by ${match.battingTeam.players.size - 1 - newWickets} wickets"
                } else if (team1Runs > team2Runs) {
                    winnerTeamId = match.battingTeam.id // First batting team
                    resultSummary = "${match.battingTeam.name} won by ${team1Runs - team2Runs} runs"
                } else {
                    resultSummary = "Match Tied"
                }
            }
        }

        return match.copy(
            status = matchStatus,
            inningsList = newInningsList,
            target = if (match.currentInningsNumber == 1 && isInningsOver) newTotalRuns + 1 else match.target,
            winnerTeamId = winnerTeamId,
            resultSummary = resultSummary
        )
    }

    fun swapStrikers(match: Match): Match {
        val currentInn = match.currentInnings ?: return match
        val newStriker = currentInn.currentNonStrikerId
        val newNonStriker = currentInn.currentStrikerId
        val updatedInn = currentInn.copy(
            currentStrikerId = newStriker,
            currentNonStrikerId = newNonStriker
        )
        val newInningsList = match.inningsList.toMutableList()
        newInningsList[match.currentInningsNumber - 1] = updatedInn
        return match.copy(inningsList = newInningsList)
    }

    fun changeBowler(match: Match, newBowlerId: String): Match {
        val currentInn = match.currentInnings ?: return match
        val updatedBowlerMap = currentInn.bowlingScorecard.toMutableMap()
        if (!updatedBowlerMap.containsKey(newBowlerId)) {
            val bowlerPlayer = match.bowlingTeam.players.find { it.id == newBowlerId }
            if (bowlerPlayer != null) {
                updatedBowlerMap[newBowlerId] = BowlerStats(bowlerPlayer.id, bowlerPlayer.name)
            }
        }
        val updatedInn = currentInn.copy(
            previousBowlerId = currentInn.currentBowlerId,
            currentBowlerId = newBowlerId,
            bowlingScorecard = updatedBowlerMap
        )
        val newInningsList = match.inningsList.toMutableList()
        newInningsList[match.currentInningsNumber - 1] = updatedInn
        return match.copy(inningsList = newInningsList)
    }

    fun undoLastBall(match: Match): Match {
        val currentInn = match.currentInnings ?: return match
        if (currentInn.recentBalls.isEmpty()) return match

        val lastBall = currentInn.recentBalls.first()
        val remainingBalls = currentInn.recentBalls.drop(1)

        val isLegal = !(lastBall.isExtra && (lastBall.extraType == ExtraType.WIDE || lastBall.extraType == ExtraType.NO_BALL))
        val ballRuns = lastBall.runs + lastBall.extraRuns + (if (lastBall.isExtra && (lastBall.extraType == ExtraType.WIDE || lastBall.extraType == ExtraType.NO_BALL)) 1 else 0)

        val newTotalRuns = (currentInn.totalRuns - ballRuns).coerceAtLeast(0)
        val newLegalBalls = (currentInn.legalBallsBowled - (if (isLegal) 1 else 0)).coerceAtLeast(0)
        val newWickets = (currentInn.totalWickets - (if (lastBall.isWicket) 1 else 0)).coerceAtLeast(0)

        // Reverse batsman stats
        val updatedBatting = currentInn.battingScorecard.toMutableMap()
        val batsman = updatedBatting[lastBall.strikerId]
        if (batsman != null) {
            val runsOffBat = if (lastBall.extraType == ExtraType.BYE || lastBall.extraType == ExtraType.LEG_BYE || lastBall.extraType == ExtraType.WIDE) 0 else lastBall.runs
            val ballsOffBat = if (lastBall.extraType == ExtraType.WIDE) 0 else 1
            updatedBatting[lastBall.strikerId] = batsman.copy(
                runs = (batsman.runs - runsOffBat).coerceAtLeast(0),
                balls = (batsman.balls - ballsOffBat).coerceAtLeast(0),
                fours = (batsman.fours - (if (runsOffBat == 4) 1 else 0)).coerceAtLeast(0),
                sixes = (batsman.sixes - (if (runsOffBat == 6) 1 else 0)).coerceAtLeast(0),
                isOut = if (lastBall.isWicket) false else batsman.isOut
            )
        }

        // Reverse bowler stats
        val updatedBowling = currentInn.bowlingScorecard.toMutableMap()
        val bowler = updatedBowling[lastBall.bowlerId]
        if (bowler != null) {
            val conceded = if (lastBall.extraType == ExtraType.BYE || lastBall.extraType == ExtraType.LEG_BYE) 0 else ballRuns
            updatedBowling[lastBall.bowlerId] = bowler.copy(
                legalBallsBowled = (bowler.legalBallsBowled - (if (isLegal) 1 else 0)).coerceAtLeast(0),
                runsConceded = (bowler.runsConceded - conceded).coerceAtLeast(0),
                wickets = (bowler.wickets - (if (lastBall.isWicket && lastBall.wicketType != DismissalType.RUN_OUT) 1 else 0)).coerceAtLeast(0)
            )
        }

        val updatedInn = currentInn.copy(
            totalRuns = newTotalRuns,
            legalBallsBowled = newLegalBalls,
            totalWickets = newWickets,
            currentStrikerId = lastBall.strikerId,
            currentNonStrikerId = lastBall.nonStrikerId,
            battingScorecard = updatedBatting,
            bowlingScorecard = updatedBowling,
            recentBalls = remainingBalls,
            isCompleted = false
        )

        val newInningsList = match.inningsList.toMutableList()
        newInningsList[match.currentInningsNumber - 1] = updatedInn

        return match.copy(
            status = MatchStatus.LIVE,
            inningsList = newInningsList,
            winnerTeamId = null,
            resultSummary = null
        )
    }

    private fun findNextAvailableBatsman(battingTeam: Team, scorecard: Map<String, BatsmanStats>): String? {
        return battingTeam.players.firstOrNull { player ->
            val stat = scorecard[player.id]
            stat == null || (!stat.isOut && stat.balls == 0 && stat.runs == 0)
        }?.id
    }

    private fun generateCommentary(
        runs: Int,
        isExtra: Boolean,
        extraType: ExtraType?,
        isWicket: Boolean,
        wicketType: DismissalType?,
        batsmanName: String
    ): String {
        return when {
            isWicket -> "WICKET! $batsmanName is OUT (${wicketType?.label ?: "Dismissed"})"
            runs == 6 -> "MAXIMUM! $batsmanName launches it deep into the stands for SIX!"
            runs == 4 -> "FOUR! Sweetly timed through the field to the boundary."
            isExtra && extraType == ExtraType.WIDE -> "Wide ball called by the umpire."
            isExtra && extraType == ExtraType.NO_BALL -> "No Ball called! Free hit coming up."
            runs == 1 -> "Quick single taken."
            runs == 2 -> "Well placed into the gap, easy two."
            runs == 0 -> "Solid defensive stroke, no run."
            else -> "$runs runs scored."
        }
    }
}
