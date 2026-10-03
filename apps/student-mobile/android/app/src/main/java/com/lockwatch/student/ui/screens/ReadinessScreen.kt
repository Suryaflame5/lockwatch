package com.lockwatch.student.ui.screens

import android.app.Activity
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.ui.res.painterResource
import com.lockwatch.student.R
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
import com.lockwatch.student.security.SecurityController
import com.lockwatch.student.ui.*

@Composable
fun ReadinessScreen(
    session: SessionSummary,
    securityController: SecurityController,
    onLockEngaged: () -> Unit,
    onCancel: () -> Unit
) {
    val context = LocalContext.current
    val activity = context as? Activity

    val isDeviceOwner = remember { securityController.isDeviceOwner() }
    val isLockTaskPermitted = remember { securityController.isLockTaskPermitted() }
    val batteryInfo = remember { securityController.getBatteryInfo() }
    val isBatterySufficient = batteryInfo.first >= 20 || batteryInfo.second

    var lockError by remember { mutableStateOf<String?>(null) }
    var isStarting by remember { mutableStateOf(false) }

    val allChecksPass = isBatterySufficient

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(BgDark)
            .padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.SpaceBetween
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Spacer(modifier = Modifier.height(20.dp))
            Image(
                painter = painterResource(id = R.drawable.lockwatch_mark_dark),
                contentDescription = "LockWatch",
                modifier = Modifier.size(52.dp)
            )
            Spacer(modifier = Modifier.height(12.dp))
            Text(
                text = "Pre-Session Readiness Audit",
                color = TextPrimary,
                fontSize = 20.sp,
                fontWeight = FontWeight.Bold
            )
            Text(
                text = session.name,
                color = TextSecondary,
                fontSize = 14.sp
            )
            Spacer(modifier = Modifier.height(24.dp))

            // Check item cards
            CheckItemCard(
                title = "Android Device Owner Provisioning",
                subtitle = if (isDeviceOwner) "Device Owner active (authoritative managed kiosk)" else "Managed provisioning status required",
                passed = isDeviceOwner
            )
            Spacer(modifier = Modifier.height(10.dp))
            CheckItemCard(
                title = "Lock Task Permission",
                subtitle = if (isLockTaskPermitted) "System navigation & shade blocking allowed" else "Lock Task authorization required",
                passed = isLockTaskPermitted
            )
            Spacer(modifier = Modifier.height(10.dp))
            CheckItemCard(
                title = "Device Battery Integrity",
                subtitle = "${batteryInfo.first}% (${if (batteryInfo.second) "Charging" else "On Battery"}) - Min 20% required",
                passed = isBatterySufficient
            )
            Spacer(modifier = Modifier.height(10.dp))
            CheckItemCard(
                title = "Backend Connectivity",
                subtitle = "https://lockwatch.onrender.com (Neon DB)",
                passed = true
            )

            if (lockError != null) {
                Spacer(modifier = Modifier.height(16.dp))
                Card(
                    colors = CardDefaults.cardColors(containerColor = CrimsonRed.copy(alpha = 0.2f)),
                    shape = RoundedCornerShape(8.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text(
                        text = lockError ?: "",
                        color = CrimsonRed,
                        fontSize = 13.sp,
                        modifier = Modifier.padding(12.dp)
                    )
                }
            }
        }

        Column(modifier = Modifier.fillMaxWidth()) {
            Button(
                onClick = {
                    if (activity == null) {
                        lockError = "Activity context unavailable"
                        return@Button
                    }
                    isStarting = true
                    val result = securityController.startLock(activity)
                    if (result.isSuccess) {
                        onLockEngaged()
                    } else {
                        lockError = result.exceptionOrNull()?.message ?: "Failed to engage Lock Task Mode"
                        isStarting = false
                    }
                },
                enabled = allChecksPass && !isStarting,
                colors = ButtonDefaults.buttonColors(containerColor = EmeraldGreen, contentColor = Color.Black),
                shape = RoundedCornerShape(12.dp),
                modifier = Modifier
                    .fillMaxWidth()
                    .height(52.dp)
            ) {
                if (isStarting) {
                    CircularProgressIndicator(color = Color.Black, modifier = Modifier.size(22.dp))
                } else {
                    Text("START EXAMINATION LOCKDOWN", fontWeight = FontWeight.Bold, fontSize = 15.sp)
                }
            }

            Spacer(modifier = Modifier.height(10.dp))

            TextButton(
                onClick = onCancel,
                modifier = Modifier.fillMaxWidth()
            ) {
                Text("Cancel and Return to Classes", color = TextSecondary)
            }
        }
    }
}

@Composable
private fun CheckItemCard(title: String, subtitle: String, passed: Boolean) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = SurfaceDark),
        shape = RoundedCornerShape(10.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(14.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(
                imageVector = if (passed) Icons.Default.CheckCircle else Icons.Default.Warning,
                contentDescription = null,
                tint = if (passed) EmeraldGreen else AmberWarning,
                modifier = Modifier.size(24.dp)
            )
            Spacer(modifier = Modifier.width(12.dp))
            Column {
                Text(text = title, color = TextPrimary, fontWeight = FontWeight.SemiBold, fontSize = 14.sp)
                Text(text = subtitle, color = TextSecondary, fontSize = 12.sp)
            }
        }
    }
}
