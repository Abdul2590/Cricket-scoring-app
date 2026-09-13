package com.example.criclive.data

import com.example.criclive.model.*

object CricketDefaults {
    val teamIndia = Team(
        id = "team-ind",
        name = "India",
        shortName = "IND",
        color = "#0284C7",
        players = listOf(
            Player("ind-1", "Rohit Sharma", PlayerRole.BATSMAN, isCaptain = true),
            Player("ind-2", "Virat Kohli", PlayerRole.BATSMAN),
            Player("ind-3", "Suryakumar Yadav", PlayerRole.BATSMAN),
            Player("ind-4", "Rishabh Pant", PlayerRole.WICKET_KEEPER, isWicketKeeper = true),
            Player("ind-5", "Hardik Pandya", PlayerRole.ALL_ROUNDER),
            Player("ind-6", "Ravindra Jadeja", PlayerRole.ALL_ROUNDER),
            Player("ind-7", "Axar Patel", PlayerRole.ALL_ROUNDER),
            Player("ind-8", "Jasprit Bumrah", PlayerRole.BOWLER),
            Player("ind-9", "Arshdeep Singh", PlayerRole.BOWLER),
            Player("ind-10", "Kuldeep Yadav", PlayerRole.BOWLER),
            Player("ind-11", "Mohammed Siraj", PlayerRole.BOWLER)
        )
    )

    val teamPakistan = Team(
        id = "team-pak",
        name = "Pakistan",
        shortName = "PAK",
        color = "#15803D",
        players = listOf(
            Player("pak-1", "Babar Azam", PlayerRole.BATSMAN, isCaptain = true),
            Player("pak-2", "Mohammad Rizwan", PlayerRole.WICKET_KEEPER, isWicketKeeper = true),
            Player("pak-3", "Fakhar Zaman", PlayerRole.BATSMAN),
            Player("pak-4", "Iftikhar Ahmed", PlayerRole.ALL_ROUNDER),
            Player("pak-5", "Shadab Khan", PlayerRole.ALL_ROUNDER),
            Player("pak-6", "Imad Wasim", PlayerRole.ALL_ROUNDER),
            Player("pak-7", "Shaheen Afridi", PlayerRole.BOWLER),
            Player("pak-8", "Naseem Shah", PlayerRole.BOWLER),
            Player("pak-9", "Haris Rauf", PlayerRole.BOWLER),
            Player("pak-10", "Mohammad Amir", PlayerRole.BOWLER),
            Player("pak-11", "Abrar Ahmed", PlayerRole.BOWLER)
        )
    )

    val teamAustralia = Team(
        id = "team-aus",
        name = "Australia",
        shortName = "AUS",
        color = "#EAB308",
        players = listOf(
            Player("aus-1", "Travis Head", PlayerRole.BATSMAN),
            Player("aus-2", "David Warner", PlayerRole.BATSMAN),
            Player("aus-3", "Mitchell Marsh", PlayerRole.ALL_ROUNDER, isCaptain = true),
            Player("aus-4", "Glenn Maxwell", PlayerRole.ALL_ROUNDER),
            Player("aus-5", "Marcus Stoinis", PlayerRole.ALL_ROUNDER),
            Player("aus-6", "Tim David", PlayerRole.BATSMAN),
            Player("aus-7", "Matthew Wade", PlayerRole.WICKET_KEEPER, isWicketKeeper = true),
            Player("aus-8", "Pat Cummins", PlayerRole.BOWLER),
            Player("aus-9", "Mitchell Starc", PlayerRole.BOWLER),
            Player("aus-10", "Adam Zampa", PlayerRole.BOWLER),
            Player("aus-11", "Josh Hazlewood", PlayerRole.BOWLER)
        )
    )

    val teamEngland = Team(
        id = "team-eng",
        name = "England",
        shortName = "ENG",
        color = "#E11D48",
        players = listOf(
            Player("eng-1", "Jos Buttler", PlayerRole.WICKET_KEEPER, isCaptain = true, isWicketKeeper = true),
            Player("eng-2", "Phil Salt", PlayerRole.BATSMAN),
            Player("eng-3", "Jonny Bairstow", PlayerRole.BATSMAN),
            Player("eng-4", "Harry Brook", PlayerRole.BATSMAN),
            Player("eng-5", "Liam Livingstone", PlayerRole.ALL_ROUNDER),
            Player("eng-6", "Moeen Ali", PlayerRole.ALL_ROUNDER),
            Player("eng-7", "Sam Curran", PlayerRole.ALL_ROUNDER),
            Player("eng-8", "Chris Jordan", PlayerRole.BOWLER),
            Player("eng-9", "Jofra Archer", PlayerRole.BOWLER),
            Player("eng-10", "Adil Rashid", PlayerRole.BOWLER),
            Player("eng-11", "Mark Wood", PlayerRole.BOWLER)
        )
    )

