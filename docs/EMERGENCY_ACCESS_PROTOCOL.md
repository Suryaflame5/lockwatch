# LockWatch Emergency Access Protocol & Audit Standard

## 1. Regulatory Context & Student Safety

LockWatch enforces a student-safety emergency mechanism (Section 27, 28, 79). In high-stakes testing environments, a student must never be physically locked into an application during a medical incident, personal crisis, or campus emergency.

---

## 2. Platform-Specific Operation (No Fake Cross-Platform Hacks)

Per **Section 28**, LockWatch does not fake a capability that the operating system does not safely expose.

### Android Operation:
1. When emergency access is confirmed, `AndroidSecurityManager` executes `stopLockTask()`.
2. The student is temporarily returned to normal device operation.
3. An authoritative server countdown (default: 15 seconds) begins.
4. When the countdown expires, `startLockTask()` is automatically re-engaged by `AndroidSecurityManager`.
5. If the student does not return or uninstalls the app, `APP_LEFT` and `OFFLINE` alerts immediately persist on the faculty console.

### iOS Operation:
1. When emergency access is requested, `IOSAssessmentSecurityManager` calls `assessmentSession.end()`.
2. The Apple assessment session releases system restrictions cleanly.
3. Upon expiry of the emergency period, `begin()` is reinvoked to resume assessment mode.
4. All delegate transitions (`assessmentSessionDidEnd`, `assessmentSessionDidBegin`) are transmitted over the realtime telemetry channel.

---

## 3. Immutable Audit Record

Every emergency usage is recorded with immutable metadata:
- Student ID & Register Number
- Session ID & Institution ID
- Device UUID & Hardware Model
- Start Timestamp (Server authoritative)
- End Timestamp (Server authoritative)
- Actual Elapsed Duration
- Reason declared by student
- Resulting security state upon return

Emergency usage is factually reported on the Faculty Console and included in the official Session Summary CSV/PDF Report without prejudicial labels.
