package com.lockwatch.security

import android.app.admin.DeviceAdminReceiver
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.util.Log

/**
 * LockWatchDeviceAdminReceiver
 * Authoritative Device Administrator Receiver required for Device Owner (DO)
 * and Profile Owner management under Android Enterprise.
 */
class LockWatchDeviceAdminReceiver : DeviceAdminReceiver() {

    companion object {
        private const val TAG = "LockWatchAdminReceiver"

        fun getComponentName(context: Context): ComponentName {
            return ComponentName(context.applicationContext, LockWatchDeviceAdminReceiver::class.java)
        }
    }

    override fun onEnabled(context: Context, intent: Intent) {
        super.onEnabled(context, intent)
        Log.i(TAG, "Device Administrator Authority ENABLED for LockWatch.")
    }

    override fun onDisabled(context: Context, intent: Intent) {
        super.onDisabled(context, intent)
        Log.w(TAG, "WARNING: Device Administrator Authority DISABLED for LockWatch.")
    }

    override fun onProfileProvisioningComplete(context: Context, intent: Intent) {
        super.onProfileProvisioningComplete(context, intent)
        Log.i(TAG, "Managed Device Provisioning completed successfully.")
        // Device Owner is now active. LockTask configuration can now be enforced.
    }

    override fun onLockTaskModeEntering(context: Context, intent: Intent, pkg: String) {
        super.onLockTaskModeEntering(context, intent, pkg)
        Log.i(TAG, "DevicePolicyManager confirmed: Lock Task Mode ENTERED for package: $pkg")
    }

    override fun onLockTaskModeExiting(context: Context, intent: Intent) {
        super.onLockTaskModeExiting(context, intent)
        Log.w(TAG, "DevicePolicyManager confirmed: Lock Task Mode EXITED.")
    }
}
