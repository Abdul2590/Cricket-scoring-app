package com.example.criclive.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.criclive.model.*

@Composable
fun FixturesScreen(
    matches: List<Match>,
    teams: List<Team>,
    activeMatchId: String,
    onSelectMatch: (String) -> Unit,
    onCreateMatch: (title: String, teamAId: String, teamBId: String, format: MatchFormat, overs: Int, venue: String, date: String) -> Unit,
    onDeleteMatch: (String) -> Unit
) {
    var showCreateDialog by remember { mutableStateOf(false) }

    Scaffold(
        floatingActionButton = {
            FloatingActionButton(
                onClick = { showCreateDialog = true },
                containerColor = MaterialTheme.colorScheme.primary,
                contentColor = Color.White,
                modifier = Modifier.testTag("add_match_fab")
            ) {
                Icon(Icons.Default.Add, contentDescription = "Schedule Match")
            }
        }
    ) { innerPadding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .background(MaterialTheme.colorScheme.background)
                .padding(innerPadding)
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Match Fixtures",
                        style = MaterialTheme.typography.headlineMedium,
                        color = MaterialTheme.colorScheme.onBackground
                    )
                    Text(
                        text = "${matches.size} Matches",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }

            items(matches) { match ->
                val isSelected = match.id == activeMatchId
                val inn = match.currentInnings

                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable { onSelectMatch(match.id) }
                        .testTag("fixture_card_${match.id}"),
                    colors = CardDefaults.cardColors(
                        containerColor = if (isSelected) MaterialTheme.colorScheme.surfaceVariant else MaterialTheme.colorScheme.surface
                    ),
                    shape = RoundedCornerShape(16.dp)
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = match.seriesName,
                                fontSize = 12.sp,
                                fontWeight = FontWeight.SemiBold,
                                color = MaterialTheme.colorScheme.primary
                            )
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Surface(
                                    color = if (match.status == MatchStatus.LIVE) Color(0xFFDC2626) else MaterialTheme.colorScheme.surfaceVariant,
                                    shape = RoundedCornerShape(4.dp)
                                ) {
                                    Text(
                                        text = match.status.label,
                                        fontSize = 10.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = Color.White,
                                        modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                                    )
                                }
                                Spacer(modifier = Modifier.width(8.dp))
                                IconButton(
                                    onClick = { onDeleteMatch(match.id) },
                                    modifier = Modifier.size(24.dp)
                                ) {
                                    Icon(
                                        Icons.Default.Delete,
                                        contentDescription = "Delete Match",
                                        tint = MaterialTheme.colorScheme.error,
                                        modifier = Modifier.size(16.dp)
                                    )
                                }
                            }
                        }

                        Spacer(modifier = Modifier.height(10.dp))

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column {
                                Text(
                                    text = "${match.teamA.name} vs ${match.teamB.name}",
                                    style = MaterialTheme.typography.titleMedium,
                                    fontWeight = FontWeight.Bold,
                                    color = MaterialTheme.colorScheme.onSurface
                                )
                                Text(
                                    text = "${match.venue} • ${match.format.displayName} (${match.overs} Ov)",
                                    fontSize = 12.sp,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }

                            if (inn != null) {
                                Column(horizontalAlignment = Alignment.End) {
                                    Text(
                                        text = "${inn.totalRuns}/${inn.totalWickets}",
                                        fontSize = 20.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = MaterialTheme.colorScheme.primary
                                    )
                                    Text(
                                        text = "${inn.oversFormatted} ov",
                                        fontSize = 12.sp,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                }
                            }
                        }

                        if (isSelected) {
                            Spacer(modifier = Modifier.height(8.dp))
                            Text(
                                text = "Currently Selected for Live Scoring",
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.primary
                            )
                        }
                    }
                }
            }
        }
    }

    if (showCreateDialog) {
        var title by remember { mutableStateOf("") }
        var venue by remember { mutableStateOf("") }
        var date by remember { mutableStateOf("Today") }
        var selectedTeamAId by remember { mutableStateOf(teams.getOrNull(0)?.id ?: "") }
        var selectedTeamBId by remember { mutableStateOf(teams.getOrNull(1)?.id ?: "") }
        var selectedFormat by remember { mutableStateOf(MatchFormat.T20) }
        var overs by remember { mutableIntStateOf(20) }

        AlertDialog(
            onDismissRequest = { showCreateDialog = false },
            title = { Text("Schedule New Match") },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    OutlinedTextField(
                        value = title,
                        onValueChange = { title = it },
                        label = { Text("Series / Tournament Title") },
                        modifier = Modifier.fillMaxWidth().testTag("match_title_input")
                    )

                    Text("Team A (Batting First):", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                    teams.chunked(2).forEach { row ->
                        Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                            row.forEach { t ->
                                FilterChip(
                                    selected = selectedTeamAId == t.id,
                                    onClick = { selectedTeamAId = t.id },
                                    label = { Text(t.name, fontSize = 11.sp) },
                                    modifier = Modifier.weight(1f)
                                )
                            }
                        }
                    }

                    Text("Team B (Bowling First):", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                    teams.chunked(2).forEach { row ->
                        Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                            row.forEach { t ->
                                FilterChip(
                                    selected = selectedTeamBId == t.id,
                                    onClick = { selectedTeamBId = t.id },
                                    label = { Text(t.name, fontSize = 11.sp) },
                                    modifier = Modifier.weight(1f)
                                )
                            }
                        }
                    }

                    OutlinedTextField(
                        value = venue,
                        onValueChange = { venue = it },
                        label = { Text("Venue / Ground") },
                        modifier = Modifier.fillMaxWidth()
                    )

                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        MatchFormat.entries.take(4).forEach { fmt ->
                            FilterChip(
                                selected = selectedFormat == fmt,
                                onClick = {
                                    selectedFormat = fmt
                                    overs = fmt.defaultOvers
                                },
                                label = { Text(fmt.displayName, fontSize = 11.sp) },
                                modifier = Modifier.weight(1f)
                            )
                        }
                    }
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        if (selectedTeamAId.isNotBlank() && selectedTeamBId.isNotBlank() && selectedTeamAId != selectedTeamBId) {
                            onCreateMatch(title, selectedTeamAId, selectedTeamBId, selectedFormat, overs, venue, date)
                            showCreateDialog = false
                        }
                    },
                    modifier = Modifier.testTag("confirm_create_match_button")
                ) {
                    Text("Create Match")
                }
            },
            dismissButton = {
                TextButton(onClick = { showCreateDialog = false }) {
                    Text("Cancel")
                }
            }
        )
    }
}
