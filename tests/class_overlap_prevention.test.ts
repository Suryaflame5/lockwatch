import test from 'node:test';
import assert from 'node:assert/strict';
import { ClassService } from '../services/backend/dist/services/class.service.js';
import { DataStore } from '../services/backend/dist/store/database.js';
import { SessionStatus, StudentStatus } from '@lockwatch/shared-models';

test('Conflict Detection - Overlapping Active Session Prevention', () => {
  const classService = new ClassService();
  const store = DataStore.getInstance();

  const instId = '11111111-1111-1111-1111-111111111111';
  const facultyId = '33333333-3333-3333-3333-333333333333';
  const studentId = '55555555-5555-5555-5555-555555555003'; // Karthik Raja

  // End initial seed session to test fresh session attachment without conflict
  const seedSession = store.sessions.get('77777777-7777-7777-7777-777777777777');
  if (seedSession) seedSession.status = SessionStatus.ENDED;
  const seedParts = store.getSessionParticipants('77777777-7777-7777-7777-777777777777');
  seedParts.forEach(p => { p.status = StudentStatus.COMPLETED; });

  // 1. Create Class A
  const classA = classService.createClass(facultyId, instId, {
    name: 'Parallel Programming',
    subject: 'CS702 - Parallel Computing',
    department: 'CSE',
    year: '2026',
    semester: 'Semester 7',
    section: 'A',
    classCode: 'PAR-A-CONF'
  });

  classService.joinClassByCode(studentId, 'PAR-A-CONF');

  // 2. Schedule Session 1 for Class A
  const session1 = classService.createClassSession(classA.id, facultyId, instId, {
    name: 'Parallel Computing Lab Exam 1',
    durationMinutes: 60
  });

  session1.status = SessionStatus.ACTIVE;
  classA.activeSessionId = session1.id;

  // 3. Attempting to schedule a second active session for the same class must throw!
  assert.throws(
    () => {
      classService.createClassSession(classA.id, facultyId, instId, {
        name: 'Parallel Computing Lab Exam 2 (Overlap)',
        durationMinutes: 60
      });
    },
    /already has an active session in progress/
  );

  // 4. Verify student conflict detection helper
  const activeStudentSession = store.getActiveSessionForStudent(studentId);
  assert.ok(activeStudentSession);
  assert.equal(activeStudentSession.id, session1.id);
});
