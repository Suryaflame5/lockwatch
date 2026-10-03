package com.lockwatch.faculty

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.runtime.*
import com.lockwatch.faculty.data.*
import com.lockwatch.faculty.ui.LockWatchFacultyTheme
import com.lockwatch.faculty.ui.screens.*

enum class FacultyScreen { LOGIN, DASHBOARD, CLASS_DETAIL, LIVE_MONITOR }

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        setTheme(R.style.Theme_LockWatch_Main)
        super.onCreate(savedInstanceState)
        setContent {
            LockWatchFacultyTheme {
                FacultyApp()
            }
        }
    }
}

@Composable
fun FacultyApp() {
    var screen by remember { mutableStateOf(FacultyScreen.LOGIN) }
    var loginResponse by remember { mutableStateOf<LoginResponse?>(null) }
    var selectedClass by remember { mutableStateOf<AcademicClass?>(null) }
    var selectedSession by remember { mutableStateOf<Session?>(null) }

    when (screen) {
        FacultyScreen.LOGIN -> FacultyLoginScreen(
            onLoginSuccess = { resp ->
                loginResponse = resp
                screen = FacultyScreen.DASHBOARD
            }
        )
        FacultyScreen.DASHBOARD -> loginResponse?.let { resp ->
            DashboardScreen(
                loginResponse = resp,
                onClassSelected = { cls ->
                    selectedClass = cls
                    screen = FacultyScreen.CLASS_DETAIL
                },
                onLogout = {
                    FacultyApiClient.accessToken = null
                    FacultyApiClient.refreshToken = null
                    loginResponse = null
                    screen = FacultyScreen.LOGIN
                }
            )
        }
        FacultyScreen.CLASS_DETAIL -> selectedClass?.let { cls ->
            ClassDetailScreen(
                cls = cls,
                onBack = { screen = FacultyScreen.DASHBOARD },
                onSessionSelected = { session ->
                    selectedSession = session
                    screen = FacultyScreen.LIVE_MONITOR
                }
            )
        }
        FacultyScreen.LIVE_MONITOR -> selectedSession?.let { session ->
            LiveMonitorScreen(
                session = session,
                onBack = { screen = FacultyScreen.CLASS_DETAIL }
            )
        }
    }
}
