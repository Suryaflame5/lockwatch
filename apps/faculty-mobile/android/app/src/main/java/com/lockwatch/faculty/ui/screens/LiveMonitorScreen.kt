package com.lockwatch.faculty.ui.screens

import androidx.compose.foundation.background
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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.lockwatch.faculty.data.*
import com.lockwatch.faculty.ui.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun LiveMonitorScreen(
    session: Session,
    onBack: () -> Unit
) {
    val scope = rememberCoroutineScope()
    var participants by remember { mutableStateOf<List<SessionParticipant>>(emptyList()) }
    var currentSession by remember { mutableStateOf(session) }
    var loading by remember { mutableStateOf(true) }
    var actionLoading by remember { mutableStateOf(false) }

    fun refreshParticipants() {
        scope.launch {
            try {
                participants = withContext(Dispatchers.IO) { FacultyApiClient.getLiveParticipants(session.id) }
            } catch (_: Exception) {
            } finally {
                loading = false
            }
        }
    }

    LaunchedEffect(Unit) {
        refreshParticipants()
        while (true) {
            delay(3000)
            refreshParticipants()
        }
    }

    Scaffold(
        containerColor = BgDark,
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text(session.name, color = TextPrimary, fontWeight = FontWeight.Bold)
                        Text("Live Monitor", color = TealAccent, fontSize = 12.sp)
                    }
                },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back", tint = TextPrimary)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = SurfaceDark),
                actions = {
                    IconButton(onClick = { refreshParticipants() }) {
                        Icon(Icons.Default.Refresh, contentDescription = "Refresh", tint = TextSecondary)
                    }
                }
            )
        },
        bottomBar = {
            Surface(color = SurfaceDark) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(12.dp),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    val isActive = currentSession.status == "active"
                    val isPaused = currentSession.status == "paused"

                    if (!isActive && !isPaused) {
                        Button(
                            onClick = {
                                scope.launch {
                                    actionLoading = true
                                    try {
                                        withContext(Dispatchers.IO) { FacultyApiClient.startSession(session.id) }
                                        currentSession = currentSession.copy(status = "active")
                                    } catch (_: Exception) {
                                    } finally {
                                        actionLoading = false
                                    }
                                }
                            },
                            modifier = Modifier.weight(1f),
                            colors = ButtonDefaults.buttonColors(containerColor = SuccessGreen),
                            enabled = !actionLoading
                        ) {
                            Text("Start", color = Color.White, fontWeight = FontWeight.Bold)
                        }
                    }
                    if (isActive) {
                        Button(
                            onClick = {
                                scope.launch {
                                    actionLoading = true
                                    try {
                                        withContext(Dispatchers.IO) { FacultyApiClient.pauseSession(session.id) }
                                        currentSession = currentSession.copy(status = "paused")
                                    } catch (_: Exception) {
                                    } finally {
                                        actionLoading = false
                                    }
                                }
                            },
                            modifier = Modifier.weight(1f),
                            colors = ButtonDefaults.buttonColors(containerColor = WarningOrange),
                            enabled = !actionLoading
                        ) {
                            Text("Pause", color = Color.White, fontWeight = FontWeight.Bold)
                        }
                    }
                    if (isPaused) {
                        Button(
                            onClick = {
                                scope.launch {
                                    actionLoading = true
                                    try {
                                        withContext(Dispatchers.IO) { FacultyApiClient.resumeSession(session.id) }
                                        currentSession = currentSession.copy(status = "active")
                                    } catch (_: Exception) {
                                    } finally {
                                        actionLoading = false
                                    }
                                }
                            },
                            modifier = Modifier.weight(1f),
                            colors = ButtonDefaults.buttonColors(containerColor = TealAccent),
                            enabled = !actionLoading
                        ) {
                            Text("Resume", color = Color.White, fontWeight = FontWeight.Bold)
                        }
                    }
                    if (isActive || isPaused) {
                        Button(
                            onClick = {
                                scope.launch {
                                    actionLoading = true
                                    try {
                                        withContext(Dispatchers.IO) { FacultyApiClient.endSession(session.id) }
                                        currentSession = currentSession.copy(status = "ended")
                                        onBack()
                                    } catch (_: Exception) {
                                    } finally {
                                        actionLoading = false
                                    }
                                }
                            },
                            modifier = Modifier.weight(1f),
                            colors = ButtonDefaults.buttonColors(containerColor = AlertRed),
                            enabled = !actionLoading
                        ) {
                            Text("End", color = Color.White, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .background(BgDark)
        ) {
            val lockedCount = participants.count { it.deviceLocked }
            val onlineCount = participants.count { it.status == "active" }
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                StatChip(label = "Online", value = "$onlineCount", color = SuccessGreen, modifier = Modifier.weight(1f))
                StatChip(label = "Locked", value = "$lockedCount", color = TealAccent, modifier = Modifier.weight(1f))
                StatChip(label = "Total", value = "${participants.size}", color = RoyalBlue, modifier = Modifier.weight(1f))
            }

            if (loading && participants.isEmpty()) {
                CircularProgressIndicator(
                    modifier = Modifier
                        .align(Alignment.CenterHorizontally)
                        .padding(32.dp),
                    color = RoyalBlue
                )
            } else if (participants.isEmpty()) {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Icon(Icons.Default.Group, contentDescription = null, tint = TextSecondary, modifier = Modifier.size(48.dp))
                        Spacer(Modifier.height(8.dp))
                        Text("Waiting for students to join...", color = TextSecondary)
                    }
                }
            } else {
                LazyColumn(
                    contentPadding = PaddingValues(horizontal = 16.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    items(participants) { p -> ParticipantCard(p) }
                }
            }
        }
    }
}

@Composable
fun StatChip(label: String, value: String, color: Color, modifier: Modifier = Modifier) {
    Card(
        modifier = modifier,
        shape = RoundedCornerShape(10.dp),
        colors = CardDefaults.cardColors(containerColor = CardDark)
    ) {
        Column(
            modifier = Modifier.padding(12.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(value, color = color, fontWeight = FontWeight.Bold, fontSize = 22.sp)
            Text(label, color = TextSecondary, fontSize = 11.sp)
        }
    }
}

@Composable
fun ParticipantCard(p: SessionParticipant) {
    val statusColor = when {
        p.deviceLocked -> SuccessGreen
        p.status == "active" -> WarningOrange
        else -> TextSecondary
    }
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(10.dp),
        colors = CardDefaults.cardColors(containerColor = CardDark)
    ) {
        Row(modifier = Modifier.padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
            Box(
                modifier = Modifier
                    .size(10.dp)
                    .background(statusColor, RoundedCornerShape(5.dp))
            )
            Spacer(Modifier.width(12.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(p.studentName, color = TextPrimary, fontWeight = FontWeight.Medium)
                p.registerNumber?.let { Text(it, color = TextSecondary, fontSize = 12.sp) }
            }
            Column(horizontalAlignment = Alignment.End) {
                p.batteryLevel?.let {
                    Text(
                        "🔋 $it%",
                        color = if (it < 20) WarningOrange else TextSecondary,
                        fontSize = 12.sp
                    )
                }
                Text(
                    if (p.deviceLocked) "LOCKED" else "UNLOCKED",
                    color = statusColor,
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold
                )
            }
        }
    }
}
