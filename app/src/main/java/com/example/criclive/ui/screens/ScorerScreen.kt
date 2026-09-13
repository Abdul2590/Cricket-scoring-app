package com.example.criclive.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.criclive.engine.CricketEngine
import com.example.criclive.model.*

@Composable
fun ScorerScreen(
    match: Match?,
    onRecordBall: (runs: Int, isExtra: Boolean, extraType: ExtraType?, extraRuns: Int, isWicket: Boolean, wicketType: DismissalType?, fielder: String?, nextBatsmanId: String?) -> Unit,
    onSwapStrikers: () -> Unit,
    onChangeBowler: (String) -> Unit,
    onUndoBall: () -> Unit,
    onViewScorecard: () -> Unit
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
    if (currentInn == null) {
        Box(
            modifier = Modifier.fillMaxSize().background(MaterialTheme.colorScheme.background),
            contentAlignment = Alignment.Center
        ) {
            Text("Innings not initialized.", color = MaterialTheme.colorScheme.onBackground)
        }
        return
    }

    var showWicketDialog by remember { mutableStateOf(false) }
    var showBowlerDialog by remember { mutableStateOf(false) }
    var selectedExtraType by remember { mutableStateOf<ExtraType?>(null) }
    var extraRunsCount by remember { mutableIntStateOf(0) }

    val battingTeam = match.battingTeam
    val bowlingTeam = match.bowlingTeam

    val striker = battingTeam.players.find { it.id == currentInn.currentStrikerId }
    val strikerStats = currentInn.battingScorecard[currentInn.currentStrikerId]
    val nonStriker = battingTeam.players.find { it.id == currentInn.currentNonStrikerId }
    val nonStrikerStats = currentInn.battingScorecard[currentInn.currentNonStrikerId]
    val bowler = bowlingTeam.players.find { it.id == currentInn.currentBowlerId }
    val bowlerStats = currentInn.bowlingScorecard[currentInn.currentBowlerId]

    val crr = CricketEngine.calculateCRR(currentInn.totalRuns, currentInn.legalBallsBowled)
    val rrr = if (match.target != null) {
        val ballsLeft = (currentInn.totalOversLimit * 6) - currentInn.legalBallsBowled
        CricketEngine.calculateRRR(match.target, currentInn.totalRuns, ballsLeft)
    } else null

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .verticalScroll(rememberScrollState())
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        // Score Header Card
        Card(
            modifier = Modifier.fillMaxWidth().testTag("scorer_score_header"),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
            shape = RoundedCornerShape(16.dp)
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "${battingTeam.name} Innings",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                    Surface(
                        color = MaterialTheme.colorScheme.primaryContainer,
                        shape = RoundedCornerShape(6.dp)
                    ) {
                        Text(
                            text = "CRR: $crr",
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onPrimaryContainer,
                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp)
                        )
                    }
                }

                Spacer(modifier = Modifier.height(8.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.Bottom
                ) {
                    Text(
                        text = "${currentInn.totalRuns}/${currentInn.totalWickets}",
                        fontSize = 38.sp,
                        fontWeight = FontWeight.Black,
                        color = MaterialTheme.colorScheme.primary
                    )
                    Column(horizontalAlignment = Alignment.End) {
                        Text(
                            text = "Overs: ${currentInn.oversFormatted} / ${currentInn.totalOversLimit}",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.SemiBold,
                            color = MaterialTheme.colorScheme.onSurface
                        )
                        if (rrr != null) {
                            Text(
                                text = "Req RR: $rrr (Target: ${match.target})",
                                fontSize = 12.sp,
                                color = MaterialTheme.colorScheme.error,
                                fontWeight = FontWeight.SemiBold
                            )
                        }
                    }
                }
            }
        }

        // Batsmen on Crease Card
        Card(
            modifier = Modifier.fillMaxWidth().testTag("batsmen_crease_card"),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
            shape = RoundedCornerShape(14.dp)
        ) {
            Column(modifier = Modifier.padding(12.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "BATSMEN ON CREASE",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    IconButton(
                        onClick = onSwapStrikers,
                        modifier = Modifier.size(32.dp).testTag("swap_striker_button")
                    ) {
                        Icon(
                            Icons.Default.SwapHoriz,
                            contentDescription = "Swap Strike",
                            tint = MaterialTheme.colorScheme.primary,
                            modifier = Modifier.size(20.dp)
                        )
                    }
                }

                Spacer(modifier = Modifier.height(6.dp))

                // Striker Row
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(8.dp))
                        .background(MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.3f))
                        .padding(horizontal = 10.dp, vertical = 8.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text("🏏", fontSize = 14.sp)
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(
                            text = "${striker?.name ?: "Striker"}*",
                            fontWeight = FontWeight.Bold,
                            fontSize = 14.sp,
                            color = MaterialTheme.colorScheme.onSurface
                        )
                    }
                    Text(
                        text = "${strikerStats?.runs ?: 0} (${strikerStats?.balls ?: 0}b, ${strikerStats?.fours ?: 0}x4, ${strikerStats?.sixes ?: 0}x6)",
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Medium,
                        color = MaterialTheme.colorScheme.primary
                    )
                }

                Spacer(modifier = Modifier.height(6.dp))

                // Non-Striker Row
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 10.dp, vertical = 6.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = nonStriker?.name ?: "Non-Striker",
                        fontSize = 14.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Text(
                        text = "${nonStrikerStats?.runs ?: 0} (${nonStrikerStats?.balls ?: 0}b, ${nonStrikerStats?.fours ?: 0}x4, ${nonStrikerStats?.sixes ?: 0}x6)",
                        fontSize = 13.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
        }

        // Current Bowler Card
        Card(
            modifier = Modifier.fillMaxWidth().testTag("bowler_card"),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
            shape = RoundedCornerShape(14.dp)
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(12.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = "BOWLER",
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Text(
                        text = bowler?.name ?: "Select Bowler",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                    Text(
                        text = "${bowlerStats?.oversString ?: "0.0"} ov • ${bowlerStats?.wickets ?: 0} wkt • ${bowlerStats?.runsConceded ?: 0} runs • Econ: ${String.format("%.1f", bowlerStats?.economy ?: 0.0)}",
                        fontSize = 12.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }

                FilledTonalButton(
                    onClick = { showBowlerDialog = true },
                    modifier = Modifier.testTag("change_bowler_button"),
                    shape = RoundedCornerShape(8.dp)
                ) {
                    Text("Change", fontSize = 12.sp)
                }
            }
        }

        // Keypad Section - Runs
        Text(
            text = "RUNS OFF BAT",
            style = MaterialTheme.typography.labelSmall,
            fontWeight = FontWeight.Bold,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            listOf(0, 1, 2, 3, 4, 6).forEach { run ->
                Button(
                    onClick = {
                        if (selectedExtraType != null) {
                            onRecordBall(0, true, selectedExtraType, run, false, null, null, null)
                            selectedExtraType = null
                        } else {
                            onRecordBall(run, false, null, 0, false, null, null, null)
                        }
                    },
                    modifier = Modifier
                        .weight(1f)
                        .height(52.dp)
                        .testTag("run_btn_$run"),
                    shape = RoundedCornerShape(12.dp),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = when (run) {
                            4 -> MaterialTheme.colorScheme.primary
                            6 -> Color(0xFF8B5CF6)
                            0 -> Color(0xFF334155)
                            else -> MaterialTheme.colorScheme.surfaceVariant
                        },
                        contentColor = Color.White
                    )
                ) {
                    Text(
                        text = run.toString(),
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
            }
        }

        // Extras Row
        Text(
            text = "EXTRAS & SPECIAL",
            style = MaterialTheme.typography.labelSmall,
            fontWeight = FontWeight.Bold,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            ExtraButton(
                label = "WD",
                fullName = "Wide",
                isSelected = selectedExtraType == ExtraType.WIDE,
                onClick = {
                    onRecordBall(0, true, ExtraType.WIDE, 0, false, null, null, null)
                },
                modifier = Modifier.weight(1f).testTag("extra_wide")
            )
            ExtraButton(
                label = "NB",
                fullName = "No Ball",
                isSelected = selectedExtraType == ExtraType.NO_BALL,
                onClick = {
                    onRecordBall(0, true, ExtraType.NO_BALL, 0, false, null, null, null)
                },
                modifier = Modifier.weight(1f).testTag("extra_noball")
            )
            ExtraButton(
                label = "BYE",
                fullName = "Bye",
                isSelected = selectedExtraType == ExtraType.BYE,
                onClick = {
                    onRecordBall(0, true, ExtraType.BYE, 1, false, null, null, null)
                },
                modifier = Modifier.weight(1f).testTag("extra_bye")
            )
            ExtraButton(
                label = "LB",
                fullName = "Leg Bye",
                isSelected = selectedExtraType == ExtraType.LEG_BYE,
                onClick = {
                    onRecordBall(0, true, ExtraType.LEG_BYE, 1, false, null, null, null)
                },
                modifier = Modifier.weight(1f).testTag("extra_legbye")
            )
        }

        // Wicket & Action Buttons
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Button(
                onClick = { showWicketDialog = true },
                modifier = Modifier
                    .weight(1.5f)
                    .height(52.dp)
                    .testTag("wicket_button"),
                colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.error),
                shape = RoundedCornerShape(12.dp)
            ) {
                Icon(Icons.Default.Close, contentDescription = "Wicket")
                Spacer(modifier = Modifier.width(6.dp))
                Text("WICKET!", fontWeight = FontWeight.Bold, fontSize = 16.sp)
            }

            OutlinedButton(
                onClick = onUndoBall,
                modifier = Modifier
                    .weight(1f)
                    .height(52.dp)
                    .testTag("undo_ball_button"),
                shape = RoundedCornerShape(12.dp)
            ) {
                Icon(Icons.Default.Undo, contentDescription = "Undo")
                Spacer(modifier = Modifier.width(4.dp))
                Text("Undo")
            }
        }
    }

    // Wicket Dialog
    if (showWicketDialog) {
        var selectedDismissal by remember { mutableStateOf(DismissalType.CAUGHT) }
        var fielder by remember { mutableStateOf("") }
        var nextBatsman by remember { mutableStateOf("") }

        val remainingBatsmen = battingTeam.players.filter { p ->
            val stat = currentInn.battingScorecard[p.id]
            p.id != currentInn.currentStrikerId && p.id != currentInn.currentNonStrikerId && (stat == null || !stat.isOut)
        }

        AlertDialog(
            onDismissRequest = { showWicketDialog = false },
            title = { Text("Fall of Wicket") },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Text("Dismissal Method:", fontWeight = FontWeight.SemiBold, fontSize = 13.sp)
                    DismissalType.entries.chunked(3).forEach { row ->
                        Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                            row.forEach { d ->
                                FilterChip(
                                    selected = selectedDismissal == d,
                                    onClick = { selectedDismissal = d },
                                    label = { Text(d.label, fontSize = 11.sp) },
                                    modifier = Modifier.weight(1f)
                                )
                            }
                        }
                    }

                    if (selectedDismissal == DismissalType.CAUGHT || selectedDismissal == DismissalType.RUN_OUT || selectedDismissal == DismissalType.STUMPED) {
                        OutlinedTextField(
                            value = fielder,
                            onValueChange = { fielder = it },
                            label = { Text("Fielder Name") },
                            modifier = Modifier.fillMaxWidth()
                        )
                    }

                    if (remainingBatsmen.isNotEmpty()) {
                        Text("Next Batsman:", fontWeight = FontWeight.SemiBold, fontSize = 13.sp)
                        Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                            remainingBatsmen.take(4).forEach { p ->
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .clip(RoundedCornerShape(6.dp))
                                        .background(if (nextBatsman == p.id) MaterialTheme.colorScheme.primaryContainer else MaterialTheme.colorScheme.surfaceVariant)
                                        .clickable { nextBatsman = p.id }
                                        .padding(8.dp),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Text(p.name, fontSize = 13.sp, fontWeight = FontWeight.Medium)
                                }
                            }
                        }
                    }
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        onRecordBall(
                            0,
                            false,
                            null,
                            0,
                            true,
                            selectedDismissal,
                            fielder.ifBlank { null },
                            nextBatsman.ifBlank { null }
                        )
                        showWicketDialog = false
                    },
                    modifier = Modifier.testTag("confirm_wicket_button")
                ) {
                    Text("Record Out")
                }
            },
            dismissButton = {
                TextButton(onClick = { showWicketDialog = false }) {
                    Text("Cancel")
                }
            }
        )
    }

    // Change Bowler Dialog
    if (showBowlerDialog) {
        val eligibleBowlers = bowlingTeam.players.filter { it.id != currentInn.currentBowlerId }

        AlertDialog(
            onDismissRequest = { showBowlerDialog = false },
            title = { Text("Select Next Bowler") },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    eligibleBowlers.forEach { player ->
                        val bStats = currentInn.bowlingScorecard[player.id]
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(8.dp))
                                .background(MaterialTheme.colorScheme.surfaceVariant)
                                .clickable {
                                    onChangeBowler(player.id)
                                    showBowlerDialog = false
                                }
                                .padding(12.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column {
                                Text(player.name, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                                Text(player.role.label, fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                            }
                            Text(
                                text = "${bStats?.oversString ?: "0.0"} ov",
                                fontSize = 12.sp,
                                fontWeight = FontWeight.SemiBold,
                                color = MaterialTheme.colorScheme.primary
                            )
                        }
                    }
                }
            },
            confirmButton = {},
            dismissButton = {
                TextButton(onClick = { showBowlerDialog = false }) {
                    Text("Close")
                }
            }
        )
    }
}

@Composable
fun ExtraButton(
    label: String,
    fullName: String,
    isSelected: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    OutlinedButton(
        onClick = onClick,
        modifier = modifier.height(44.dp),
        shape = RoundedCornerShape(10.dp),
        colors = ButtonDefaults.outlinedButtonColors(
            containerColor = if (isSelected) MaterialTheme.colorScheme.primary.copy(alpha = 0.2f) else Color.Transparent
        )
    ) {
        Text(
            text = label,
            fontSize = 13.sp,
            fontWeight = FontWeight.Bold,
            color = MaterialTheme.colorScheme.onSurface
        )
    }
}
