import test from 'node:test';
import assert from 'node:assert/strict';
import { SessionService } from '../services/backend/dist/services/session.service.js';
import { DataStore } from '../services/backend/dist/store/database.js';
import { SessionStatus } from '@lockwatch/shared-models';

test('SessionService - Complete Lifecycle (Create -> Join -> Start -> Pause -> Resume -> End)', () => {
  const sessionService = new SessionService();
  const store = DataStore.getInstance();

  const instId = '11111111-1111-1111-1111-111111111111';
  const facultyId = '33333333-3333-3333-3333-333333333333';
  const studentId = '55555555-5555-5555-5555-555555555001';
  const deviceId = '66666666-6666-6666-6666-666666666001';

  // 1. Create Session
  const session = sessionService.createSession({
    facultyId,
    institutionId: instId,
    name: 'Neural Networks Lab Exam',
    subject: 'CS804',
    department: 'CSE',
    className: 'B.Tech AI-A',
    scheduledStartTime: new Date().toISOString(),
    durationMinutes: 60,
    emergencyDurationSeconds: 15
  });

  assert.equal(session.status, SessionStatus.READY);
  assert.ok(session.joinCode.startsWith('LW-'));

  // 2. Join Session
  const joinResult = sessionService.joinSession(studentId, session.joinCode, deviceId);
  assert.equal(joinResult.session.id, session.id);
  assert.equal(joinResult.participant.studentId, studentId);

  // 3. Pre-session Readiness Check
  const readiness = sessionService.getSessionReadiness(session.id);
  assert.equal(readiness.length, 1);
  assert.equal(readiness[0].isReady, true);
  assert.equal(readiness[0].securityCapabilitySupported, true);

  // 4. Start Session
  const started = sessionService.startSession(session.id, facultyId);
  assert.equal(started.status, SessionStatus.ACTIVE);
  assert.ok(started.startTime);

  // 5. Pause Session
  const paused = sessionService.pauseSession(session.id, facultyId);
  assert.equal(paused.status, SessionStatus.PAUSED);

  // 6. Resume Session
  const resumed = sessionService.resumeSession(session.id, facultyId);
  assert.equal(resumed.status, SessionStatus.ACTIVE);

  // 7. End Session
  const ended = sessionService.endSession(session.id, facultyId);
  assert.equal(ended.status, SessionStatus.ENDED);
  assert.ok(ended.endTime);
});
