# LockWatch — Supervised Examination & Classroom Control Platform

[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-v20+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18-cyan.svg)](https://reactjs.org/)
[![Android Enterprise](https://img.shields.io/badge/Android-Device%20Owner%20%2F%20Lock%20Task-3DDC84.svg)](https://developer.android.com/work/dpc/dedicated-devices)
[![Apple AAC](https://img.shields.io/badge/Apple-AEAssessmentSession%20(AAC)-000000.svg)](https://developer.apple.com/documentation/automaticassessmentconfiguration)
[![Tests](https://img.shields.io/badge/Tests-100%25%20Passing-success.svg)](#running-the-test-suite)

**LockWatch** is a production-grade, cross-platform supervised examination and classroom control platform. It provides institutional faculty with authoritative real-time supervision, tamper-proof device lockdown, heartbeat telemetry, and immutable audit logs.

LockWatch uses genuine native operating system security mechanisms — **Android Enterprise Device Owner Lock Task Mode** and **Apple Automatic Assessment Configuration (AAC)** — with zero fake lock UIs, zero browser overlay tricks, and zero mock security boundaries.

---

## Architecture Overview

```
lockwatch/
├── apps/
│   ├── faculty-mobile/         # Faculty Mobile Application (com.lockwatch.faculty, Android & iOS)
│   ├── student-mobile/         # Student Mobile Application (com.lockwatch.student, Android & iOS)
│   └── faculty-web/            # Faculty Web Companion Dashboard
│
├── packages/
│   ├── shared-models/          # Domain contracts, Class Management, entity definitions, and enums
│   ├── validation/             # Zod input validation schemas including Class & Session schemas
│   ├── design-system/          # Obsidian dark theme tokens, status badges & alert colors
│   └── api-client/             # Universal API client with auto token-rotation & offline queue
│
├── services/
│   └── backend/                # TypeScript backend with WebSocket gateway & ExpirationWorker
│
├── native/
│   ├── android-security/       # Kotlin Android SDK DevicePolicyManager & Lock Task module
│   └── ios-security/           # Swift iOS SDK AEAssessmentSession & MDM SAM module
│
├── database/
│   ├── migrations/             # PostgreSQL schema (001_initial, 002_indexes, 003_class_management)
│   └── seed/                   # Seed data (Tech University, Dr. Rajesh Raman, Class AIML-E-8K42)
│
├── infrastructure/             # Docker Compose, NGINX configs, Dockerfiles
├── docs/                       # Security, Deployment, Enrollment, and Class Management Guides
└── tests/                      # Automated unit, integration, and E2E acceptance tests
```

---

## Key Capabilities & Production Integrity

1. **Native Android Security (`mobile/android-security`)**:
   - `DevicePolicyManager.setLockTaskPackages()`
   - `startLockTask()` with `LOCK_TASK_FEATURE_NONE`
   - Explicit disabling of Home, Recents, Notifications, and System Dialogs
   - `BootRecoveryReceiver` restores active sessions after reboot
   - Hardware-backed key generation via `AndroidKeyStore`
2. **Native iOS Security (`mobile/ios-security`)**:
   - Apple `AEAssessmentSession` and `AEAssessmentConfiguration`
   - Official `com.apple.developer.automatic-assessment-configuration` entitlement workflow
   - Supervised MDM Single App Mode (`com.apple.app.lock`) configuration payload
   - Hardware-backed cryptographic device identity in Apple Keychain / Secure Enclave
3. **No Fake Status Principle**:
   - Devices are marked `ACTIVE` only after native OS lockdown confirmation
   - If lockdown fails, `LOCK_FAILED` is immediately broadcast to faculty
4. **Pre-Session Device Readiness Audit (Section 26 & 75)**:
   - Faculty can inspect device readiness before starting a session
   - Identifies non-enrolled Android devices or unenrolled iOS devices
5. **Controlled 15-Second Emergency Access (Section 27 & 28)**:
   - Deliberate student confirmation
   - Immediate high-priority faculty alert
   - Server-authoritative 15-second countdown
   - Automatic re-engagement of hardware lock upon timer expiry
6. **Immutable Audit Trail & Multi-Tenant Isolation**:
   - Strict tenant separation by `institutionId`
   - All faculty actions logged with timestamps, IP addresses, and results
   - Polished CSV and PDF examination summary reports

---

## Quick Start & Local Development

### 1. Install Dependencies
```bash
npm install
```

### 2. Build All Packages & Applications
```bash
npm run build
npm run build --workspace=@lockwatch/faculty-web
npm run build --workspace=@lockwatch/student-mobile
```

### 3. Run Automated Tests
```bash
npm test
```
All unit, integration, and production acceptance tests run and verify:
- Faculty password & PIN authentication with bcrypt
- Session creation, joining, starting, pausing, and ending
- Pre-session device readiness verification
- Idempotent event processing and duplicate rejection
- Realtime telemetry and offline detection
- Complete Section 111 Production Acceptance Scenario

### 4. Start Development Servers
- **Backend API & WebSocket Server**:
  ```bash
  npm run dev:backend
  ```
  Runs on `http://localhost:4000` (WebSocket on `ws://localhost:4000/ws`).
- **Faculty Web Console**:
  ```bash
  npm run dev:faculty
  ```
  Runs on `http://localhost:3000`.
- **Student Mobile Application**:
  ```bash
  npm run dev:student
  ```
  Runs on `http://localhost:3001`.

---

## Pre-Seeded Demonstration Credentials

### Faculty Portal (`/faculty/login`):
- **Institution Code**: `TECH-UNI`
- **Faculty Identifier**: `faculty@apextech.edu` (or `FAC-CS-084`)
- **Password**: `FacultyPassword123!`
- **Quick PIN**: `123456`

### Student Portal (`/student/login`):
- **Institution Code**: `TECH-UNI`
- **Register Number**: `23AIML104` (Arun Kumar - Android Device Owner)
- **Password**: `StudentPassword123!`
- **Active Session Code**: `LW-AI-804`

---

## Documentation Index

- [Security Architecture & Threat Model](docs/SECURITY.md)
- [Production Deployment & Infrastructure Guide](docs/DEPLOYMENT.md)
- [Android Device Owner Enrollment & Provisioning](docs/ANDROID_ENROLLMENT.md)
- [iOS Enrollment & Automatic Assessment Configuration (AAC)](docs/IOS_ENROLLMENT_AND_AAC.md)
- [Emergency Access Protocol & Audit Standard](docs/EMERGENCY_ACCESS_PROTOCOL.md)
- [Student Privacy Notice & Non-Spyware Commitment](docs/PRIVACY_NOTICE.md)

---

## License

Institutional Enterprise License © 2026 LockWatch Supervision Systems.
