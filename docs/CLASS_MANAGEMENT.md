# LockWatch — Class Management & Supervised Sessions Architecture

This document details the persistent **Class Management System** and its distinction from timed **Class Sessions**, the authoritative server-side **Expiration Worker**, the **Offline Safety Watchdog**, and the guarantee of normal phone restoration upon session conclusion.

---

## 1. Class vs. ClassSession Architecture

In LockWatch, an academic course and its timed examination sessions are decoupled into two distinct entities:

| Entity | Lifetime | Purpose | Retention |
| :--- | :--- | :--- | :--- |
| **`Class`** | Persistent (Semester / Year) | Academic container, course info, student roster, join codes, and historic records | Permanent until explicitly archived by faculty |
| **`ClassSession`** | Transient (e.g. 60–90 min) | Timed examination or supervised session requiring native hardware lockdown | Finalized to `ENDED` when `endsAt` expires or faculty stops it |

### Critical Behavioral Guarantee
> **When a session concludes (either through faculty action or automatic expiration at `endsAt`), student devices are immediately released from OS-level lockdown (Android Lock Task Mode / Apple AAC) back to normal phone operation. The student remains permanently enrolled in the Class roster for all subsequent sessions.**

---

## 2. Enrollment Mechanisms

Students can be enrolled into a persistent class via four methods:

1. **Direct Class Code (`AIML-E-8K42`)**:
   - Faculty displays or shares a human-readable 10–12 character uppercase code.
   - Student enters the code in the **LockWatch Student** app under *Join Class*.
   - Server indexes code in O(1) multi-tenant hash index and commits membership with status `ENROLLED`.

2. **Signed QR Token**:
   - Faculty clicks *Join QR Code* in **LockWatch Faculty**.
   - Server generates a cryptographically signed HMAC token with a 2-hour sliding window.
   - Student scans the QR code using the built-in scanner in the student app.
   - Server validates token expiration and authenticates the student's device.

3. **Faculty Single-Student Add**:
   - Faculty adds student by institutional register number (e.g. `23AIML104`).
   - Server verifies institutional record and links device.

4. **Faculty Bulk Import**:
   - Faculty pastes newline- or comma-separated register numbers.
   - System imports all valid students atomically and reports any invalid identifiers.

---

## 3. Session Lifecycle & Authoritative Server Expiration

```
               [ Faculty Creates Class ]
                          │
            [ Students Enrolled in Roster ]
                          │
             [ Schedule Timed Session ]
             (sets scheduledStartTime & endsAt)
                          │
                 [ Pre-Session Lobby ]
             (Verifies Device Owner / AAC)
                          │
               [ Broadcast START_SESSION ]
             (Devices enter Native Lockdown)
                          │
           ┌──────────────┴──────────────┐
           ▼                             ▼
   Faculty Clicks End        Timer Reaches endsAt
           │                             │
           └──────────────┬──────────────┘
                          │
               [ ExpirationWorker Fires ]
                          │
       ┌──────────────────┴──────────────────┐
       ▼                                     ▼
Issue END_SESSION Command             Update Session to ENDED
       │                                     │
Student Phone Released                Clear Active Class Session
(Normal OS operation restored)               │
       │                                     ▼
       └────────────────────────► Persistent Class Roster
                                  Remains Strictly ENROLLED
```

### Server Expiration Worker (`ExpirationWorker`)
- Authoritative daemon scanning every 3,000ms.
- Evaluates `session.endsAt <= now()` across all active sessions.
- Automatically and idempotently executes:
  1. Sets `session.status = SessionStatus.ENDED` and `session.endTime = now()`.
  2. Issues `CommandType.END_SESSION` to all connected devices.
  3. Updates all participants to `StudentStatus.COMPLETED` and `deviceLocked: false`.
  4. Clears `class.activeSessionId`.
  5. Emits `session.ended` and `class.session_ended` to connected WebSockets.

### Offline Safety Watchdog
- Client-side guardian running in `PlatformSecurityBridge`.
- When entering a session with known `endsAt`, the watchdog arms an internal high-priority ticker.
- If network communication is severed (airplane mode, network drop, Wi-Fi outage) and the server's scheduled `endsAt` passes, the local device independently calls `stopLock()` to release the student from lockdown.
- **Guarantee: A student device can never be permanently trapped in a locked state due to network dropouts.**

---

## 4. Conflict & Overlap Prevention

LockWatch enforces strict integrity constraints to prevent concurrent session collisions:

1. **Class-Level Overlap Lock**:
   - A `Class` cannot initiate or schedule a new active session if another session is already in `ACTIVE`, `READY`, or `PAUSED` state.
   - Throws: `Class already has an active session in progress ("...")`.

2. **Student Double-Booking Protection**:
   - If a student is actively participating in a live session across any class, `getActiveSessionForStudent(studentId)` flags the conflict and prevents duplicate session enrollment.

---

## 5. Mobile Applications Reference

### Application A: LockWatch Faculty (`apps/faculty-mobile`)
- **Package ID**: `com.lockwatch.faculty`
- **Tabs**:
  - `Home`: Active session status, quick stats, broadcast controls.
  - `Classes`: Persistent academic course listing, creation modal.
  - `Class Details`: Live roster, single/bulk student management, dynamic QR code generation.
  - `Live Room`: Real-time student grid with lock state, battery %, violations, force re-lock, and emergency override controls.
  - `Analytics`: Class attendance rates, interruption frequency, and emergency incident history.

### Application B: LockWatch Student (`apps/student-mobile`)
- **Package ID**: `com.lockwatch.student`
- **Flow**:
  - `Login`: Register number, password/PIN, institution code.
  - `My Classes`: View all persistent enrolled courses with live session indicators.
  - `Join Class`: Code input (`AIML-E-8K42`) or QR scan.
  - `Device Readiness`: Verifies Android Device Owner / Apple AAC entitlement.
  - `Active Session`: Minimalist locked interface with countdown timer and controlled emergency exit button.
  - `Session Ended`: Confirmation of lockdown release, normal phone operation restoration, and persistent enrollment notification.
