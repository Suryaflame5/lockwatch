package com.lockwatch.security

import android.app.Activity
import android.app.ActivityManager
import android.app.admin.DevicePolicyManager
import android.content.Context
import android.os.Build
import android.util.Log

/**
 * LockTaskController
 * Enforces native Android DevicePolicyManager Lock Task Mode (Kiosk Mode).
 * Disables system navigation, notification shade, recents/overview, and unauthorized app switching.
 */
class LockTaskController(private val context: Context) {

    companion object {
        private const val TAG = "LockTaskController"
    }

    private val dpm = context.getSystemService(Context.DEVICE_POLICY_SERVICE) as DevicePolicyManager
    private val activityManager = context.getSystemService(Context.ACTIVITY_SERVICE) as ActivityManager
    private val adminComponent = LockWatchDeviceAdminReceiver.getComponentName(context)

    /**
     * Checks whether LockWatch is provisioned as an authoritative Device Owner.
     */
    fun isDeviceOwner(): Boolean {
        return dpm.isDeviceOwnerApp(context.packageName)
    }

    /**
     * Checks if this package is whitelisted to start Lock Task Mode without user prompt.
     */
    fun isLockTaskPermitted(): Boolean {
        return dpm.isLockTaskPermitted(context.packageName)
    }

    /**
     * Verifies if the system is currently enforcing Lock Task Mode.
     * Section 15: NEVER FAKE LOCK STATUS.
     */
    fun isLockTaskActive(): Boolean {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            activityManager.lockTaskModeState == ActivityManager.LOCK_TASK_MODE_LOCKED
        } else {
            activityManager.isInLockTaskMode
        }
    }

    /**
     * Configures the strict examination lockdown policy via DevicePolicyManager:
     * 1. Whitelists LockWatch package for Lock Task mode.
     * 2. Disables Home, Recents, Notifications, Keyguard, and System Info.
     */
    fun configureLockTaskPolicies(): Result<Unit> {
        if (!isDeviceOwner()) {
            return Result.failure(
                IllegalStateException("ANDROID_DEVICE_NOT_PROVISIONED: Application is not enrolled as Device Owner.")
            )
        }

        try {
            // Allowlist package
            dpm.setLockTaskPackages(adminComponent, arrayOf(context.packageName))

            // Configure lock task features (API 28+)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                // LOCK_TASK_FEATURE_NONE disables home, overview, notifications, global actions
                // We permit LOCK_TASK_FEATURE_SYSTEM_INFO only if battery/clock status bar icon is required
                dpm.setLockTaskFeatures(
                    adminComponent,
                    DevicePolicyManager.LOCK_TASK_FEATURE_SYSTEM_INFO
                )
            }

            // Disable keyguard features (camera, notifications on lock screen)
            dpm.setKeyguardDisabled(adminComponent, true)

            Log.i(TAG, "Lock Task policies configured successfully by Device Owner.")
            return Result.success(Unit)
        } catch (e: Exception) {
            Log.e(TAG, "Failed to configure Lock Task policies", e)
            return Result.failure(e)
        }
    }

    /**
     * Engages Lock Task Mode on the given Activity.
     */
    fun startLock(activity: Activity): Result<Unit> {
        val configResult = configureLockTaskPolicies()
        if (configResult.isFailure) {
            return configResult
        }

        try {
            activity.startLockTask()

            // Verify lock was established
            if (isLockTaskActive()) {
                Log.i(TAG, "Hardware Lock Task Mode ACTIVATED and VERIFIED.")
                return Result.success(Unit)
            } else {
                Log.e(TAG, "startLockTask() invoked but OS reports lockTaskModeState is not LOCKED.")
                return Result.failure(
                    IllegalStateException("LOCK_VERIFICATION_FAILED: Operating system did not confirm lock task state.")
                )
            }
        } catch (e: Exception) {
            Log.e(TAG, "Exception starting lock task", e)
            return Result.failure(e)
        }
    }

    /**
     * Disengages Lock Task Mode.
     */
    fun stopLock(activity: Activity): Result<Unit> {
        return try {
            activity.stopLockTask()
            Log.i(TAG, "Hardware Lock Task Mode STOPPED.")
            Result.success(Unit)
        } catch (e: Exception) {
            Log.e(TAG, "Exception stopping lock task", e)
            Result.failure(e)
        }
    }
}
