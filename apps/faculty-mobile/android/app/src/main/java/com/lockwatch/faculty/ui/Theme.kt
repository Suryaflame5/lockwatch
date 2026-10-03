package com.lockwatch.faculty.ui

import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

val BgDark = Color(0xFF0D1117)
val SurfaceDark = Color(0xFF161B22)
val CardDark = Color(0xFF21262D)
val BorderDark = Color(0xFF30363D)
val BrandWhite = Color(0xFFFFFFFF)
val BrandGrayLight = Color(0xFFD0D7DE)
val BrandGray = Color(0xFF8B949E)
val TextPrimary = Color(0xFFE6EDF3)
val TextSecondary = Color(0xFF8B949E)
val AlertRed = Color(0xFFDA3633)
val NavyBlue = CardDark
val RoyalBlue = BrandWhite
val TealAccent = BrandGray
val SuccessGreen = BrandWhite
val WarningOrange = Color(0xFFD29922)

private val DarkColorScheme = darkColorScheme(
    primary = BrandWhite,
    secondary = BrandGray,
    background = BgDark,
    surface = SurfaceDark,
    onPrimary = Color.Black,
    onBackground = TextPrimary,
    onSurface = TextPrimary,
    error = AlertRed
)

@Composable
fun LockWatchFacultyTheme(content: @Composable () -> Unit) {
    MaterialTheme(colorScheme = DarkColorScheme, content = content)
}
