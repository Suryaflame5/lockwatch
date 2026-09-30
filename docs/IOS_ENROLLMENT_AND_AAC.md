# iOS / iPadOS Enrollment & Automatic Assessment Configuration (AAC) Guide

## 1. Operating System Enforcement on Apple Devices

LockWatch relies exclusively on Apple's official assessment and device management frameworks. It does NOT claim that an unentitled consumer iOS App Store application can arbitrarily control an iPhone.

LockWatch supports two official paths on iOS / iPadOS:
1. **Automatic Assessment Configuration (AAC)**: Designed specifically for educational assessments. Available on BYOD and institutional devices once Apple grants the entitlement.
2. **Supervised Device MDM Single App Mode**: Designed for institution-owned devices enrolled through Apple School Manager (ASM).

---

## 2. Path A: Automatic Assessment Configuration (AAC)

Apple's Automatic Assessment Configuration framework provides system-level restrictions when `AEAssessmentSession.begin()` is invoked:
- Disables Siri and dictation
- Prevents screen capture, screenshots, and screen recordings
- Stops media playback from other applications
- Clears the system pasteboard when entering and exiting assessment mode
- Disables Universal Clipboard and Handoff
- Suppresses system notifications and incoming prompts (calls, alerts)

### Entitlement Request Workflow:
1. Ensure your organization is enrolled in the **Apple Developer Program** as an accredited educational or testing institution.
2. In Xcode, configure `LockWatch.entitlements`:
   ```xml
   <key>com.apple.developer.automatic-assessment-configuration</key>
   <true/>
   ```
3. Complete Apple's entitlement application form with the following details:
   - Educational Institution Accreditation Certificate
   - Purpose: Supervised in-person academic examinations
   - Documented testing protocols and anti-tamper requirements
4. Once approved, the entitlement is attached to your Provisioning Profile and validated at compile time.

---

## 3. Path B: Institutional Supervised MDM Single App Mode

For institutionally owned iPads and iPhones:
1. Supervise devices using **Apple Configurator** or **Apple School Manager (ASM)** automated enrollment.
2. In your MDM solution (Jamf School, Microsoft Intune, Mosyle, etc.), upload the LockWatch App Lock payload:
   - Payload Type: `com.apple.app.lock`
   - Identifier: `com.lockwatch.app`
3. Single App Mode locks the device directly to LockWatch at the hardware layer, disabling the physical Home button, gestures, and power sleep button if configured.
