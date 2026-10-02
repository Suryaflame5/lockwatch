package com.lockwatch.student.security

import android.app.Activity
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.BatteryManager
import com.lockwatch.security.AndroidSecurityManager
import com.lockwatch.security.LockTaskController

class SecurityController(
    private val context: Context,
    private val activityProvider: () -> Activity?
) {

    private val lockTaskController = LockTaskController(context)
    private val securityManager = AndroidSecurityManager(context, activityProvider)

    fun isDeviceOwner(): Boolean {
        return lockTaskController.isDeviceOwner()
    }

    fun isLockTaskPermitted(): Boolean {
        return lockTaskController.isLockTaskPermitted()
    }

    fun isLockTaskActive(): Boolean {
        return lockTaskController.isLockTaskActive()
    }

    fun checkReadiness(): Pair<Boolean, String?> {
        val isOwner = lockTaskController.isDeviceOwner()
        if (!isOwner) {
            return Pair(false, "Device is not enrolled as a managed Device Owner. Provisioning required via ADB or QR.")
        }
        val isPermitted = lockTaskController.isLockTaskPermitted()
        if (!isPermitted) {
            return Pair(false, "Lock Task mode is not allowlisted for LockWatch.")
        }
        return Pair(true, null)
    }

    fun startLock(activity: Activity): Result<Unit> {
        return lockTaskController.startLock(activity)
    }

    fun stopLock(activity: Activity): Result<Unit> {
        return lockTaskController.stopLock(activity)
    }

    fun getBatteryInfo(): Pair<Int, Boolean> {
        val batteryIntent = context.registerReceiver(null, IntentFilter(Intent.ACTION_BATTERY_CHANGED))
        val level = batteryIntent?.getIntExtra(BatteryManager.EXTRA_LEVEL, -1) ?: -1
        val scale = batteryIntent?.getIntExtra(BatteryManager.EXTRA_SCALE, -1) ?: -1
        val status = batteryIntent?.getIntExtra(BatteryManager.EXTRA_STATUS, -1) ?: -1

        val percentage = if (level != -1 && scale != -1) {
            (level * 100 / scale.toFloat()).toInt()
        } else {
            100
        }

        val isCharging = status == BatteryManager.BATTERY_STATUS_CHARGING ||
                status == BatteryManager.BATTERY_STATUS_FULL

        return Pair(percentage, isCharging)
    }
}
