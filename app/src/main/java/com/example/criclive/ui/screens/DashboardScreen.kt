package com.example.criclive.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.criclive.model.*

@Composable
fun DashboardScreen(
    activeMatch: Match?,
    allMatches: List<Match>,
    onSelectMatch: (String) -> Unit,
    onNavigateToScorer: () -> Unit,
    onNavigateToFixtures: () -> Unit,
    onNavigateToTeams: () -> Unit,
    onNavigateToScorecard: () -> Unit
) {
    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Hero Live Match Card
        item {
            if (activeMatch != null) {
                HeroMatchCard(
                    match = activeMatch,
                    onOpenScorer = onNavigateToScorer,
                    onOpenScorecard = onNavigateToScorecard
                )
            } else {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
                ) {
                    Box(modifier = Modifier.padding(24.dp), contentAlignment = Alignment.Center) {
                        Text(
                            text = "No active match. Tap Fixtures to schedule a game!",
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            }
        }

        // Quick Actions Row
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Button(
                    onClick = onNavigateToScorer,
                    modifier = Modifier
                        .weight(1f)
                        .testTag("dashboard_scorer_button"),
                    colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Icon(Icons.Default.SportsCricket, contentDescription = "Scorer", modifier = Modifier.size(18.dp))
                    Spacer(modifier = Modifier.width(6.dp))
                    Text("Scorer Console")
                }

                OutlinedButton(
                    onClick = onNavigateToFixtures,
                    modifier = Modifier
                        .weight(1f)
                        .testTag("dashboard_fixtures_button"),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Icon(Icons.Default.Schedule, contentDescription = "Fixtures", modifier = Modifier.size(18.dp))
                    Spacer(modifier = Modifier.width(6.dp))
                    Text("Fix Matches")
                }
            }
        }

        // Recent Balls Ticker
        item {
            activeMatch?.currentInnings?.let { inn ->
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = "RECENT BALLS",
                                style = MaterialTheme.typography.labelSmall,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.primary
                            )
                            Text(
                                text = "Over ${inn.oversFormatted}",
                                style = MaterialTheme.typography.bodyMedium,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }

                        Spacer(modifier = Modifier.height(10.dp))

                        if (inn.recentBalls.isEmpty()) {
                            Text(
                                text = "Waiting for first ball to be bowled...",
                                style = MaterialTheme.typography.bodyMedium,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        } else {
                            LazyRow(
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                items(inn.recentBalls) { ball ->
                                    val isBoundary = ball.runs == 4 || ball.runs == 6
                                    val isWkt = ball.isWicket

                                    val bg = when {
                                        isWkt -> MaterialTheme.colorScheme.error
                                        ball.runs == 6 -> Color(0xFF8B5CF6)
                                        ball.runs == 4 -> MaterialTheme.colorScheme.primary
                                        ball.isExtra -> Color(0xFFF59E0B)
                                        ball.runs == 0 -> Color(0xFF334155)
                                        else -> MaterialTheme.colorScheme.surfaceVariant
                                    }

                                    val label = when {
                                        isWkt -> "W"
                                        ball.isExtra -> "${ball.extraType?.label?.take(1) ?: "E"}${if (ball.runs > 0) "+${ball.runs}" else ""}"
                                        else -> ball.runs.toString()
                                    }

                                    Box(
                                        modifier = Modifier
                                            .size(36.dp)
                                            .clip(CircleShape)
                                            .background(bg),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        Text(
                                            text = label,
                                            fontWeight = FontWeight.Bold,
                                            fontSize = 13.sp,
                                            color = Color.White
                                        )
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        // All Matches List
        item {
            Text(
                text = "MATCHES & FIXTURES",
                style = MaterialTheme.typography.labelSmall,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }

        items(allMatches) { match ->
            MatchRowCard(
                match = match,
                isSelected = match.id == activeMatch?.id,
                onClick = { onSelectMatch(match.id) }
            )
        }
    }
}

@Composable
fun HeroMatchCard(
    match: Match,
    onOpenScorer: () -> Unit,
    onOpenScorecard: () -> Unit
) {
    val inn = match.currentInnings
    val battingTeam = match.battingTeam
    val bowlingTeam = match.bowlingTeam

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .testTag("hero_match_card"),
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
    ) {
        Column(modifier = Modifier.padding(18.dp)) {
            // Header: Status badge & Series title
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Surface(
                    color = if (match.status == MatchStatus.LIVE) Color(0xFFDC2626) else MaterialTheme.colorScheme.primaryContainer,
                    shape = RoundedCornerShape(6.dp)
                ) {
                    Text(
                        text = match.status.label.uppercase(),
                        color = Color.White,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp)
                    )
                }

                Text(
                    text = match.seriesName,
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    maxLines = 1
                )
            }

            Spacer(modifier = Modifier.height(14.dp))

            // Score Banner
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = battingTeam.name,
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                    Text(
                        text = "vs ${bowlingTeam.shortName}",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }

                Column(horizontalAlignment = Alignment.End) {
                    Text(
                        text = if (inn != null) "${inn.totalRuns}/${inn.totalWickets}" else "0/0",
                        style = MaterialTheme.typography.headlineLarge,
                        fontWeight = FontWeight.ExtraBold,
                        color = MaterialTheme.colorScheme.primary
                    )
                    Text(
                        text = "Overs: ${inn?.oversFormatted ?: "0.0"} / ${match.overs}",
                        style = MaterialTheme.typography.bodyMedium,
                        fontWeight = FontWeight.Medium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }

            Spacer(modifier = Modifier.height(14.dp))

            // Current batsmen & bowler snippet
            inn?.let {
                val striker = battingTeam.players.find { p -> p.id == it.currentStrikerId }
                val strikerStats = it.battingScorecard[it.currentStrikerId]
                val nonStriker = battingTeam.players.find { p -> p.id == it.currentNonStrikerId }
                val nonStrikerStats = it.battingScorecard[it.currentNonStrikerId]
                val bowler = bowlingTeam.players.find { p -> p.id == it.currentBowlerId }
                val bowlerStats = it.bowlingScorecard[it.currentBowlerId]

                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(12.dp))
                        .background(MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f))
                        .padding(10.dp),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Column {
                        Text(
                            text = "🏏 ${striker?.name ?: "Striker"}* ${strikerStats?.runs ?: 0} (${strikerStats?.balls ?: 0})",
                            fontSize = 12.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = MaterialTheme.colorScheme.onSurface
                        )
                        Text(
                            text = "   ${nonStriker?.name ?: "Non-Striker"} ${nonStrikerStats?.runs ?: 0} (${nonStrikerStats?.balls ?: 0})",
                            fontSize = 12.sp,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }

                    Column(horizontalAlignment = Alignment.End) {
                        Text(
                            text = "⚾ ${bowler?.name ?: "Bowler"}",
                            fontSize = 12.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = MaterialTheme.colorScheme.onSurface
                        )
                        Text(
                            text = "${bowlerStats?.wickets ?: 0}/${bowlerStats?.runsConceded ?: 0} (${bowlerStats?.oversString ?: "0.0"})",
                            fontSize = 12.sp,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(14.dp))

            // Card Action Buttons
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                FilledTonalButton(
                    onClick = onOpenScorer,
                    modifier = Modifier.weight(1f),
                    shape = RoundedCornerShape(10.dp)
                ) {
                    Text("Ball-by-Ball")
                }
                OutlinedButton(
                    onClick = onOpenScorecard,
                    modifier = Modifier.weight(1f),
                    shape = RoundedCornerShape(10.dp)
                ) {
                    Text("Scorecard")
                }
            }
        }
    }
}

@Composable
fun MatchRowCard(
    match: Match,
    isSelected: Boolean,
    onClick: () -> Unit
) {
    val currentInn = match.currentInnings
    val borderModifier = if (isSelected) {
        Modifier.border(1.5.dp, MaterialTheme.colorScheme.primary, RoundedCornerShape(14.dp))
    } else Modifier

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .then(borderModifier)
            .clickable { onClick() }
            .testTag("match_row_${match.id}"),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        shape = RoundedCornerShape(14.dp)
    ) {
        Row(
            modifier = Modifier
                .padding(14.dp)
                .fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        text = "${match.teamA.shortName} vs ${match.teamB.shortName}",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                    if (isSelected) {
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(
                            text = "ACTIVE",
                            fontSize = 10.sp,
                            fontWeight = FontWeight.ExtraBold,
                            color = MaterialTheme.colorScheme.primary
                        )
                    }
                }
                Text(
                    text = "${match.venue} • ${match.format.displayName}",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }

            Column(horizontalAlignment = Alignment.End) {
                if (currentInn != null) {
                    Text(
                        text = "${currentInn.totalRuns}/${currentInn.totalWickets}",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.primary
                    )
                    Text(
                        text = "(${currentInn.oversFormatted} ov)",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                } else {
                    Text(
                        text = match.status.label,
                        style = MaterialTheme.typography.bodyMedium,
                        fontWeight = FontWeight.SemiBold,
                        color = MaterialTheme.colorScheme.secondary
                    )
                }
            }
        }
    }
}
