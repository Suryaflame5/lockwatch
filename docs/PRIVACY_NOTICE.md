# LockWatch Student Privacy Notice & Non-Spyware Commitment

**Last Updated:** September 2026  
**Applicability:** All student devices participating in supervised LockWatch examination sessions.

---

## 1. Non-Spyware Architecture Principle (Section 60)

LockWatch is an **examination supervision and classroom control platform**, NOT a surveillance or spyware application.

LockWatch **DOES NOT** collect, inspect, record, or transmit:
- Personal messages, SMS, or WhatsApp contents
- Personal photos, videos, or local media storage
- Web browsing history outside the active examination application
- Keystrokes or password entries
- Microphone audio recordings
- Camera video recordings
- Ambient room audio
- GPS location coordinates
- Contents of other applications installed on the device

---

## 2. Telemetry Collected During Active Sessions

To guarantee examination integrity, LockWatch collects strictly limited system telemetry:
1. **Device Profile**: Hardware manufacturer, model, operating system version, and cryptographic device UUID.
2. **Supervision Integrity Signals**: Verification that native Lock Task Mode (Android) or Automatic Assessment Configuration (iOS) is active.
3. **Application Lifecycle Events**: Transitions indicating that the application entered foreground, was minimized, or that the screen was turned off.
4. **Heartbeat Metrics**: Battery percentage, charging status, and network connection type (Wi-Fi/Cellular) transmitted every 5–10 seconds.
5. **Emergency Event Logs**: Timestamps and duration of student-triggered emergency access requests.

---

## 3. Data Retention & Institutional Governance

- All session events are retained for the administrative period configured by the participating educational institution (default: 90 days).
- Data is strictly isolated within the institution's tenant partition.
- Audit records and reports can only be accessed by authenticated institutional administrators and assigned faculty invigilators.
