# Android Device Owner Provisioning & Enrollment Guide

## 1. Overview of Android Management Authority

Under Android Enterprise architecture, high-security features like **Lock Task Mode** (kiosk lockdown without user exit prompt), status bar disabling, and package allowlisting require the application to be provisioned as a **Device Owner (DO)**.

LockWatch strictly rejects simulated overlay tricks or abuse of Accessibility Services as the security boundary.

---

## 2. Provisioning Methods

### Method A: USB ADB Provisioning (Development & Institutional Testing)
1. Enable **Developer Options** and **USB Debugging** on the target Android device.
2. Install the production LockWatch APK:
   ```bash
   adb install -r LockWatch.apk
   ```
3. Set LockWatch as the Device Owner via ADB:
   ```bash
   adb shell dpm set-device-owner com.lockwatch.security/.LockWatchDeviceAdminReceiver
   ```
4. Verify enrollment status:
   ```bash
   adb shell dumpsys device_policy
   ```
   Confirm that `mDeviceOwner` points to `com.lockwatch.security`.

---

### Method B: QR Code Provisioning (New or Factory-Reset Devices)
For institutional mass rollout on clean devices:
1. Turn on a factory-reset Android device.
2. Tap the "Welcome" setup screen 6 times consecutively.
3. The device launches the built-in Android Enterprise QR code reader.
4. Scan the institutional provisioning QR code:
```json
{
  "android.app.extra.PROVISIONING_DEVICE_ADMIN_COMPONENT_NAME": "com.lockwatch.security/.LockWatchDeviceAdminReceiver",
  "android.app.extra.PROVISIONING_DEVICE_ADMIN_PACKAGE_DOWNLOAD_LOCATION": "https://dist.lockwatch.edu/apps/lockwatch-production.apk",
  "android.app.extra.PROVISIONING_DEVICE_ADMIN_PACKAGE_CHECKSUM": "4a7d...<SHA-256_CHECKSUM>",
  "android.app.extra.PROVISIONING_ADMIN_EXTRAS_BUNDLE": {
    "institution_code": "TECH-UNI"
  }
}
```
5. Android automatically downloads the package, verifies the SHA-256 checksum, and appoints LockWatch as Device Owner.

---

### Method C: Android Zero-Touch & Samsung Knox Mobile Enrollment (KME)
For institutional corporate/education purchase:
1. Register institutional IMEI / Serial Numbers with the Zero-Touch portal or Samsung Knox portal.
2. Assign the LockWatch DPC configuration profile.
3. When students or faculty power on the device out-of-the-box, it provisions LockWatch as Device Owner automatically upon connecting to Wi-Fi.

---

## 3. Verifying Production Enrollment Status

Before allowing an examination to begin, LockWatch runs `SecurityCapabilityService.evaluateDeviceCapabilities(device)`:
- `isDeviceOwner == true` -> Device is marked `SECURE_READY`.
- `isDeviceOwner == false` -> Device is marked `NOT_READY`.
- In accordance with Section 21, the system refuses to downgrade silently to an insecure mode.
