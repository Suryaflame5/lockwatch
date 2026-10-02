package com.lockwatch.student.ui

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

val BgDark = Color(0xFF0A0D14)
val SurfaceDark = Color(0xFF111827)
val CardDark = Color(0xFF1F2937)
val BorderDark = Color(0xFF374151)
val EmeraldGreen = Color(0xFF10B981)
val EmeraldLight = Color(0xFF34D399)
val CrimsonRed = Color(0xFFEF4444)
val AmberWarning = Color(0xFFF59E0B)
val TextPrimary = Color(0xFFF8FAFC)
val TextSecondary = Color(0xFF94A3B8)

private val DarkColorScheme = darkColorScheme(
    primary = EmeraldGreen,
    onPrimary = Color.Black,
    primaryContainer = SurfaceDark,
    onPrimaryContainer = EmeraldLight,
    secondary = AmberWarning,
    onSecondary = Color.Black,
    error = CrimsonRed,
    onError = Color.White,
    background = BgDark,
    onBackground = TextPrimary,
    surface = SurfaceDark,
    onSurface = TextPrimary,
    outline = BorderDark
)

@Composable
fun LockWatchTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    MaterialTheme(
        colorScheme = DarkColorScheme,
        typography = Typography(),
        content = content
    )
}
