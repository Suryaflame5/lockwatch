package com.lockwatch.student

import android.content.Context

/**
 * Package registry providing native LockWatch Android Security modules.
 */
class LockWatchAndroidSecurityPackage(private val context: Context) {
    val securityModule: LockWatchAndroidSecurityModule by lazy {
        LockWatchAndroidSecurityModule(context)
    }
}
