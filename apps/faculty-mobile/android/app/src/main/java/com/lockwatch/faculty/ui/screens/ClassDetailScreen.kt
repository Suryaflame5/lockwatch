package com.lockwatch.faculty.ui.screens

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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.lockwatch.faculty.data.*
import com.lockwatch.faculty.ui.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ClassDetailScreen(
    cls: AcademicClass,
    onBack: () -> Unit,
    onSessionSelected: (Session) -> Unit
) {
    val scope = rememberCoroutineScope()
    var sessions by remember { mutableStateOf<List<Session>>(emptyList()) }
    var roster by remember { mutableStateOf<List<RosterStudent>>(emptyList()) }
    var loading by remember { mutableStateOf(true) }
    var selectedTab by remember { mutableStateOf(0) }
    var showCreateSession by remember { mutableStateOf(false) }
    var newSessionName by remember { mutableStateOf("") }
    var creating by remember { mutableStateOf(false) }

    fun load() {
        scope.launch {
            loading = true
            try {
                sessions = withContext(Dispatchers.IO) { FacultyApiClient.getSessions(cls.id) }
                roster = withContext(Dispatchers.IO) { FacultyApiClient.getRoster(cls.id) }
            } catch (_: Exception) {
            } finally {
                loading = false
            }
        }
    }

    LaunchedEffect(Unit) { load() }

    Scaffold(
        containerColor = BgDark,
        topBar = {
            TopAppBar(
                title = { Text(cls.name, color = TextPrimary, fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back", tint = TextPrimary)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = SurfaceDark),
                actions = {
                    if (selectedTab == 0) {
                        IconButton(onClick = { showCreateSession = true }) {
                            Icon(Icons.Default.Add, contentDescription = "New Session", tint = TealAccent)
                        }
                    }
                }
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .background(BgDark)
        ) {
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp),
                shape = RoundedCornerShape(12.dp),
                colors = CardDefaults.cardColors(containerColor = NavyBlue.copy(alpha = 0.5f))
            ) {
                Row(
                    modifier = Modifier.padding(16.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text("Join Code", color = TextSecondary, fontSize = 12.sp)
                        Text(cls.joinCode, color = TealAccent, fontWeight = FontWeight.Bold, fontSize = 24.sp)
                    }
                    Column(horizontalAlignment = Alignment.End) {
                        Text("Subject", color = TextSecondary, fontSize = 12.sp)
                        Text(cls.subject, color = TextPrimary, fontWeight = FontWeight.SemiBold)
                        Text("${roster.size} students", color = TextSecondary, fontSize = 12.sp)
                    }
                }
            }

            TabRow(selectedTabIndex = selectedTab, containerColor = SurfaceDark, contentColor = RoyalBlue) {
                Tab(
                    selected = selectedTab == 0,
                    onClick = { selectedTab = 0 },
                    text = { Text("Sessions", color = if (selectedTab == 0) RoyalBlue else TextSecondary) }
                )
                Tab(
                    selected = selectedTab == 1,
                    onClick = { selectedTab = 1 },
                    text = { Text("Roster (${roster.size})", color = if (selectedTab == 1) RoyalBlue else TextSecondary) }
                )
            }

            if (loading) {
                CircularProgressIndicator(
                    modifier = Modifier
                        .align(Alignment.CenterHorizontally)
                        .padding(32.dp),
                    color = RoyalBlue
                )
            } else when (selectedTab) {
                0 -> {
                    if (sessions.isEmpty()) {
                        Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                Icon(Icons.Default.Event, contentDescription = null, tint = TextSecondary, modifier = Modifier.size(48.dp))
                                Spacer(Modifier.height(8.dp))
                                Text("No sessions yet", color = TextSecondary)
                            }
                        }
                    } else {
                        LazyColumn(contentPadding = PaddingValues(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                            items(sessions) { session ->
                                SessionCard(session = session, onClick = { onSessionSelected(session) })
                            }
                        }
                    }
                }
                1 -> {
                    if (roster.isEmpty()) {
                        Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                            Text("No students enrolled", color = TextSecondary)
                        }
                    } else {
                        LazyColumn(contentPadding = PaddingValues(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                            items(roster) { student ->
                                Card(
                                    modifier = Modifier.fillMaxWidth(),
                                    shape = RoundedCornerShape(8.dp),
                                    colors = CardDefaults.cardColors(containerColor = CardDark)
                                ) {
                                    Row(modifier = Modifier.padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
                                        Icon(Icons.Default.Person, contentDescription = null, tint = RoyalBlue, modifier = Modifier.size(24.dp))
                                        Spacer(Modifier.width(12.dp))
                                        Column {
                                            Text(student.name, color = TextPrimary, fontWeight = FontWeight.Medium)
                                            student.registerNumber?.let { Text(it, color = TextSecondary, fontSize = 12.sp) }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    if (showCreateSession) {
        AlertDialog(
            onDismissRequest = { showCreateSession = false },
            containerColor = CardDark,
            title = { Text("New Session", color = TextPrimary) },
            text = {
                OutlinedTextField(
                    value = newSessionName,
                    onValueChange = { newSessionName = it },
                    label = { Text("Session Name", color = TextSecondary) },
                    modifier = Modifier.fillMaxWidth(),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedTextColor = TextPrimary,
                        unfocusedTextColor = TextPrimary,
                        focusedBorderColor = RoyalBlue,
                        unfocusedBorderColor = TextSecondary
                    )
                )
            },
            confirmButton = {
                Button(
                    onClick = {
                        scope.launch {
                            creating = true
                            try {
                                val s = withContext(Dispatchers.IO) { FacultyApiClient.createSession(cls.id, newSessionName) }
                                sessions = sessions + s
                                showCreateSession = false
                                newSessionName = ""
                                onSessionSelected(s)
                            } catch (_: Exception) {
                            } finally {
                                creating = false
                            }
                        }
                    },
                    enabled = !creating && newSessionName.isNotBlank(),
                    colors = ButtonDefaults.buttonColors(containerColor = RoyalBlue)
                ) {
                    Text("Create")
                }
            },
            dismissButton = {
                TextButton(onClick = { showCreateSession = false }) {
                    Text("Cancel", color = TextSecondary)
                }
            }
        )
    }
}

@Composable
fun SessionCard(session: Session, onClick: () -> Unit) {
    val statusColor = when (session.status) {
        "active" -> SuccessGreen
        "paused" -> WarningOrange
        "ended" -> TextSecondary
        else -> TextSecondary
    }
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick),
        shape = RoundedCornerShape(10.dp),
        colors = CardDefaults.cardColors(containerColor = CardDark)
    ) {
        Row(modifier = Modifier.padding(14.dp), verticalAlignment = Alignment.CenterVertically) {
            Column(modifier = Modifier.weight(1f)) {
                Text(session.name, color = TextPrimary, fontWeight = FontWeight.Medium)
                Text("Code: ${session.joinCode}", color = TealAccent, fontSize = 12.sp)
            }
            Surface(shape = RoundedCornerShape(6.dp), color = statusColor.copy(alpha = 0.15f)) {
                Text(
                    session.status.uppercase(),
                    color = statusColor,
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                )
            }
            Spacer(Modifier.width(8.dp))
            Icon(Icons.Default.ChevronRight, contentDescription = null, tint = TextSecondary)
        }
    }
}
