package com.lockwatch.security

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log

/**
 * BootRecoveryReceiver
 * Recovers active supervised session on device reboot (Section 32, 76).
 * Emits DEVICE_REBOOTED event and resumes native lock if session remains within time limits.
 */
class BootRecoveryReceiver : BroadcastReceiver() {

    companion object {
        private const val TAG = "BootRecoveryReceiver"
        const val PREFS_NAME = "lockwatch_session_state"
        const val KEY_ACTIVE_SESSION_ID = "active_session_id"
        const val KEY_SESSION_EXPIRES_AT = "session_expires_at"
    }

    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action == Intent.ACTION_BOOT_COMPLETED || intent.action == Intent.ACTION_LOCKED_BOOT_COMPLETED) {
            Log.i(TAG, "Device reboot completed. Inspecting active session state...")

            val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            val activeSessionId = prefs.getString(KEY_ACTIVE_SESSION_ID, null)
            val expiresAtMs = prefs.getLong(KEY_SESSION_EXPIRES_AT, 0L)

            if (!activeSessionId.isNullOrEmpty() && System.currentTimeMillis() < expiresAtMs) {
                Log.w(TAG, "Active session detected after reboot: $activeSessionId. Launching recovery...")

                val launchIntent = context.packageManager.getLaunchIntentForPackage(context.packageName)?.apply {
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
                    putExtra("REBOOT_RECOVERY", true)
                    putExtra("SESSION_ID", activeSessionId)
                }

                if (launchIntent != null) {
                    context.startActivity(launchIntent)
                }
            } else {
                Log.i(TAG, "No active session requiring reboot recovery.")
            }
        }
    }
}
