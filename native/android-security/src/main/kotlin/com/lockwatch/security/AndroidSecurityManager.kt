package com.lockwatch.security

import android.app.Activity
import android.content.Context
import android.os.Handler
import android.os.Looper

/**
 * AndroidSecurityManager
 * Concrete Android implementation of the PlatformSecurityManager abstraction.
 * Authoritative controller for DevicePolicyManager, Lock Task, and Keystore.
 */
class AndroidSecurityManager(
    private val context: Context,
    private val activityProvider: () -> Activity?
) {

    private val lockTaskController = LockTaskController(context)
    private val keystoreManager = AndroidKeystoreManager()
    private val mainHandler = Handler(Looper.getMainLooper())

    var eventListener: LifecycleSecurityWatcher.SecurityEventListener? = null
        set(value) {
            field = value
            if (value != null) {
                lifecycleWatcher = LifecycleSecurityWatcher(context, lockTaskController, value)
            }
        }

    private var lifecycleWatcher: LifecycleSecurityWatcher? = null

    fun checkCapabilities(): Map<String, String> {
        val isOwner = lockTaskController.isDeviceOwner()
        val isPermitted = lockTaskController.isLockTaskPermitted()

        return mapOf(
            "ANDROID_DEVICE_OWNER" to if (isOwner) "SUPPORTED" else "CONFIGURATION_REQUIRED",
            "ANDROID_LOCK_TASK" to if (isPermitted) "SUPPORTED" else "UNSUPPORTED",
            "REALTIME_CONNECTIVITY" to "SUPPORTED",
            "PUSH_NOTIFICATIONS" to "SUPPORTED"
        )
    }

    fun verifyReadiness(): Pair<Boolean, String?> {
        if (!lockTaskController.isDeviceOwner()) {
            return Pair(false, "Android device is not provisioned as a managed Device Owner.")
        }
        return Pair(true, null)
    }

    fun startLock(): Pair<Boolean, String?> {
        val activity = activityProvider()
            ?: return Pair(false, "No foreground Activity available to engage Lock Task.")

        val result = lockTaskController.startLock(activity)
        return if (result.isSuccess) {
            lifecycleWatcher?.startSupervision()
            Pair(true, null)
        } else {
            Pair(false, result.exceptionOrNull()?.message ?: "Lock Task initiation failed.")
        }
    }

    fun stopLock(): Pair<Boolean, String?> {
        val activity = activityProvider()
            ?: return Pair(false, "No foreground Activity available.")

        lifecycleWatcher?.stopSupervision()
        val result = lockTaskController.stopLock(activity)
        return if (result.isSuccess) Pair(true, null) else Pair(false, result.exceptionOrNull()?.message)
    }

    fun getSecurityStatus(): Map<String, Any> {
        val isOwner = lockTaskController.isDeviceOwner()
        val isLocked = lockTaskController.isLockTaskActive()

        return mapOf(
            "isSupported" to isOwner,
            "isEnrolled" to isOwner,
            "isLocked" to isLocked,
            "activeMechanism" to if (isLocked) "ANDROID_LOCK_TASK" else "NONE",
            "deviceOwner" to isOwner
        )
    }

    fun getPublicKey(): String {
        return keystoreManager.getOrCreateDeviceKeyPair()
    }

    fun enterEmergency(durationSeconds: Int, onComplete: () -> Unit) {
        val activity = activityProvider()
        if (activity != null) {
            // Temporarily suspend Lock Task Mode for the exact authorized emergency duration
            lockTaskController.stopLock(activity)
            mainHandler.postDelayed({
                // Automatically re-engage lock task when emergency window finishes
                lockTaskController.startLock(activity)
                onComplete()
            }, durationSeconds * 1000L)
        }
    }
}
