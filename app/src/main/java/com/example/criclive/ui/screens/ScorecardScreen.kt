package com.example.criclive.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.criclive.model.*

@Composable
fun ScorecardScreen(
    match: Match?
) {
    if (match == null) {
        Box(
            modifier = Modifier.fillMaxSize().background(MaterialTheme.colorScheme.background),
            contentAlignment = Alignment.Center
        ) {
            Text("No active match selected.", color = MaterialTheme.colorScheme.onBackground)
        }
        return
    }

    val currentInn = match.currentInnings
    val battingTeam = match.battingTeam
    val bowlingTeam = match.bowlingTeam

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Match Header Card
        item {
            Card(
                modifier = Modifier.fillMaxWidth().testTag("scorecard_header"),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                shape = RoundedCornerShape(16.dp)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        text = "${match.teamA.name} vs ${match.teamB.name}",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                    Text(
                        text = "${match.seriesName} • ${match.venue}",
                        fontSize = 12.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = "${battingTeam.name} - ${currentInn?.totalRuns ?: 0}/${currentInn?.totalWickets ?: 0} (${currentInn?.oversFormatted ?: "0.0"} ov)",
                        fontSize = 22.sp,
                        fontWeight = FontWeight.ExtraBold,
                        color = MaterialTheme.colorScheme.primary
                    )
                }
            }
        }

        // Batting Scorecard Section
        item {
            Text(
                text = "BATTING SCORECARD",
                style = MaterialTheme.typography.labelSmall,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.primary
            )
        }

        item {
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                shape = RoundedCornerShape(12.dp)
            ) {
                Column(modifier = Modifier.padding(12.dp)) {
                    // Batting Table Header
                    Row(
                        modifier = Modifier.fillMaxWidth().padding(bottom = 8.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text("Batter", modifier = Modifier.weight(2.5f), fontSize = 11.sp, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        Text("R", modifier = Modifier.weight(0.7f), fontSize = 11.sp, fontWeight = FontWeight.Bold, textAlign = TextAlign.End, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        Text("B", modifier = Modifier.weight(0.7f), fontSize = 11.sp, fontWeight = FontWeight.Bold, textAlign = TextAlign.End, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        Text("4s", modifier = Modifier.weight(0.7f), fontSize = 11.sp, fontWeight = FontWeight.Bold, textAlign = TextAlign.End, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        Text("6s", modifier = Modifier.weight(0.7f), fontSize = 11.sp, fontWeight = FontWeight.Bold, textAlign = TextAlign.End, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        Text("SR", modifier = Modifier.weight(1.2f), fontSize = 11.sp, fontWeight = FontWeight.Bold, textAlign = TextAlign.End, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }

                    HorizontalDivider(color = MaterialTheme.colorScheme.surfaceVariant)

                    // Batting rows
                    battingTeam.players.forEach { player ->
                        val stat = currentInn?.battingScorecard?.get(player.id)
                        val isBatting = player.id == currentInn?.currentStrikerId || player.id == currentInn?.currentNonStrikerId

                        if (stat != null || isBatting) {
                            val runs = stat?.runs ?: 0
                            val balls = stat?.balls ?: 0
                            val fours = stat?.fours ?: 0
                            val sixes = stat?.sixes ?: 0
                            val sr = if (balls > 0) String.format("%.1f", (runs.toDouble() / balls) * 100) else "0.0"
                            val dismissal = stat?.dismissalInfo ?: if (isBatting) "not out" else "did not bat"

                            Row(
                                modifier = Modifier.fillMaxWidth().padding(vertical = 6.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Column(modifier = Modifier.weight(2.5f)) {
                                    Text(
                                        text = "${player.name}${if (player.id == currentInn?.currentStrikerId) "*" else ""}",
                                        fontSize = 13.sp,
                                        fontWeight = FontWeight.SemiBold,
                                        color = MaterialTheme.colorScheme.onSurface
                                    )
                                    Text(
                                        text = dismissal,
                                        fontSize = 10.sp,
                                        color = if (isBatting) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                }
                                Text(text = runs.toString(), modifier = Modifier.weight(0.7f), fontSize = 13.sp, fontWeight = FontWeight.Bold, textAlign = TextAlign.End, color = MaterialTheme.colorScheme.onSurface)
                                Text(text = balls.toString(), modifier = Modifier.weight(0.7f), fontSize = 13.sp, textAlign = TextAlign.End, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                Text(text = fours.toString(), modifier = Modifier.weight(0.7f), fontSize = 13.sp, textAlign = TextAlign.End, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                Text(text = sixes.toString(), modifier = Modifier.weight(0.7f), fontSize = 13.sp, textAlign = TextAlign.End, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                Text(text = sr, modifier = Modifier.weight(1.2f), fontSize = 12.sp, textAlign = TextAlign.End, color = MaterialTheme.colorScheme.onSurfaceVariant)
                            }
                        }
                    }

                    HorizontalDivider(color = MaterialTheme.colorScheme.surfaceVariant, modifier = Modifier.padding(vertical = 6.dp))

                    // Extras row
                    val extrasTotal = (currentInn?.wides ?: 0) + (currentInn?.noBalls ?: 0) + (currentInn?.byes ?: 0) + (currentInn?.legByes ?: 0)
                    Row(
                        modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text(
                            text = "Extras (w ${currentInn?.wides ?: 0}, nb ${currentInn?.noBalls ?: 0}, b ${currentInn?.byes ?: 0}, lb ${currentInn?.legByes ?: 0})",
                            fontSize = 12.sp,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        Text(
                            text = "$extrasTotal",
                            fontSize = 13.sp,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onSurface
                        )
                    }

                    // Total score row
                    Row(
                        modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text(
                            text = "Total (${currentInn?.totalWickets ?: 0} wickets, ${currentInn?.oversFormatted ?: "0.0"} overs)",
                            fontSize = 13.sp,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onSurface
                        )
                        Text(
                            text = "${currentInn?.totalRuns ?: 0}",
                            fontSize = 16.sp,
                            fontWeight = FontWeight.Black,
                            color = MaterialTheme.colorScheme.primary
                        )
                    }
                }
            }
        }

        // Bowling Scorecard Section
        item {
            Text(
                text = "BOWLING SCORECARD",
                style = MaterialTheme.typography.labelSmall,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.primary
            )
        }

        item {
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                shape = RoundedCornerShape(12.dp)
            ) {
                Column(modifier = Modifier.padding(12.dp)) {
                    // Bowling Table Header
                    Row(
                        modifier = Modifier.fillMaxWidth().padding(bottom = 8.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text("Bowler", modifier = Modifier.weight(2.5f), fontSize = 11.sp, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        Text("O", modifier = Modifier.weight(0.7f), fontSize = 11.sp, fontWeight = FontWeight.Bold, textAlign = TextAlign.End, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        Text("M", modifier = Modifier.weight(0.7f), fontSize = 11.sp, fontWeight = FontWeight.Bold, textAlign = TextAlign.End, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        Text("R", modifier = Modifier.weight(0.7f), fontSize = 11.sp, fontWeight = FontWeight.Bold, textAlign = TextAlign.End, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        Text("W", modifier = Modifier.weight(0.7f), fontSize = 11.sp, fontWeight = FontWeight.Bold, textAlign = TextAlign.End, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        Text("Econ", modifier = Modifier.weight(1.2f), fontSize = 11.sp, fontWeight = FontWeight.Bold, textAlign = TextAlign.End, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }

                    HorizontalDivider(color = MaterialTheme.colorScheme.surfaceVariant)

                    // Bowling rows
                    bowlingTeam.players.forEach { player ->
                        val stat = currentInn?.bowlingScorecard?.get(player.id)
                        if (stat != null && stat.legalBallsBowled > 0) {
                            Row(
                                modifier = Modifier.fillMaxWidth().padding(vertical = 6.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(
                                    text = player.name,
                                    modifier = Modifier.weight(2.5f),
                                    fontSize = 13.sp,
                                    fontWeight = FontWeight.SemiBold,
                                    color = MaterialTheme.colorScheme.onSurface
                                )
                                Text(text = stat.oversString, modifier = Modifier.weight(0.7f), fontSize = 13.sp, textAlign = TextAlign.End, color = MaterialTheme.colorScheme.onSurface)
                                Text(text = stat.maidens.toString(), modifier = Modifier.weight(0.7f), fontSize = 13.sp, textAlign = TextAlign.End, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                Text(text = stat.runsConceded.toString(), modifier = Modifier.weight(0.7f), fontSize = 13.sp, textAlign = TextAlign.End, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                Text(text = stat.wickets.toString(), modifier = Modifier.weight(0.7f), fontSize = 13.sp, fontWeight = FontWeight.Bold, textAlign = TextAlign.End, color = MaterialTheme.colorScheme.primary)
                                Text(text = String.format("%.1f", stat.economy), modifier = Modifier.weight(1.2f), fontSize = 12.sp, textAlign = TextAlign.End, color = MaterialTheme.colorScheme.onSurfaceVariant)
                            }
                        }
                    }
                }
            }
        }

        // Fall of Wickets
        currentInn?.let { inn ->
            if (inn.fallOfWickets.isNotEmpty()) {
                item {
                    Text(
                        text = "FALL OF WICKETS",
                        style = MaterialTheme.typography.labelSmall,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.primary
                    )
                }

                items(inn.fallOfWickets) { fow ->
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                        shape = RoundedCornerShape(8.dp)
                    ) {
                        Row(
                            modifier = Modifier.padding(10.dp).fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text(
                                text = "${fow.wicketNumber}-${fow.score} (${fow.playerName})",
                                fontSize = 13.sp,
                                fontWeight = FontWeight.Medium,
                                color = MaterialTheme.colorScheme.onSurface
                            )
                            Text(
                                text = "${fow.over} ov",
                                fontSize = 12.sp,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }
                }
            }
        }
    }
}
