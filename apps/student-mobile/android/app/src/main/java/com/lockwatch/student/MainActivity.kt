package com.lockwatch.student

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.compose.BackHandler
import androidx.compose.runtime.*
import com.lockwatch.student.data.SessionSummary
import com.lockwatch.student.data.StudentApiClient
import com.lockwatch.student.data.User
import com.lockwatch.student.security.SecurityController
import com.lockwatch.student.ui.LockWatchTheme
import com.lockwatch.student.ui.screens.*
import kotlinx.coroutines.launch

enum class StudentScreen {
    LOGIN,
    HOME,
    READINESS,
    ACTIVE_SESSION,
    SESSION_ENDED
}

class MainActivity : ComponentActivity() {

    private lateinit var apiClient: StudentApiClient
    private lateinit var securityController: SecurityController

    override fun onCreate(savedInstanceState: Bundle?) {
        setTheme(R.style.Theme_LockWatch_Main)
        super.onCreate(savedInstanceState)

        apiClient = StudentApiClient(applicationContext)
        securityController = SecurityController(applicationContext) { this }

        setContent {
            LockWatchTheme {
                StudentApp(apiClient, securityController)
            }
        }
    }
}

@Composable
fun StudentApp(
    apiClient: StudentApiClient,
    securityController: SecurityController
) {
    val coroutineScope = rememberCoroutineScope()
    var currentScreen by remember {
        mutableStateOf(if (apiClient.isAuthenticated) StudentScreen.HOME else StudentScreen.LOGIN)
    }
    var currentUser by remember { mutableStateOf<User?>(null) }
    var selectedSession by remember { mutableStateOf<SessionSummary?>(null) }

    // On start, if authenticated, fetch student profile
    LaunchedEffect(Unit) {
        if (apiClient.isAuthenticated) {
            try {
                currentUser = apiClient.getProfile()
                currentScreen = StudentScreen.HOME
            } catch (e: Exception) {
                apiClient.clearTokens()
                currentScreen = StudentScreen.LOGIN
            }
        }
    }

    // Traps back button during examination lockdown
    BackHandler(enabled = currentScreen == StudentScreen.ACTIVE_SESSION) {
        // In Lock Task Mode, back navigation is disabled to preserve exam integrity
    }

    when (currentScreen) {
        StudentScreen.LOGIN -> {
            StudentLoginScreen(
                apiClient = apiClient,
                onLoginSuccess = { user ->
                    currentUser = user
                    currentScreen = StudentScreen.HOME
                }
            )
        }

        StudentScreen.HOME -> {
            currentUser?.let { user ->
                StudentHomeScreen(
                    user = user,
                    apiClient = apiClient,
                    onStartExam = { session ->
                        selectedSession = session
                        currentScreen = StudentScreen.READINESS
                    },
                    onLogout = {
                        apiClient.clearTokens()
                        currentUser = null
                        currentScreen = StudentScreen.LOGIN
                    }
                )
            }
        }

        StudentScreen.READINESS -> {
            selectedSession?.let { session ->
                ReadinessScreen(
                    session = session,
                    securityController = securityController,
                    onLockEngaged = {
                        currentScreen = StudentScreen.ACTIVE_SESSION
                    },
                    onCancel = {
                        currentScreen = StudentScreen.HOME
                    }
                )
            }
        }

        StudentScreen.ACTIVE_SESSION -> {
            if (currentUser != null && selectedSession != null) {
                ActiveSessionScreen(
                    user = currentUser!!,
                    session = selectedSession!!,
                    apiClient = apiClient,
                    securityController = securityController,
                    onSessionEnded = {
                        currentScreen = StudentScreen.SESSION_ENDED
                    }
                )
            }
        }

        StudentScreen.SESSION_ENDED -> {
            SessionEndedScreen(
                onReturnHome = {
                    selectedSession = null
                    currentScreen = StudentScreen.HOME
                }
            )
        }
    }
}
