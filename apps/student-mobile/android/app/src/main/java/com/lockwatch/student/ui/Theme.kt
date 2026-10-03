package com.lockwatch.student.ui

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

val BgDark = Color(0xFF0A0D14)
val SurfaceDark = Color(0xFF161B22)
val CardDark = Color(0xFF21262D)
val BorderDark = Color(0xFF30363D)
val BrandWhite = Color(0xFFFFFFFF)
val BrandGrayLight = Color(0xFFD0D7DE)
val BrandGray = Color(0xFF8B949E)
val CrimsonRed = Color(0xFFF85149)
val AmberWarning = Color(0xFFD29922)
val TextPrimary = Color(0xFFF0F6FC)
val TextSecondary = Color(0xFF8B949E)

private val DarkColorScheme = darkColorScheme(
    primary = BrandWhite,
    onPrimary = Color.Black,
    primaryContainer = SurfaceDark,
    onPrimaryContainer = BrandWhite,
    secondary = BrandGray,
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
