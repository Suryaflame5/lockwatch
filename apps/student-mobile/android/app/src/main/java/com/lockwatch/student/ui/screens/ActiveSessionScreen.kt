package com.lockwatch.student.ui.screens

import android.app.Activity
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.lockwatch.student.data.SessionSummary
import com.lockwatch.student.data.StudentApiClient
import com.lockwatch.student.data.User
import com.lockwatch.student.security.SecurityController
import com.lockwatch.student.ui.*
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch

@Composable
fun ActiveSessionScreen(
    user: User,
    session: SessionSummary,
    apiClient: StudentApiClient,
    securityController: SecurityController,
    onSessionEnded: () -> Unit
) {
    val context = LocalContext.current
    val activity = context as? Activity
    val coroutineScope = rememberCoroutineScope()

    var isLocked by remember { mutableStateOf(securityController.isLockTaskActive()) }
    var heartbeatSeq by remember { mutableIntStateOf(1) }
    var batteryPercentage by remember { mutableIntStateOf(securityController.getBatteryInfo().first) }
    var isEmergencyActive by remember { mutableStateOf(false) }
    var emergencySecondsRemaining by remember { mutableIntStateOf(0) }
    var sessionStatus by remember { mutableStateOf(session.status) }

    // Heartbeat Loop (every 5 seconds)
    LaunchedEffect(Unit) {
        val devId = user.device?.id ?: "dev-prod-student-001"
        val stuId = user.studentProfile?.id ?: user.id

        // Connect WebSocket for real-time events
        apiClient.connectWebSocket(session.id) { event, data ->
            when (event) {
                "session.ended" -> {
                    coroutineScope.launch {
                        activity?.let { securityController.stopLock(it) }
                        apiClient.disconnectWebSocket()
                        onSessionEnded()
                    }
                }
                "session.paused" -> {
                    sessionStatus = "PAUSED"
                }
                "session.resumed" -> {
                    sessionStatus = "ACTIVE"
                }
            }
        }

        while (isActive) {
            val (bat, charging) = securityController.getBatteryInfo()
            batteryPercentage = bat
            val currentLocked = securityController.isLockTaskActive()
            isLocked = currentLocked

            try {
                apiClient.sendHeartbeat(
                    sessionId = session.id,
                    studentId = stuId,
                    deviceId = devId,
                    sequence = heartbeatSeq++,
                    isLockActive = currentLocked,
                    batteryLevel = bat,
                    isCharging = charging
                )
            } catch (e: Exception) {
                // Heartbeat failures queue or retry next loop
            }
            delay(5000)
        }
    }

    // Emergency Countdown Timer
    LaunchedEffect(isEmergencyActive) {
        if (isEmergencyActive) {
            while (emergencySecondsRemaining > 0) {
                delay(1000)
                emergencySecondsRemaining--
            }
            // Emergency period elapsed -> re-engage Lock Task immediately
            activity?.let { securityController.startLock(it) }
            val devId = user.device?.id ?: "dev-prod-student-001"
            val stuId = user.studentProfile?.id ?: user.id
            try {
                apiClient.exitEmergency(session.id, stuId, devId)
            } catch (e: Exception) {}
            isEmergencyActive = false
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(BgDark)
            .padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.SpaceBetween
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Spacer(modifier = Modifier.height(24.dp))

            Surface(
                color = if (isEmergencyActive) CrimsonRed.copy(alpha = 0.2f) else CardDark,
                shape = RoundedCornerShape(12.dp)
            ) {
                Row(
                    modifier = Modifier.padding(horizontal = 14.dp, vertical = 6.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        imageVector = if (isEmergencyActive) Icons.Default.Warning else Icons.Default.Shield,
                        contentDescription = null,
                        tint = if (isEmergencyActive) CrimsonRed else BrandWhite,
                        modifier = Modifier.size(16.dp)
                    )
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(
                        text = if (isEmergencyActive) "EMERGENCY BREAKOUT: ${emergencySecondsRemaining}s" else "OS HARDWARE LOCKDOWN ACTIVE",
                        color = if (isEmergencyActive) CrimsonRed else BrandWhite,
                        fontWeight = FontWeight.Bold,
                        fontSize = 12.sp
                    )
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            Text(
                text = session.name,
                fontWeight = FontWeight.Bold,
                fontSize = 20.sp,
                color = TextPrimary
            )
            Text(
                text = "Status: $sessionStatus • Duration: ${session.durationMinutes} min",
                fontSize = 13.sp,
                color = TextSecondary
            )

            Spacer(modifier = Modifier.height(32.dp))

            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(containerColor = SurfaceDark),
                shape = RoundedCornerShape(14.dp)
            ) {
                Column(modifier = Modifier.padding(20.dp)) {
                    Text("TELEMETRY STREAM ACTIVE", color = TextSecondary, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                    Spacer(modifier = Modifier.height(12.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text("Battery Integrity", color = TextSecondary, fontSize = 13.sp)
                        Text("$batteryPercentage%", color = if (batteryPercentage > 20) BrandWhite else CrimsonRed, fontWeight = FontWeight.Bold)
                    }
                    Spacer(modifier = Modifier.height(8.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text("OS Lock Task State", color = TextSecondary, fontSize = 13.sp)
                        Text(if (isLocked) "LOCKED (Hardware Verified)" else "STANDBY", color = if (isLocked) BrandWhite else AmberWarning, fontWeight = FontWeight.Bold)
                    }
                    Spacer(modifier = Modifier.height(8.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text("Heartbeat Packets Sent", color = TextSecondary, fontSize = 13.sp)
                        Text("#$heartbeatSeq", color = TextPrimary, fontWeight = FontWeight.Bold)
                    }
                }
            }
        }

        // Emergency Breakout Button
        Column(modifier = Modifier.fillMaxWidth()) {
            if (!isEmergencyActive) {
                OutlinedButton(
                    onClick = {
                        val devId = user.device?.id ?: "dev-prod-student-001"
                        val stuId = user.studentProfile?.id ?: user.id
                        coroutineScope.launch {
                            try {
                                val seconds = apiClient.requestEmergency(session.id, stuId, devId, "Student requested emergency breakout")
                                emergencySecondsRemaining = seconds
                                activity?.let { securityController.stopLock(it) }
                                isEmergencyActive = true
                            } catch (e: Exception) {
                                // Handled
                            }
                        }
                    },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(48.dp),
                    shape = RoundedCornerShape(10.dp),
                    colors = ButtonDefaults.outlinedButtonColors(contentColor = CrimsonRed),
                    border = ButtonDefaults.outlinedButtonBorder.copy(brush = androidx.compose.ui.graphics.SolidColor(CrimsonRed))
                ) {
                    Icon(Icons.Default.Emergency, contentDescription = null, modifier = Modifier.size(18.dp))
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Request 15-Second Emergency Breakout", fontWeight = FontWeight.Bold)
                }
            } else {
                Button(
                    onClick = {
                        emergencySecondsRemaining = 0
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = BrandWhite, contentColor = Color.Black),
                    shape = RoundedCornerShape(10.dp),
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(48.dp)
                ) {
                    Text("Re-Engage Lockdown Now", fontWeight = FontWeight.Bold)
                }
            }
        }
    }
}
