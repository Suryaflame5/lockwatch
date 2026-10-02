package com.lockwatch.faculty.ui

import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

val NavyBlue = Color(0xFF1A237E)
val RoyalBlue = Color(0xFF2196F3)
val TealAccent = Color(0xFF00BCD4)
val BgDark = Color(0xFF0D1117)
val SurfaceDark = Color(0xFF161B22)
val CardDark = Color(0xFF21262D)
val TextPrimary = Color(0xFFE6EDF3)
val TextSecondary = Color(0xFF8B949E)
val SuccessGreen = Color(0xFF3FB950)
val WarningOrange = Color(0xFFF78166)
val AlertRed = Color(0xFFDA3633)

private val DarkColorScheme = darkColorScheme(
    primary = RoyalBlue,
    secondary = TealAccent,
    background = BgDark,
    surface = SurfaceDark,
    onPrimary = Color.White,
    onBackground = TextPrimary,
    onSurface = TextPrimary,
    error = AlertRed
)

@Composable
fun LockWatchFacultyTheme(content: @Composable () -> Unit) {
    MaterialTheme(colorScheme = DarkColorScheme, content = content)
}
