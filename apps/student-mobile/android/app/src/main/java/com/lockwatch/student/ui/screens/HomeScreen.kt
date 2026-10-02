package com.lockwatch.student.ui.screens

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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.lockwatch.student.data.AcademicClass
import com.lockwatch.student.data.SessionSummary
import com.lockwatch.student.data.StudentApiClient
import com.lockwatch.student.data.User
import com.lockwatch.student.ui.*
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun StudentHomeScreen(
    user: User,
    apiClient: StudentApiClient,
    onStartExam: (SessionSummary) -> Unit,
    onLogout: () -> Unit
) {
    val coroutineScope = rememberCoroutineScope()
    var classes by remember { mutableStateOf<List<AcademicClass>>(emptyList()) }
    var isLoading by remember { mutableStateOf(true) }
    var showJoinDialog by remember { mutableStateOf(false) }
    var classCodeInput by remember { mutableStateOf("") }
    var joinMessage by remember { mutableStateOf<String?>(null) }
    var isJoining by remember { mutableStateOf(false) }

    fun refreshClasses() {
        isLoading = true
        coroutineScope.launch {
            try {
                classes = apiClient.getClasses()
            } catch (e: Exception) {
                // Keep current classes
            } finally {
                isLoading = false
            }
        }
    }

    LaunchedEffect(Unit) {
        refreshClasses()
    }

    val liveSession = classes.firstOrNull { it.activeSession != null && (it.activeSession.status == "ACTIVE" || it.activeSession.status == "READY") }?.activeSession

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text(
                            text = user.name,
                            fontWeight = FontWeight.Bold,
                            fontSize = 16.sp,
                            color = TextPrimary
                        )
                        Text(
                            text = user.studentProfile?.registerNumber ?: "Student",
                            fontSize = 12.sp,
                            color = TextSecondary
                        )
                    }
                },
                actions = {
                    IconButton(onClick = { refreshClasses() }) {
                        Icon(Icons.Default.Refresh, contentDescription = "Refresh", tint = TextSecondary)
                    }
                    IconButton(onClick = onLogout) {
                        Icon(Icons.Default.Logout, contentDescription = "Logout", tint = CrimsonRed)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = SurfaceDark)
            )
        },
        floatingActionButton = {
            FloatingActionButton(
                onClick = { showJoinDialog = true },
                containerColor = EmeraldGreen,
                contentColor = Color.Black
            ) {
                Icon(Icons.Default.Add, contentDescription = "Join Class")
            }
        },
        containerColor = BgDark
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .padding(16.dp)
        ) {
            // Live Session Alert Banner
            if (liveSession != null) {
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(bottom = 16.dp),
                    colors = CardDefaults.cardColors(containerColor = AmberWarning.copy(alpha = 0.15f)),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.Shield, contentDescription = null, tint = AmberWarning, modifier = Modifier.size(24.dp))
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = "EXAMINATION IN PROGRESS",
                                fontWeight = FontWeight.Bold,
                                color = AmberWarning,
                                fontSize = 14.sp
                            )
                        }
                        Spacer(modifier = Modifier.height(6.dp))
                        Text(
                            text = liveSession.name,
                            fontWeight = FontWeight.Bold,
                            color = TextPrimary,
                            fontSize = 16.sp
                        )
                        Text(
                            text = "Duration: ${liveSession.durationMinutes} min • Status: ${liveSession.status}",
                            color = TextSecondary,
                            fontSize = 12.sp
                        )
                        Spacer(modifier = Modifier.height(12.dp))
                        Button(
                            onClick = { onStartExam(liveSession) },
                            colors = ButtonDefaults.buttonColors(containerColor = EmeraldGreen, contentColor = Color.Black),
                            shape = RoundedCornerShape(8.dp),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Text("Engage Hardware Kiosk Lockdown", fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }

            Text(
                text = "ENROLLED ACADEMIC CLASSES",
                fontWeight = FontWeight.Bold,
                fontSize = 12.sp,
                color = TextSecondary,
                modifier = Modifier.padding(bottom = 8.dp)
            )

            if (isLoading) {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator(color = EmeraldGreen)
                }
            } else if (classes.isEmpty()) {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(32.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Icon(Icons.Default.School, contentDescription = null, tint = TextSecondary, modifier = Modifier.size(48.dp))
                        Spacer(modifier = Modifier.height(12.dp))
                        Text("No classes enrolled yet", color = TextSecondary, fontSize = 15.sp)
                        Text("Tap + to join a class using your class code", color = TextSecondary, fontSize = 12.sp)
                    }
                }
            } else {
                LazyColumn(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    items(classes) { cls ->
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            colors = CardDefaults.cardColors(containerColor = SurfaceDark),
                            shape = RoundedCornerShape(12.dp)
                        ) {
                            Column(modifier = Modifier.padding(16.dp)) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Text(
                                        text = cls.name,
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 15.sp,
                                        color = TextPrimary
                                    )
                                    Surface(
                                        color = EmeraldGreen.copy(alpha = 0.15f),
                                        shape = RoundedCornerShape(6.dp)
                                    ) {
                                        Text(
                                            text = cls.classCode,
                                            color = EmeraldGreen,
                                            fontSize = 11.sp,
                                            fontWeight = FontWeight.Bold,
                                            modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                                        )
                                    }
                                }
                                Spacer(modifier = Modifier.height(4.dp))
                                Text(
                                    text = "${cls.subject} • Sec ${cls.section} • ${cls.semester}",
                                    color = TextSecondary,
                                    fontSize = 12.sp
                                )
                            }
                        }
                    }
                }
            }
        }
    }

    if (showJoinDialog) {
        AlertDialog(
            onDismissRequest = { showJoinDialog = false },
            containerColor = SurfaceDark,
            title = {
                Text("Join Academic Class", color = TextPrimary, fontWeight = FontWeight.Bold)
            },
            text = {
                Column {
                    Text("Enter the Class Code provided by your course faculty:", color = TextSecondary, fontSize = 13.sp)
                    Spacer(modifier = Modifier.height(12.dp))
                    OutlinedTextField(
                        value = classCodeInput,
                        onValueChange = { classCodeInput = it },
                        label = { Text("Class Code (e.g. CS601)") },
                        singleLine = true,
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = EmeraldGreen,
                            unfocusedBorderColor = BorderDark,
                            focusedTextColor = TextPrimary,
                            unfocusedTextColor = TextPrimary
                        ),
                        modifier = Modifier.fillMaxWidth()
                    )
                    if (joinMessage != null) {
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(joinMessage ?: "", color = EmeraldGreen, fontSize = 12.sp)
                    }
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        if (classCodeInput.isBlank()) return@Button
                        isJoining = true
                        joinMessage = null
                        coroutineScope.launch {
                            try {
                                val devId = user.device?.id ?: "native-android-device"
                                val msg = apiClient.joinClassByCode(
                                    code = classCodeInput.trim(),
                                    displayName = user.name,
                                    regNumber = user.studentProfile?.registerNumber,
                                    deviceId = devId
                                )
                                joinMessage = msg
                                refreshClasses()
                                showJoinDialog = false
                            } catch (e: Exception) {
                                joinMessage = e.message ?: "Failed to join class"
                            } finally {
                                isJoining = false
                            }
                        }
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = EmeraldGreen, contentColor = Color.Black),
                    enabled = !isJoining
                ) {
                    Text("Join Class", fontWeight = FontWeight.Bold)
                }
            },
            dismissButton = {
                TextButton(onClick = { showJoinDialog = false }) {
                    Text("Cancel", color = TextSecondary)
                }
            }
        )
    }
}
