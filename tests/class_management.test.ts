import test from 'node:test';
import assert from 'node:assert/strict';
import { ClassService } from '../services/backend/dist/services/class.service.js';
import { DataStore } from '../services/backend/dist/store/database.js';
import { ClassStatus, ClassMembershipStatus } from '@lockwatch/shared-models';

test('ClassService - Full Class Lifecycle, Code & QR Joining, and Roster Management', () => {
  const classService = new ClassService();
  const store = DataStore.getInstance();

  const instId = '11111111-1111-1111-1111-111111111111';
  const facultyId = '33333333-3333-3333-3333-333333333333';
  const student1Id = '55555555-5555-5555-5555-555555555001'; // 23AIML104
  const student2Id = '55555555-5555-5555-5555-555555555002'; // 23AIML118

  // 1. Create a Persistent Academic Class
  const newClass = classService.createClass(facultyId, instId, {
    name: 'Operating Systems & Distributed Architecture',
    subject: 'CS602 - Operating Systems',
    department: 'Computer Science & Engineering',
    year: '2026-2027',
    semester: 'Semester 5',
    section: 'B',
    classCode: 'CS602-B-TEST',
    startTime: '10:00',
    endTime: '11:30'
  });

  assert.ok(newClass.id);
  assert.equal(newClass.classCode, 'CS602-B-TEST');
  assert.equal(newClass.status, ClassStatus.ACTIVE);

  // 2. Student 1 Joins via Class Code
  const codeJoin = classService.joinClassByCode(student1Id, 'CS602-B-TEST');
  assert.equal(codeJoin.class.id, newClass.id);
  assert.equal(codeJoin.membership.status, ClassMembershipStatus.ENROLLED);
  assert.equal(store.isStudentEnrolledInClass(newClass.id, student1Id), true);

  // 3. Generate Signed QR Token and Student 2 Joins via QR
  const qrData = classService.generateClassQr(newClass.id, facultyId);
  assert.ok(qrData.token);
  assert.ok(qrData.qrPayload.includes('CS602-B-TEST'));

  const qrJoin = classService.joinClassByQr(student2Id, qrData.token);
  assert.equal(qrJoin.class.id, newClass.id);
  assert.equal(qrJoin.membership.status, ClassMembershipStatus.ENROLLED);
  assert.equal(store.isStudentEnrolledInClass(newClass.id, student2Id), true);

  // 4. Inspect Class Roster
  const roster = classService.getClassRoster(newClass.id);
  assert.equal(roster.length, 2);
  const student1InRoster = roster.find(r => r.studentId === student1Id);
  assert.ok(student1InRoster);
  assert.equal(student1InRoster.registerNumber, '23AIML104');
  assert.equal(student1InRoster.membershipStatus, ClassMembershipStatus.ENROLLED);

  // 5. Query Student Enrolled Classes
  const student1Classes = classService.getStudentClasses(student1Id);
  const found = student1Classes.find(c => c.class.id === newClass.id);
  assert.ok(found);
  assert.equal(found.membership.status, ClassMembershipStatus.ENROLLED);

  // 6. Remove a student from class
  classService.removeStudentFromClass(newClass.id, student2Id);
  assert.equal(store.isStudentEnrolledInClass(newClass.id, student2Id), false);
  const updatedRoster = classService.getClassRoster(newClass.id);
  assert.equal(updatedRoster.length, 1);

  // 7. Archive Class
  classService.archiveClass(newClass.id, facultyId);
  const archived = classService.getClassById(newClass.id);
  assert.equal(archived.status, ClassStatus.ARCHIVED);
  assert.ok(archived.archivedAt);
});
