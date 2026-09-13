package com.example.criclive.model

import kotlinx.serialization.Serializable

@Serializable
enum class MatchFormat(val displayName: String, val defaultOvers: Int) {
    T20("T20", 20),
    ODI("ODI", 50),
    T10("T10", 10),
    THE_HUNDRED("The Hundred", 100),
    CUSTOM("Custom", 20)
}

@Serializable
enum class DismissalType(val label: String) {
    BOWLED("Bowled"),
    CAUGHT("Caught"),
    LBW("LBW"),
    RUN_OUT("Run Out"),
    STUMPED("Stumped"),
    HIT_WICKET("Hit Wicket")
}

@Serializable
enum class PlayerRole(val label: String) {
    BATSMAN("Batsman"),
    BOWLER("Bowler"),
    ALL_ROUNDER("All-Rounder"),
    WICKET_KEEPER("Wicket Keeper")
}

@Serializable
data class Player(
    val id: String,
    val name: String,
    val role: PlayerRole = PlayerRole.BATSMAN,
    val isCaptain: Boolean = false,
    val isWicketKeeper: Boolean = false
)

@Serializable
data class Team(
    val id: String,
    val name: String,
    val shortName: String,
    val color: String, // Hex color code
    val players: List<Player> = emptyList()
)

@Serializable
enum class ExtraType(val label: String) {
    WIDE("Wide"),
    NO_BALL("No Ball"),
    BYE("Bye"),
    LEG_BYE("Leg Bye"),
    PENALTY("Penalty")
}

@Serializable
data class BallEvent(
    val id: String,
    val overIndex: Int, // 0-indexed (e.g. 0 for 1st over)
    val ballInOver: Int, // 1 to 6
    val runs: Int,
    val isExtra: Boolean = false,
    val extraType: ExtraType? = null,
    val extraRuns: Int = 0,
    val isWicket: Boolean = false,
    val wicketType: DismissalType? = null,
    val outPlayerId: String? = null,
    val fielderName: String? = null,
    val strikerId: String,
    val nonStrikerId: String,
    val bowlerId: String,
    val commentary: String = "",
    val timestamp: Long = System.currentTimeMillis()
)

@Serializable
data class BatsmanStats(
    val playerId: String,
    val playerName: String,
    val runs: Int = 0,
    val balls: Int = 0,
    val fours: Int = 0,
    val sixes: Int = 0,
    val isOut: Boolean = false,
    val dismissalInfo: String? = null
) {
    val strikeRate: Double
        get() = if (balls > 0) (runs.toDouble() / balls) * 100.0 else 0.0
}

@Serializable
data class BowlerStats(
    val playerId: String,
    val playerName: String,
    val legalBallsBowled: Int = 0,
    val maidens: Int = 0,
    val runsConceded: Int = 0,
    val wickets: Int = 0,
    val dots: Int = 0
) {
    val oversString: String
        get() {
            val overs = legalBallsBowled / 6
            val balls = legalBallsBowled % 6
            return "$overs.$balls"
        }

    val economy: Double
        get() {
            val overs = legalBallsBowled.toDouble() / 6.0
            return if (overs > 0) runsConceded.toDouble() / overs else 0.0
        }
}

@Serializable
data class FallOfWicket(
    val wicketNumber: Int,
    val score: Int,
    val over: String,
    val playerName: String
)

@Serializable
data class Innings(
    val id: String,
    val battingTeamId: String,
    val bowlingTeamId: String,
    val totalRuns: Int = 0,
    val totalWickets: Int = 0,
    val legalBallsBowled: Int = 0,
    val totalOversLimit: Int = 20,
    val wides: Int = 0,
    val noBalls: Int = 0,
    val byes: Int = 0,
    val legByes: Int = 0,
    val currentStrikerId: String = "",
    val currentNonStrikerId: String = "",
    val currentBowlerId: String = "",
    val previousBowlerId: String? = null,
    val battingScorecard: Map<String, BatsmanStats> = emptyMap(),
    val bowlingScorecard: Map<String, BowlerStats> = emptyMap(),
    val fallOfWickets: List<FallOfWicket> = emptyList(),
    val recentBalls: List<BallEvent> = emptyList(),
    val isCompleted: Boolean = false
) {
    val oversFormatted: String
        get() = "${legalBallsBowled / 6}.${legalBallsBowled % 6}"

    val currentRunRate: Double
        get() {
            val overs = legalBallsBowled.toDouble() / 6.0
            return if (overs > 0) totalRuns.toDouble() / overs else 0.0
        }
}

@Serializable
enum class MatchStatus(val label: String) {
    UPCOMING("Upcoming"),
    LIVE("Live"),
    INNINGS_BREAK("Innings Break"),
    COMPLETED("Completed")
}

@Serializable
data class Match(
    val id: String,
    val seriesName: String,
    val matchTitle: String,
    val teamA: Team,
    val teamB: Team,
    val format: MatchFormat = MatchFormat.T20,
    val overs: Int = 20,
    val venue: String,
    val matchDate: String,
    val status: MatchStatus = MatchStatus.LIVE,
    val tossWinnerId: String? = null,
    val tossChoice: String? = "bat",
    val currentInningsNumber: Int = 1, // 1 or 2
    val inningsList: List<Innings> = emptyList(),
    val target: Int? = null,
    val winnerTeamId: String? = null,
    val resultSummary: String? = null,
    val createdAt: Long = System.currentTimeMillis()
) {
    val currentInnings: Innings?
        get() = inningsList.getOrNull(currentInningsNumber - 1)

    val battingTeam: Team
        get() {
            val inn = currentInnings
            return if (inn?.battingTeamId == teamB.id) teamB else teamA
        }

    val bowlingTeam: Team
        get() {
            val inn = currentInnings
            return if (inn?.bowlingTeamId == teamA.id) teamA else teamB
        }
}
