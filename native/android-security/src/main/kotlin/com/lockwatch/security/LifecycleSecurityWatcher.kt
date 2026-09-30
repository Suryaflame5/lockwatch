package com.lockwatch.security

import android.app.Activity
import android.app.Application
import android.app.KeyguardManager
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.Bundle
import android.os.PowerManager
import android.util.Log

/**
 * LifecycleSecurityWatcher
 * Tracks genuine supervision interruptions without misclassifying screen-off,
 * configuration changes, or phone sleep as app exits.
 * Adheres strictly to Section 29, 30, and 31.
 */
class LifecycleSecurityWatcher(
    private val context: Context,
    private val lockTaskController: LockTaskController,
    private val listener: SecurityEventListener
) : Application.ActivityLifecycleCallbacks {

    companion object {
        private const val TAG = "LifecycleSecurityWatcher"
    }

    interface SecurityEventListener {
        fun onScreenStateChanged(screenOn: Boolean)
        fun onDeviceLockStateChanged(deviceLocked: Boolean)
        fun onSupervisionInterrupted(reason: String)
        fun onSupervisionResumed()
    }

    private val powerManager = context.getSystemService(Context.POWER_SERVICE) as PowerManager
    private val keyguardManager = context.getSystemService(Context.KEYGUARD_SERVICE) as KeyguardManager

    private var isSupervisionActive = false
    private var isAppInForeground = false
    private var isScreenInteractive = true
    private var isConfigChanging = false

    private val screenReceiver = object : BroadcastReceiver() {
        override fun onReceive(ctx: Context?, intent: Intent?) {
            when (intent?.action) {
                Intent.ACTION_SCREEN_OFF -> {
                    isScreenInteractive = false
                    Log.d(TAG, "Screen turned OFF. Session maintained; not classified as app exit.")
                    listener.onScreenStateChanged(false)
                }
                Intent.ACTION_SCREEN_ON -> {
                    isScreenInteractive = true
                    Log.d(TAG, "Screen turned ON. Verifying lock task security state...")
                    listener.onScreenStateChanged(true)
                    verifyLockIntegrity()
                }
                Intent.ACTION_USER_PRESENT -> {
                    Log.d(TAG, "Device unlocked by user.")
                    listener.onDeviceLockStateChanged(false)
                    verifyLockIntegrity()
                }
            }
        }
    }

    fun startSupervision() {
        isSupervisionActive = true
        val filter = IntentFilter().apply {
            addAction(Intent.ACTION_SCREEN_OFF)
            addAction(Intent.ACTION_SCREEN_ON)
            addAction(Intent.ACTION_USER_PRESENT)
        }
        context.registerReceiver(screenReceiver, filter)
    }

    fun stopSupervision() {
        isSupervisionActive = false
        try {
            context.unregisterReceiver(screenReceiver)
        } catch (e: Exception) {
            Log.w(TAG, "Receiver already unregistered", e)
        }
    }

    private fun verifyLockIntegrity() {
        if (!isSupervisionActive) return

        if (!lockTaskController.isLockTaskActive()) {
            Log.e(TAG, "Supervision interruption detected! Lock task state is false while supervision is active.")
            listener.onSupervisionInterrupted("Hardware lock task dropped while device was active")
        } else {
            Log.d(TAG, "Lock integrity verified: Hardware lock task remains enforced.")
            listener.onSupervisionResumed()
        }
    }

    override fun onActivityResumed(activity: Activity) {
        isAppInForeground = true
        if (isSupervisionActive) {
            verifyLockIntegrity()
        }
    }

    override fun onActivityPaused(activity: Activity) {
        isConfigChanging = activity.isChangingConfigurations
    }

    override fun onActivityStopped(activity: Activity) {
        if (isConfigChanging) {
            // Orientation or theme configuration change - not an exit
            return
        }

        // If screen is off, this is a normal display sleep - not an exit
        if (!powerManager.isInteractive) {
            Log.d(TAG, "Activity stopped due to display sleep. Supervision remains intact.")
            return
        }

        isAppInForeground = false
        if (isSupervisionActive) {
            Log.w(TAG, "Activity stopped while screen was active! Student left application boundary.")
            listener.onSupervisionInterrupted("Application lost foreground focus during active session")
        }
    }

    override fun onActivityCreated(activity: Activity, savedInstanceState: Bundle?) {}
    override fun onActivityStarted(activity: Activity) {}
    override fun onActivitySaveInstanceState(activity: Activity, outState: Bundle) {}
    override fun onActivityDestroyed(activity: Activity) {}
}
