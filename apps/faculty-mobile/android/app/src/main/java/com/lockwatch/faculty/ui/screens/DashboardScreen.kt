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
fun DashboardScreen(
    loginResponse: LoginResponse,
    onClassSelected: (AcademicClass) -> Unit,
    onLogout: () -> Unit
) {
    val scope = rememberCoroutineScope()
    var classes by remember { mutableStateOf<List<AcademicClass>>(emptyList()) }
    var loading by remember { mutableStateOf(true) }
    var error by remember { mutableStateOf<String?>(null) }
    var showCreateDialog by remember { mutableStateOf(false) }
    var newClassName by remember { mutableStateOf("") }
    var newClassSubject by remember { mutableStateOf("") }
    var newClassSection by remember { mutableStateOf("") }
    var creating by remember { mutableStateOf(false) }

    var createError by remember { mutableStateOf<String?>(null) }

    fun loadClasses() {
        scope.launch {
            loading = true
            error = null
            try {
                classes = withContext(Dispatchers.IO) { FacultyApiClient.getClasses() }
            } catch (e: Exception) {
                error = e.message
            } finally {
                loading = false
            }
        }
    }

    LaunchedEffect(Unit) { loadClasses() }

    Scaffold(
        containerColor = BgDark,
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text("LockWatch Faculty", color = TextPrimary, fontWeight = FontWeight.Bold)
                        Text(loginResponse.institution.name, color = TextSecondary, fontSize = 12.sp)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = SurfaceDark),
                actions = {
                    IconButton(onClick = { loadClasses() }) {
                        Icon(Icons.Default.Refresh, contentDescription = "Refresh", tint = TextSecondary)
                    }
                    IconButton(onClick = onLogout) {
                        Icon(Icons.Default.ExitToApp, contentDescription = "Logout", tint = WarningOrange)
                    }
                }
            )
        },
        floatingActionButton = {
            FloatingActionButton(onClick = {
                createError = null
                showCreateDialog = true
            }, containerColor = RoyalBlue) {
                Icon(Icons.Default.Add, contentDescription = "Create Class", tint = TextPrimary)
            }
        }
    ) { padding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .background(BgDark)
        ) {
            when {
                loading -> CircularProgressIndicator(modifier = Modifier.align(Alignment.Center), color = RoyalBlue)
                error != null -> Column(
                    modifier = Modifier.align(Alignment.Center),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Text("Error: $error", color = WarningOrange)
                    Spacer(Modifier.height(8.dp))
                    Button(onClick = { loadClasses() }, colors = ButtonDefaults.buttonColors(containerColor = RoyalBlue)) {
                        Text("Retry")
                    }
                }
                classes.isEmpty() -> Column(
                    modifier = Modifier.align(Alignment.Center),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Icon(Icons.Default.School, contentDescription = null, tint = TextSecondary, modifier = Modifier.size(64.dp))
                    Spacer(Modifier.height(16.dp))
                    Text("No classes yet", color = TextSecondary, fontSize = 18.sp)
                    Spacer(Modifier.height(8.dp))
                    Text("Tap + to create your first class", color = TextSecondary, fontSize = 14.sp)
                }
                else -> LazyColumn(
                    modifier = Modifier.fillMaxSize(),
                    contentPadding = PaddingValues(16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    items(classes) { cls ->
                        ClassCard(cls = cls, onClick = { onClassSelected(cls) })
                    }
                }
            }
        }
    }

    if (showCreateDialog) {
        AlertDialog(
            onDismissRequest = {
                if (!creating) {
                    showCreateDialog = false
                    createError = null
                }
            },
            containerColor = CardDark,
            title = { Text("Create Class", color = TextPrimary) },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    if (createError != null) {
                        Card(
                            colors = CardDefaults.cardColors(containerColor = AlertRed.copy(alpha = 0.15f)),
                            shape = RoundedCornerShape(8.dp),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Text(
                                text = createError ?: "",
                                color = AlertRed,
                                fontSize = 12.sp,
                                modifier = Modifier.padding(10.dp)
                            )
                        }
                    }

                    OutlinedTextField(
                        value = newClassName,
                        onValueChange = { newClassName = it },
                        label = { Text("Class Name", color = TextSecondary) },
                        modifier = Modifier.fillMaxWidth(),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedTextColor = TextPrimary,
                            unfocusedTextColor = TextPrimary,
                            focusedBorderColor = RoyalBlue,
                            unfocusedBorderColor = TextSecondary
                        )
                    )
                    OutlinedTextField(
                        value = newClassSubject,
                        onValueChange = { newClassSubject = it },
                        label = { Text("Subject", color = TextSecondary) },
                        modifier = Modifier.fillMaxWidth(),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedTextColor = TextPrimary,
                            unfocusedTextColor = TextPrimary,
                            focusedBorderColor = RoyalBlue,
                            unfocusedBorderColor = TextSecondary
                        )
                    )
                    OutlinedTextField(
                        value = newClassSection,
                        onValueChange = { newClassSection = it },
                        label = { Text("Section (optional)", color = TextSecondary) },
                        modifier = Modifier.fillMaxWidth(),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedTextColor = TextPrimary,
                            unfocusedTextColor = TextPrimary,
                            focusedBorderColor = RoyalBlue,
                            unfocusedBorderColor = TextSecondary
                        )
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        scope.launch {
                            creating = true
                            createError = null
                            try {
                                val cls = withContext(Dispatchers.IO) {
                                    FacultyApiClient.createClass(
                                        name = newClassName,
                                        subject = newClassSubject,
                                        section = newClassSection.ifBlank { null }
                                    )
                                }
                                classes = listOf(cls) + classes
                                showCreateDialog = false
                                newClassName = ""
                                newClassSubject = ""
                                newClassSection = ""
                                createError = null
                            } catch (e: Exception) {
                                createError = e.message ?: "Failed to create class"
                            } finally {
                                creating = false
                            }
                        }
                    },
                    enabled = !creating && newClassName.isNotBlank() && newClassSubject.isNotBlank(),
                    colors = ButtonDefaults.buttonColors(containerColor = RoyalBlue)
                ) {
                    if (creating) {
                        CircularProgressIndicator(modifier = Modifier.size(16.dp), color = TextPrimary, strokeWidth = 2.dp)
                    } else {
                        Text("Create")
                    }
                }
            },
            dismissButton = {
                TextButton(onClick = {
                    if (!creating) {
                        showCreateDialog = false
                        createError = null
                    }
                }) {
                    Text("Cancel", color = TextSecondary)
                }
            }
        )
    }
}

@Composable
fun ClassCard(cls: AcademicClass, onClick: () -> Unit) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick),
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = CardDark)
    ) {
        Row(
            modifier = Modifier.padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .size(48.dp)
                    .background(RoyalBlue.copy(alpha = 0.2f), RoundedCornerShape(8.dp)),
                contentAlignment = Alignment.Center
            ) {
                Icon(Icons.Default.School, contentDescription = null, tint = RoyalBlue, modifier = Modifier.size(24.dp))
            }
            Spacer(Modifier.width(16.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(cls.name, color = TextPrimary, fontWeight = FontWeight.SemiBold, fontSize = 16.sp)
                Text(cls.subject + (cls.section?.let { " · Section $it" } ?: ""), color = TextSecondary, fontSize = 13.sp)
                Text("Join Code: ${cls.joinCode}", color = TealAccent, fontSize = 12.sp, fontWeight = FontWeight.Medium)
            }
            Icon(Icons.Default.ChevronRight, contentDescription = null, tint = TextSecondary)
        }
    }
}
