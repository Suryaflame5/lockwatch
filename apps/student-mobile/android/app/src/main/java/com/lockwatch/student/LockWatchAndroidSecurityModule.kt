package com.lockwatch.student

import android.app.Activity
import android.content.Context
import com.lockwatch.security.AndroidSecurityManager
import com.lockwatch.security.LockTaskController

/**
 * Native Security Module for LockWatch Student Android Application.
 * Directly interfaces DevicePolicyManager, Lock Task Mode, and Android Keystore.
 */
class LockWatchAndroidSecurityModule(
    private val context: Context,
    private val activityProvider: () -> Activity? = { null }
) {

    private val securityManager = AndroidSecurityManager(context, activityProvider)
    private val lockTaskController = LockTaskController(context)

    fun checkCapabilities(): Map<String, Any> {
        val caps = securityManager.checkCapabilities()
        val isOwner = lockTaskController.isDeviceOwner()
        val isPermitted = lockTaskController.isLockTaskPermitted()

        return mapOf(
            "isDeviceOwner" to isOwner,
            "isLockTaskPermitted" to isPermitted,
            "capabilities" to caps
        )
    }

    fun verifyReadiness(): Boolean {
        return securityManager.verifyReadiness().first
    }

    fun startLock(activity: Activity? = null): Boolean {
        return if (activity != null) {
            lockTaskController.startLock(activity).isSuccess
        } else {
            securityManager.startLock().first
        }
    }

    fun stopLock(activity: Activity? = null): Boolean {
        return if (activity != null) {
            lockTaskController.stopLock(activity).isSuccess
        } else {
            securityManager.stopLock().first
        }
    }

    fun getSecurityStatus(): Map<String, Any> {
        return securityManager.getSecurityStatus()
    }

    fun enterEmergency(activity: Activity?, durationSeconds: Int, onComplete: () -> Unit = {}): Boolean {
        if (activity != null) {
            lockTaskController.stopLock(activity)
            android.os.Handler(android.os.Looper.getMainLooper()).postDelayed({
                lockTaskController.startLock(activity)
                onComplete()
            }, durationSeconds * 1000L)
            return true
        }
        securityManager.enterEmergency(durationSeconds, onComplete)
        return true
    }

    fun exitEmergency(activity: Activity? = null): Boolean {
        return if (activity != null) {
            lockTaskController.startLock(activity).isSuccess
        } else {
            securityManager.startLock().first
        }
    }
}
