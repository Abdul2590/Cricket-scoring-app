package com.example.criclive.ui.screens

import androidx.compose.foundation.background
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
import androidx.compose.runtime.*
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
fun TeamsScreen(
    teams: List<Team>,
    onAddPlayer: (teamId: String, name: String, role: PlayerRole) -> Unit,
    onAddCustomTeam: (Team) -> Unit
) {
    var selectedTeamId by remember { mutableStateOf(teams.firstOrNull()?.id ?: "") }
    var showAddPlayerDialog by remember { mutableStateOf(false) }
    var showAddTeamDialog by remember { mutableStateOf(false) }

    val currentTeam = teams.find { it.id == selectedTeamId } ?: teams.firstOrNull()

    Scaffold(
        floatingActionButton = {
            FloatingActionButton(
                onClick = { showAddPlayerDialog = true },
                containerColor = MaterialTheme.colorScheme.primary,
                contentColor = Color.White,
                modifier = Modifier.testTag("add_player_fab")
            ) {
                Icon(Icons.Default.PersonAdd, contentDescription = "Add Player")
            }
        }
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .background(MaterialTheme.colorScheme.background)
                .padding(innerPadding)
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Teams & Squads",
                    style = MaterialTheme.typography.headlineMedium,
                    color = MaterialTheme.colorScheme.onBackground
                )
                OutlinedButton(
                    onClick = { showAddTeamDialog = true },
                    shape = RoundedCornerShape(8.dp)
                ) {
                    Icon(Icons.Default.Add, contentDescription = "New Team", modifier = Modifier.size(16.dp))
                    Spacer(modifier = Modifier.width(4.dp))
                    Text("New Team", fontSize = 12.sp)
                }
            }

            // Teams Horizontal Selector
            LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                items(teams) { team ->
                    val isSelected = team.id == selectedTeamId
                    FilterChip(
                        selected = isSelected,
                        onClick = { selectedTeamId = team.id },
                        label = { Text(team.name, fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal) },
                        modifier = Modifier.testTag("team_chip_${team.id}")
                    )
                }
            }

            if (currentTeam != null) {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    shape = RoundedCornerShape(14.dp)
                ) {
                    Row(
                        modifier = Modifier.padding(16.dp).fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Text(
                                text = currentTeam.name,
                                style = MaterialTheme.typography.titleLarge,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.onSurface
                            )
                            Text(
                                text = "${currentTeam.players.size} Players Registered",
                                fontSize = 12.sp,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }

                        Surface(
                            color = MaterialTheme.colorScheme.primaryContainer,
                            shape = RoundedCornerShape(8.dp)
                        ) {
                            Text(
                                text = currentTeam.shortName,
                                fontSize = 14.sp,
                                fontWeight = FontWeight.ExtraBold,
                                color = MaterialTheme.colorScheme.onPrimaryContainer,
                                modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp)
                            )
                        }
                    }
                }

                Text(
                    text = "PLAYERS SQUAD",
                    style = MaterialTheme.typography.labelSmall,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.primary
                )

                LazyColumn(
                    modifier = Modifier.fillMaxWidth().weight(1f),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    items(currentTeam.players) { player ->
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                            shape = RoundedCornerShape(10.dp)
                        ) {
                            Row(
                                modifier = Modifier.padding(12.dp).fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Box(
                                        modifier = Modifier
                                            .size(32.dp)
                                            .clip(CircleShape)
                                            .background(MaterialTheme.colorScheme.surfaceVariant),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        Text(
                                            text = when (player.role) {
                                                PlayerRole.BATSMAN -> "🏏"
                                                PlayerRole.BOWLER -> "⚾"
                                                PlayerRole.ALL_ROUNDER -> "⚡"
                                                PlayerRole.WICKET_KEEPER -> "🧤"
                                            },
                                            fontSize = 14.sp
                                        )
                                    }
                                    Spacer(modifier = Modifier.width(10.dp))
                                    Column {
                                        Text(
                                            text = "${player.name}${if (player.isCaptain) " (C)" else ""}${if (player.isWicketKeeper) " (WK)" else ""}",
                                            fontWeight = FontWeight.SemiBold,
                                            fontSize = 14.sp,
                                            color = MaterialTheme.colorScheme.onSurface
                                        )
                                        Text(
                                            text = player.role.label,
                                            fontSize = 11.sp,
                                            color = MaterialTheme.colorScheme.onSurfaceVariant
                                        )
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    // Add Player Dialog
    if (showAddPlayerDialog && currentTeam != null) {
        var playerName by remember { mutableStateOf("") }
        var selectedRole by remember { mutableStateOf(PlayerRole.BATSMAN) }

        AlertDialog(
            onDismissRequest = { showAddPlayerDialog = false },
            title = { Text("Add Player to ${currentTeam.name}") },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    OutlinedTextField(
                        value = playerName,
                        onValueChange = { playerName = it },
                        label = { Text("Player Full Name") },
                        modifier = Modifier.fillMaxWidth().testTag("player_name_input")
                    )

                    Text("Player Role:", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                    PlayerRole.entries.forEach { role ->
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(6.dp))
                                .background(if (selectedRole == role) MaterialTheme.colorScheme.primaryContainer else MaterialTheme.colorScheme.surfaceVariant)
                                .clickable { selectedRole = role }
                                .padding(8.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(role.label, fontSize = 13.sp, fontWeight = FontWeight.Medium)
                        }
                    }
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        if (playerName.isNotBlank()) {
                            onAddPlayer(currentTeam.id, playerName, selectedRole)
                            showAddPlayerDialog = false
                        }
                    },
                    modifier = Modifier.testTag("confirm_add_player_button")
                ) {
                    Text("Add Player")
                }
            },
            dismissButton = {
                TextButton(onClick = { showAddPlayerDialog = false }) {
                    Text("Cancel")
                }
            }
        )
    }

    // Add Custom Team Dialog
    if (showAddTeamDialog) {
        var teamName by remember { mutableStateOf("") }
        var shortName by remember { mutableStateOf("") }

        AlertDialog(
            onDismissRequest = { showAddTeamDialog = false },
            title = { Text("Create Custom Team") },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    OutlinedTextField(
                        value = teamName,
                        onValueChange = { teamName = it },
                        label = { Text("Team Name (e.g. South Africa)") },
                        modifier = Modifier.fillMaxWidth().testTag("team_name_input")
                    )
                    OutlinedTextField(
                        value = shortName,
                        onValueChange = { shortName = it.take(4).uppercase() },
                        label = { Text("Short Code (e.g. SA)") },
                        modifier = Modifier.fillMaxWidth().testTag("team_short_name_input")
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        if (teamName.isNotBlank() && shortName.isNotBlank()) {
                            val newTeam = Team(
                                id = "team-${System.currentTimeMillis()}",
                                name = teamName.trim(),
                                shortName = shortName.trim(),
                                color = "#10B981",
                                players = listOf(
                                    Player("p1", "Captain Player", PlayerRole.BATSMAN, isCaptain = true),
                                    Player("p2", "Opening Bowler", PlayerRole.BOWLER)
                                )
                            )
                            onAddCustomTeam(newTeam)
                            selectedTeamId = newTeam.id
                            showAddTeamDialog = false
                        }
                    },
                    modifier = Modifier.testTag("confirm_create_team_button")
                ) {
                    Text("Create Team")
                }
            },
            dismissButton = {
                TextButton(onClick = { showAddTeamDialog = false }) {
                    Text("Cancel")
                }
            }
        )
    }
}
