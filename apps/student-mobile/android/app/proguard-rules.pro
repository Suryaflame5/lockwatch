# Keep all LockWatch native and student classes
-keep class com.lockwatch.** { *; }
-keepclassmembers class com.lockwatch.** { *; }

# Keep JavascriptInterface methods from being stripped or renamed by R8
-keepattributes JavascriptInterface
-keepattributes *Annotation*
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

-keep class androidx.webkit.** { *; }
-dontwarn android.webkit.**