    val allDefaultTeams = listOf(teamIndia, teamPakistan, teamAustralia, teamEngland)

    fun createInitialLiveMatch(): Match {
        val battingTeam = teamIndia
        val bowlingTeam = teamPakistan

        val striker = battingTeam.players[0] // Rohit
        val nonStriker = battingTeam.players[1] // Kohli
        val bowler = bowlingTeam.players[6] // Shaheen

        val battingMap = mutableMapOf<String, BatsmanStats>()
        battingTeam.players.forEach { p ->
            battingMap[p.id] = BatsmanStats(
                playerId = p.id,
                playerName = p.name,
                runs = if (p.id == striker.id) 38 else if (p.id == nonStriker.id) 42 else 0,
                balls = if (p.id == striker.id) 22 else if (p.id == nonStriker.id) 28 else 0,
                fours = if (p.id == striker.id) 4 else if (p.id == nonStriker.id) 5 else 0,
                sixes = if (p.id == striker.id) 2 else if (p.id == nonStriker.id) 1 else 0
            )
        }

        val bowlingMap = mutableMapOf<String, BowlerStats>()
        bowlingTeam.players.forEach { p ->
            bowlingMap[p.id] = BowlerStats(
                playerId = p.id,
                playerName = p.name,
                legalBallsBowled = if (p.id == bowler.id) 16 else 0,
                maidens = 0,
                runsConceded = if (p.id == bowler.id) 24 else 0,
                wickets = 0,
                dots = if (p.id == bowler.id) 7 else 0
            )
        }

        val innings1 = Innings(
            id = "inn-1",
            battingTeamId = battingTeam.id,
            bowlingTeamId = bowlingTeam.id,
            totalRuns = 86,
            totalWickets = 0,
            legalBallsBowled = 50, // 8.2 overs
            totalOversLimit = 20,
            wides = 3,
            noBalls = 1,
            byes = 1,
            legByes = 1,
            currentStrikerId = striker.id,
            currentNonStrikerId = nonStriker.id,
            currentBowlerId = bowler.id,
            battingScorecard = battingMap,
            bowlingScorecard = bowlingMap,
            recentBalls = listOf(
                BallEvent(id = "b1", overIndex = 8, ballInOver = 1, runs = 1, strikerId = striker.id, nonStrikerId = nonStriker.id, bowlerId = bowler.id, commentary = "Pushed down to long-on for a single"),
                BallEvent(id = "b2", overIndex = 8, ballInOver = 2, runs = 4, strikerId = nonStriker.id, nonStrikerId = striker.id, bowlerId = bowler.id, commentary = "Driven exquisitely through covers for FOUR!")
            )
        )

        return Match(
            id = "match-ind-pak-live",
            seriesName = "ICC T20 World Cup Super 8",
            matchTitle = "India vs Pakistan",
            teamA = battingTeam,
            teamB = bowlingTeam,
            format = MatchFormat.T20,
            overs = 20,
            venue = "Melbourne Cricket Ground",
            matchDate = "Today, 19:30 Local",
            status = MatchStatus.LIVE,
            tossWinnerId = battingTeam.id,
            tossChoice = "bat",
            currentInningsNumber = 1,
            inningsList = listOf(innings1)
        )
    }

    fun createInitialFixtures(): List<Match> {
        val liveMatch = createInitialLiveMatch()

        val fixture2 = Match(
            id = "match-aus-eng-upcoming",
            seriesName = "The Ashes T20 Series",
            matchTitle = "Australia vs England",
            teamA = teamAustralia,
            teamB = teamEngland,
            format = MatchFormat.T20,
            overs = 20,
            venue = "Lord's, London",
            matchDate = "Tomorrow, 15:00 BST",
            status = MatchStatus.UPCOMING
        )

        val fixture3 = Match(
            id = "match-ind-aus-upcoming",
            seriesName = "Border Gavaskar White Ball Cup",
            matchTitle = "India vs Australia",
            teamA = teamIndia,
            teamB = teamAustralia,
            format = MatchFormat.ODI,
            overs = 50,
            venue = "Wankhede Stadium, Mumbai",
            matchDate = "In 3 days, 14:00 IST",
            status = MatchStatus.UPCOMING
        )

        return listOf(liveMatch, fixture2, fixture3)
    }
}
