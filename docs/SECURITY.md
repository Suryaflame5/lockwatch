# LockWatch Security Architecture & Threat Model

## 1. Zero-Trust Security Philosophy

LockWatch is engineered around operating system-enforced security boundaries, eliminating visual illusions, browser overlay bypasses, and fake mock states.

### Core Principles
1. **Never Assume — Verify**: A student device is never marked as `ACTIVE` or `LOCKED` unless authoritative native OS APIs confirm that kiosk or assessment mode has been established.
2. **Untrusted Client Environment**: Client timestamps, client roles, client booleans, and network sequences are treated as untrusted until validated and sequenced by the server.
3. **No Spyware Architecture**: LockWatch detects examination supervision interruptions. It strictly avoids reading private photos, SMS, WhatsApp contents, keystrokes, personal browser history, microphone audio, or non-educational system files.

---

## 2. Threat Model & Mitigations

| Threat | Attack Vector | Mitigation in LockWatch |
| :--- | :--- | :--- |
| **App Switching / Multitasking** | Pressing Home, Recents, or Swiping to switch apps | **Android**: `DevicePolicyManager.setLockTaskFeatures(LOCK_TASK_FEATURE_NONE)` and `startLockTask()` disables Home, Overview, and Notifications.<br>**iOS**: Apple `AEAssessmentSession` locks the device into the assessment app and disables multitasking. |
| **Notification Shade Evasion** | Pulling down status bar to open unauthorized messaging app or browser | Managed Lock Task mode explicitly disables the notification expander and status pull-down. |
| **Screen Off / Phone Sleep Cheat** | Turning screen off and back on to bypass UI locks | `LifecycleSecurityWatcher` distinguishes screen sleep from application exit. On wake, OS lock integrity is re-verified; if the lock was dropped, `ASSESSMENT_INTERRUPTED` is fired immediately. |
| **Hardware Reboot Attack** | Powering off device to clear runtime restrictions | Persisted encrypted session state is checked upon `BOOT_COMPLETED` by `BootRecoveryReceiver`. If session duration remains active, lockdown re-engages and `DEVICE_REBOOTED` is flagged to faculty. |
| **Token & Request Replay** | Replaying past session events or heartbeat packets | Every event includes monotonic `sequence` and cryptographic UUID `eventId`. Server strictly enforces unique `(deviceId, sequence)` constraints. |
| **Student Privilege Escalation** | Invoking faculty endpoints (`/faculty/*`) with student JWT | Server-side RBAC guards inspect signed JWT claims and deny access to faculty APIs with HTTP 403 Forbidden. |
| **Cross-Tenant Data Leakage** | Institution A faculty attempting to query Institution B sessions | Every database query and WebSocket subscription is constrained by `institutionId`. |

---

## 3. Cryptographic Hardware Identity

Each student device generates a 256-bit elliptic curve key pair stored inside the hardware-backed security enclave:
- **Android**: Generated via `KeyGenParameterSpec` inside `AndroidKeyStore` (hardware StrongBox / TEE).
- **iOS**: Generated with `kSecAttrKeyTypeECSECPrimeRandom` inside Apple Keychain / Secure Enclave.

Public keys are registered with the institution upon device enrollment, allowing cryptographic non-repudiation of event signatures.

---

## 4. Role-Based Access Control (RBAC)

LockWatch defines five distinct security roles:
- `SUPER_ADMIN`: Cross-institutional system governance and infrastructure health.
- `INSTITUTION_ADMIN`: Institutional tenant management, faculty onboarding, retention policies.
- `FACULTY`: Authorized session creation, start/pause/end lifecycle control, live monitoring, report generation.
- `INVIGILATOR`: Assigned examination room monitoring and alert acknowledgment.
- `STUDENT`: Participation in permitted sessions, verified device telemetry transmission, emergency access requests.
