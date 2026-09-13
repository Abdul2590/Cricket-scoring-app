package com.example.criclive.viewmodel

import androidx.lifecycle.ViewModel
import com.example.criclive.data.CricketDefaults
import com.example.criclive.engine.CricketEngine
import com.example.criclive.model.*
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

class CricketViewModel : ViewModel() {

    private val _teams = MutableStateFlow<List<Team>>(CricketDefaults.allDefaultTeams)
    val teams: StateFlow<List<Team>> = _teams.asStateFlow()

    private val _matches = MutableStateFlow<List<Match>>(CricketDefaults.createInitialFixtures())
    val matches: StateFlow<List<Match>> = _matches.asStateFlow()

    private val _activeMatchId = MutableStateFlow("match-ind-pak-live")
    val activeMatchId: StateFlow<String> = _activeMatchId.asStateFlow()

    private val _activeMatch = MutableStateFlow<Match?>(CricketDefaults.createInitialLiveMatch())
    val activeMatch: StateFlow<Match?> = _activeMatch.asStateFlow()

    fun selectMatch(matchId: String) {
        _activeMatchId.value = matchId
        val found = _matches.value.find { it.id == matchId }
        _activeMatch.value = found
    }

    fun recordBall(
        runs: Int,
        isExtra: Boolean = false,
        extraType: ExtraType? = null,
        extraRuns: Int = 0,
        isWicket: Boolean = false,
        wicketType: DismissalType? = null,
        fielderName: String? = null,
        newBatsmanId: String? = null
    ) {
        val current = _activeMatch.value ?: return
        val updated = CricketEngine.recordBall(
            match = current,
            runs = runs,
            isExtra = isExtra,
            extraType = extraType,
            extraRuns = extraRuns,
            isWicket = isWicket,
            wicketType = wicketType,
            fielderName = fielderName,
            newBatsmanId = newBatsmanId
        )
        updateMatchInList(updated)
    }

    fun swapStrikers() {
        val current = _activeMatch.value ?: return
        val updated = CricketEngine.swapStrikers(current)
        updateMatchInList(updated)
    }

    fun changeBowler(bowlerId: String) {
        val current = _activeMatch.value ?: return
        val updated = CricketEngine.changeBowler(current, bowlerId)
        updateMatchInList(updated)
    }

    fun undoLastBall() {
        val current = _activeMatch.value ?: return
        val updated = CricketEngine.undoLastBall(current)
        updateMatchInList(updated)
    }

    fun createMatch(
        title: String,
        teamAId: String,
        teamBId: String,
        format: MatchFormat,
        overs: Int,
        venue: String,
        date: String
    ) {
        val teamA = _teams.value.find { it.id == teamAId } ?: return
        val teamB = _teams.value.find { it.id == teamBId } ?: return

        val striker = teamA.players.getOrNull(0) ?: Player("p1", "Batsman 1")
        val nonStriker = teamA.players.getOrNull(1) ?: Player("p2", "Batsman 2")
        val bowler = teamB.players.getOrNull(0) ?: Player("b1", "Bowler 1")

        val battingMap = teamA.players.associate {
            it.id to BatsmanStats(playerId = it.id, playerName = it.name)
        }
        val bowlingMap = teamB.players.associate {
            it.id to BowlerStats(playerId = it.id, playerName = it.name)
        }

        val innings1 = Innings(
            id = "inn-${System.currentTimeMillis()}",
            battingTeamId = teamA.id,
            bowlingTeamId = teamB.id,
            totalRuns = 0,
            totalWickets = 0,
            legalBallsBowled = 0,
            totalOversLimit = overs,
            currentStrikerId = striker.id,
            currentNonStrikerId = nonStriker.id,
            currentBowlerId = bowler.id,
            battingScorecard = battingMap,
            bowlingScorecard = bowlingMap
        )

        val newMatch = Match(
            id = "match-${System.currentTimeMillis()}",
            seriesName = title.ifBlank { "${teamA.shortName} vs ${teamB.shortName} Series" },
            matchTitle = "${teamA.name} vs ${teamB.name}",
            teamA = teamA,
            teamB = teamB,
            format = format,
            overs = overs,
            venue = venue.ifBlank { "National Stadium" },
            matchDate = date.ifBlank { "Today" },
            status = MatchStatus.LIVE,
            tossWinnerId = teamA.id,
            tossChoice = "bat",
            currentInningsNumber = 1,
            inningsList = listOf(innings1)
        )

        _matches.value = listOf(newMatch) + _matches.value
        selectMatch(newMatch.id)
    }

    fun deleteMatch(matchId: String) {
        val updated = _matches.value.filter { it.id !== matchId }
        _matches.value = updated
        if (_activeMatchId.value == matchId) {
            val next = updated.firstOrNull()
            _activeMatchId.value = next?.id ?: ""
            _activeMatch.value = next
        }
    }

    fun addCustomTeam(team: Team) {
        _teams.value = _teams.value + team
    }

    fun addPlayerToTeam(teamId: String, name: String, role: PlayerRole) {
        val cleanName = name.trim()
        if (cleanName.isEmpty()) return

        val newPlayer = Player(
            id = "p-${System.currentTimeMillis()}",
            name = cleanName,
            role = role
        )

        _teams.value = _teams.value.map { team ->
            if (team.id == teamId) {
                team.copy(players = team.players + newPlayer)
            } else team
        }
    }

    private fun updateMatchInList(updated: Match) {
        _activeMatch.value = updated
        _matches.value = _matches.value.map { m ->
            if (m.id == updated.id) updated else m
        }
    }
}
