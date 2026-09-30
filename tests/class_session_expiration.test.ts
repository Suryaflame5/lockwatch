import test from 'node:test';
import assert from 'node:assert/strict';
import { ClassService } from '../services/backend/dist/services/class.service.js';
import { SessionService } from '../services/backend/dist/services/session.service.js';
import { ExpirationWorker } from '../services/backend/dist/services/expiration.worker.js';
import { DataStore } from '../services/backend/dist/store/database.js';
import {
  SessionStatus,
  StudentStatus,
  CommandType,
  ClassMembershipStatus
} from '@lockwatch/shared-models';

test('Authoritative ExpirationWorker & Persistent Roster Enrollment Guarantee', () => {
  const classService = new ClassService();
  const sessionService = new SessionService();
  const worker = ExpirationWorker.getInstance();
  const store = DataStore.getInstance();

  const instId = '11111111-1111-1111-1111-111111111111';
  const facultyId = '33333333-3333-3333-3333-333333333333';
  const student1Id = '55555555-5555-5555-5555-555555555001';
  const student2Id = '55555555-5555-5555-5555-555555555002';

  // End initial seed session to test fresh session attachment without conflict
  const seedSession = store.sessions.get('77777777-7777-7777-7777-777777777777');
  if (seedSession) seedSession.status = SessionStatus.ENDED;
  const seedParts = store.getSessionParticipants('77777777-7777-7777-7777-777777777777');
  seedParts.forEach(p => { p.status = StudentStatus.COMPLETED; });

  // 1. Create Class
  const cls = classService.createClass(facultyId, instId, {
    name: 'Embedded Systems Laboratory',
    subject: 'EC401 - Embedded Systems',
    department: 'Electronics & Communication',
    year: '2026-2027',
    semester: 'Semester 4',
    section: 'A',
    classCode: 'EMB-A-EXP1'
  });

  // 2. Enroll Students
  classService.joinClassByCode(student1Id, 'EMB-A-EXP1');
  classService.joinClassByCode(student2Id, 'EMB-A-EXP1');
  assert.equal(store.isStudentEnrolledInClass(cls.id, student1Id), true);
  assert.equal(store.isStudentEnrolledInClass(cls.id, student2Id), true);

  // 3. Schedule Class Session that ends immediately (endsAt in the past to test worker)
  const pastEndTime = new Date(Date.now() - 5000).toISOString(); // 5 seconds ago
  const session = classService.createClassSession(cls.id, facultyId, instId, {
    name: 'Hardware Interfacing Exam',
    durationMinutes: 10,
    scheduledStartTime: new Date(Date.now() - 605000).toISOString()
  });

  // Override endsAt to simulated past time for worker test
  session.endsAt = pastEndTime;
  session.status = SessionStatus.ACTIVE;

  // Verify both students were pre-enrolled as session participants
  const participants = store.getSessionParticipants(session.id);
  assert.equal(participants.length, 2);
  participants.forEach(p => {
    p.status = StudentStatus.ACTIVE;
    p.deviceLocked = true;
  });

  assert.equal(cls.activeSessionId, session.id);

  // 4. Trigger Server Expiration Worker
  const expiredCount = worker.checkAndExpireSessions();
  assert.ok(expiredCount >= 1);

  // 5. Verify Session Terminated
  const updatedSession = store.sessions.get(session.id)!;
  assert.equal(updatedSession.status, SessionStatus.ENDED);
  assert.ok(updatedSession.endTime);

  // 6. Verify Participant Release & Native Command Issuance
  const updatedParticipants = store.getSessionParticipants(session.id);
  for (const p of updatedParticipants) {
    assert.equal(p.status, StudentStatus.COMPLETED);
    assert.equal(p.deviceLocked, false);
    assert.ok(p.completedAt);

    // Verify END_SESSION command was issued to unlock the device
    const cmds = Array.from(store.commands.values()).filter(c => c.sessionId === session.id && c.studentId === p.studentId);
    const endCmd = cmds.find(c => c.commandType === CommandType.END_SESSION);
    assert.ok(endCmd, `END_SESSION command must be queued for student ${p.studentId}`);
  }

  // 7. Verify Class Active Session was cleared
  assert.equal(cls.activeSessionId, null);

  // 8. CRITICAL GUARANTEE: Student Roster Membership Must Still Be Intact!
  assert.equal(store.isStudentEnrolledInClass(cls.id, student1Id), true, 'Student 1 must remain enrolled in persistent class');
  assert.equal(store.isStudentEnrolledInClass(cls.id, student2Id), true, 'Student 2 must remain enrolled in persistent class');

  const rosterAfterSession = classService.getClassRoster(cls.id);
  assert.equal(rosterAfterSession.length, 2);
  assert.equal(rosterAfterSession[0].membershipStatus, ClassMembershipStatus.ENROLLED);
  assert.equal(rosterAfterSession[1].membershipStatus, ClassMembershipStatus.ENROLLED);
});
