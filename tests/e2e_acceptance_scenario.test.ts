import test from 'node:test';
import assert from 'node:assert/strict';
import { AuthService } from '../services/backend/dist/services/auth.service.js';
import { SessionService } from '../services/backend/dist/services/session.service.js';
import { EventService } from '../services/backend/dist/services/event.service.js';
import { HeartbeatService } from '../services/backend/dist/services/heartbeat.service.js';
import { ReportService } from '../services/backend/dist/services/report.service.js';
import { DataStore } from '../services/backend/dist/store/database.js';
import { EventType, StudentStatus, SessionStatus, NetworkQuality } from '@lockwatch/shared-models';

test('Production Acceptance Scenario (Section 111)', async () => {
  const authService = new AuthService();
  const sessionService = new SessionService();
  const eventService = new EventService();
  const heartbeatService = new HeartbeatService();
  const reportService = new ReportService();
  const store = DataStore.getInstance();

  // 1. Faculty Login
  const facultyAuth = await authService.facultyLogin({
    identifier: 'faculty@apextech.edu',
    password: 'FacultyPassword123!',
    institutionCode: 'TECH-UNI'
  });
  assert.ok(facultyAuth.accessToken);
  const facultyId = facultyAuth.user.facultyProfile.id;
  const instId = facultyAuth.user.institution.id;

  // 2. Faculty Creates Session & receives Join Code / QR secret
  const session = sessionService.createSession({
    facultyId,
    institutionId: instId,
    name: 'Final Supervised Exam - AI Systems',
    subject: 'AI-401',
    department: 'CSE',
    className: 'B.Tech AI-A',
    scheduledStartTime: new Date().toISOString(),
    durationMinutes: 120,
    emergencyDurationSeconds: 15
  });
  assert.ok(session.joinCode);
  assert.ok(session.joinTokenSecret);

  // 3. Students Join
  const student1Id = '55555555-5555-5555-5555-555555555001'; // Arun (Android DO)
  const device1Id = '66666666-6666-6666-6666-666666666001';
  const student2Id = '55555555-5555-5555-5555-555555555002'; // Priya (iOS AAC)
  const device2Id = '66666666-6666-6666-6666-666666666002';

  sessionService.joinSession(student1Id, session.joinCode, device1Id);
  sessionService.joinSession(student2Id, session.joinCode, device2Id);

  // 4. Pre-Session Readiness Audit
  const readiness = sessionService.getSessionReadiness(session.id);
  assert.equal(readiness.length, 2);
  assert.equal(readiness[0].isReady, true);
  assert.equal(readiness[1].isReady, true);

  // 5. START SESSION
  const startedSession = sessionService.startSession(session.id, facultyId);
  assert.equal(startedSession.status, SessionStatus.ACTIVE);

  // 6. Devices confirm Hardware Lockdown (Lock Task / AAC)
  eventService.processEvent({
    id: 'e2e-evt-001',
    sessionId: session.id,
    studentId: student1Id,
    deviceId: device1Id,
    institutionId: instId,
    type: EventType.LOCK_CONFIRMED,
    sequence: 201,
    clientTimestamp: new Date().toISOString(),
    serverReceivedTimestamp: new Date().toISOString(),
    metadata: { mechanism: 'ANDROID_LOCK_TASK' }
  });

  eventService.processEvent({
    id: 'e2e-evt-002',
    sessionId: session.id,
    studentId: student2Id,
    deviceId: device2Id,
    institutionId: instId,
    type: EventType.LOCK_CONFIRMED,
    sequence: 201,
    clientTimestamp: new Date().toISOString(),
    serverReceivedTimestamp: new Date().toISOString(),
    metadata: { mechanism: 'IOS_AAC' }
  });

  const part1 = store.findParticipant(session.id, student1Id);
  const part2 = store.findParticipant(session.id, student2Id);
  assert.equal(part1?.status, StudentStatus.ACTIVE);
  assert.equal(part2?.status, StudentStatus.ACTIVE);

  // 7. Student 1 attempts to leave supervised application
  eventService.processEvent({
    id: 'e2e-evt-003',
    sessionId: session.id,
    studentId: student1Id,
    deviceId: device1Id,
    institutionId: instId,
    type: EventType.APP_LEFT,
    sequence: 202,
    clientTimestamp: new Date().toISOString(),
    serverReceivedTimestamp: new Date().toISOString(),
    metadata: {}
  });

  assert.equal(part1?.status, StudentStatus.LEFT_SUPERVISION);
  assert.equal(part1?.interruptionCount, 1);

  // Alerts generated for faculty
  const alerts = store.getSessionAlerts(session.id);
  assert.ok(alerts.find(a => a.type === EventType.APP_LEFT));

  // 8. Student 1 returns to supervised session
  eventService.processEvent({
    id: 'e2e-evt-004',
    sessionId: session.id,
    studentId: student1Id,
    deviceId: device1Id,
    institutionId: instId,
    type: EventType.APP_RETURNED,
    sequence: 203,
    clientTimestamp: new Date().toISOString(),
    serverReceivedTimestamp: new Date().toISOString(),
    metadata: {}
  });

  assert.equal(part1?.status, StudentStatus.ACTIVE);

  // 9. Student 2 Requests Emergency Access
  eventService.processEvent({
    id: 'e2e-evt-005',
    sessionId: session.id,
    studentId: student2Id,
    deviceId: device2Id,
    institutionId: instId,
    type: EventType.EMERGENCY_STARTED,
    sequence: 202,
    clientTimestamp: new Date().toISOString(),
    serverReceivedTimestamp: new Date().toISOString(),
    metadata: { reason: 'Medical urgent call' }
  });
  assert.equal(part2?.status, StudentStatus.EMERGENCY);
  assert.equal(part2?.emergencyUsageCount, 1);

  // 10. Student 2 Emergency Ends
  eventService.processEvent({
    id: 'e2e-evt-006',
    sessionId: session.id,
    studentId: student2Id,
    deviceId: device2Id,
    institutionId: instId,
    type: EventType.EMERGENCY_ENDED,
    sequence: 203,
    clientTimestamp: new Date().toISOString(),
    serverReceivedTimestamp: new Date().toISOString(),
    metadata: {}
  });
  assert.equal(part2?.status, StudentStatus.ACTIVE);

  // 11. Faculty Ends Session
  const ended = sessionService.endSession(session.id, facultyId);
  assert.equal(ended.status, SessionStatus.ENDED);

  // 12. Generate Server-Side Audit Report & CSV
  const report = reportService.generateSessionReport(session.id);
  assert.equal(report.metrics.totalStudents, 2);
  assert.equal(report.metrics.completed, 2);

  const csv = reportService.generateCsv(session.id);
  assert.ok(csv.includes('23AIML104'));
  assert.ok(csv.includes('23AIML118'));
});
