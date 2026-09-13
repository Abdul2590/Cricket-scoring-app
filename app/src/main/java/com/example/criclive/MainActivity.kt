package com.example.criclive

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.viewModels
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.testTag
import com.example.criclive.ui.screens.*
import com.example.criclive.ui.theme.CricLiveTheme
import com.example.criclive.viewmodel.CricketViewModel

enum class NavigationScreen(val label: String, val icon: ImageVector) {
    DASHBOARD("Dashboard", Icons.Default.Dashboard),
    SCORER("Scorer", Icons.Default.SportsCricket),
    FIXTURES("Fixtures", Icons.Default.Schedule),
    SCORECARD("Scorecard", Icons.Default.Assessment),
    TEAMS("Teams", Icons.Default.Groups)
}

class MainActivity : ComponentActivity() {

    private val viewModel: CricketViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        setContent {
            CricLiveTheme {
                val activeMatch by viewModel.activeMatch.collectAsState()
                val activeMatchId by viewModel.activeMatchId.collectAsState()
                val allMatches by viewModel.matches.collectAsState()
                val allTeams by viewModel.teams.collectAsState()

                var currentScreen by remember { mutableStateOf(NavigationScreen.DASHBOARD) }

                Scaffold(
                    modifier = Modifier.fillMaxSize(),
                    bottomBar = {
                        NavigationBar(
                            containerColor = MaterialTheme.colorScheme.surface,
                            contentColor = MaterialTheme.colorScheme.onSurface
                        ) {
                            NavigationScreen.entries.forEach { screen ->
                                NavigationBarItem(
                                    selected = currentScreen == screen,
                                    onClick = { currentScreen = screen },
                                    icon = {
                                        Icon(
                                            imageVector = screen.icon,
                                            contentDescription = screen.label
                                        )
                                    },
                                    label = { Text(screen.label) },
                                    modifier = Modifier.testTag("nav_${screen.name.lowercase()}")
                                )
                            }
                        }
                    }
                ) { innerPadding ->
                    Surface(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(innerPadding),
                        color = MaterialTheme.colorScheme.background
                    ) {
                        when (currentScreen) {
                            NavigationScreen.DASHBOARD -> DashboardScreen(
                                activeMatch = activeMatch,
                                allMatches = allMatches,
                                onSelectMatch = { matchId ->
                                    viewModel.selectMatch(matchId)
                                },
                                onNavigateToScorer = { currentScreen = NavigationScreen.SCORER },
                                onNavigateToFixtures = { currentScreen = NavigationScreen.FIXTURES },
                                onNavigateToTeams = { currentScreen = NavigationScreen.TEAMS },
                                onNavigateToScorecard = { currentScreen = NavigationScreen.SCORECARD }
                            )
                            NavigationScreen.SCORER -> ScorerScreen(
                                match = activeMatch,
                                onRecordBall = { runs, isExtra, extraType, extraRuns, isWicket, wicketType, fielder, nextBatsmanId ->
                                    viewModel.recordBall(
                                        runs = runs,
                                        isExtra = isExtra,
                                        extraType = extraType,
                                        extraRuns = extraRuns,
                                        isWicket = isWicket,
                                        wicketType = wicketType,
                                        fielderName = fielder,
                                        newBatsmanId = nextBatsmanId
                                    )
                                },
                                onSwapStrikers = { viewModel.swapStrikers() },
                                onChangeBowler = { bowlerId -> viewModel.changeBowler(bowlerId) },
                                onUndoBall = { viewModel.undoLastBall() },
                                onViewScorecard = { currentScreen = NavigationScreen.SCORECARD }
                            )
                            NavigationScreen.FIXTURES -> FixturesScreen(
                                matches = allMatches,
                                teams = allTeams,
                                activeMatchId = activeMatchId,
                                onSelectMatch = { matchId ->
                                    viewModel.selectMatch(matchId)
                                },
                                onCreateMatch = { title, teamAId, teamBId, format, overs, venue, date ->
                                    viewModel.createMatch(title, teamAId, teamBId, format, overs, venue, date)
                                    currentScreen = NavigationScreen.SCORER
                                },
                                onDeleteMatch = { matchId -> viewModel.deleteMatch(matchId) }
                            )
                            NavigationScreen.SCORECARD -> ScorecardScreen(
                                match = activeMatch
                            )
                            NavigationScreen.TEAMS -> TeamsScreen(
                                teams = allTeams,
                                onAddPlayer = { teamId, name, role ->
                                    viewModel.addPlayerToTeam(teamId, name, role)
                                },
                                onAddCustomTeam = { newTeam ->
                                    viewModel.addCustomTeam(newTeam)
                                }
                            )
                        }
                    }
                }
            }
        }
    }
}
