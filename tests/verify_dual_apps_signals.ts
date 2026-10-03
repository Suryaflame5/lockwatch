import assert from 'node:assert/strict';
import WebSocket from 'ws';
import { LockWatchApiClient } from '../packages/api-client/src/index.js';

const BASE_URL = process.env.TARGET_URL || 'https://lockwatch.onrender.com';
const WS_URL = process.env.WS_URL || 'wss://lockwatch.onrender.com/ws';

async function testDualAppSignaling() {
  console.log('================================================================');
  console.log('  LOCKWATCH DUAL APPLICATION DATA & SIGNAL VERIFICATION');
  console.log(`  Backend:   ${BASE_URL}`);
  console.log(`  WebSocket: ${WS_URL}`);
  console.log('================================================================\n');

  const facultyClient = new LockWatchApiClient({ baseUrl: BASE_URL });
  const studentClient = new LockWatchApiClient({ baseUrl: BASE_URL });

  // 1. Authentication & Profile Data Retrieval
  console.log('[Phase 1: Dual Application Authentication & Data Retrieval]');
  const facultyAuth = await facultyClient.facultyLogin({
    identifier: 'faculty@apextech.edu',
    pin: '123456',
    institutionCode: 'TECH-UNI'
  });
  assert.ok(facultyAuth.accessToken, 'Faculty must obtain access token');
  console.log(`  [Faculty App] Authenticated as: ${facultyAuth.user.name} (${facultyAuth.user.email})`);

  const studentAuth = await studentClient.studentLogin({
    phoneNumber: '7418320315',
    password: 'StudentPassword123!',
    institutionCode: 'TECH-UNI'
  });
  assert.ok(studentAuth.accessToken, 'Student must obtain access token');
  console.log(`  [Student App] Authenticated as: ${studentAuth.user.name} (Reg: ${studentAuth.user.studentProfile.registerNumber})`);

  // 2. Class & Roster Data Synchronization
  console.log('\n[Phase 2: Class & Roster Data Synchronization]');
  const suffix = Math.floor(1000 + Math.random() * 9000);
  const classCode = `SIG${suffix}`;
  const createdClass = await facultyClient.createClass({
    name: `Signaling Verification Class ${suffix}`,
    subject: 'CS808',
    department: 'Computer Science',
    year: '2026-2027',
    semester: 'Semester 8',
    section: 'A',
    classCode
  });
  console.log(`  [Faculty App] Created Class: "${createdClass.name}" (Code: ${classCode})`);

  const studentDeviceId = studentAuth.user.device?.id || 'dev-prod-student-001';
  const studentProfileId = studentAuth.user.studentProfile.id;

  await studentClient.joinClassByCode(classCode, {
    displayName: studentAuth.user.name,
    registerNumber: studentAuth.user.studentProfile.registerNumber
  }, studentDeviceId);
  console.log(`  [Student App] Successfully joined Class "${classCode}"`);

  const roster = await facultyClient.getClassRoster(createdClass.id);
  assert.ok(roster.length > 0, 'Roster must contain joined student');
  console.log(`  [Faculty App] Roster synchronized: ${roster.length} student(s) enrolled`);

  // 3. Exam Session Creation & Join Signal
  console.log('\n[Phase 3: Session Creation & Join Data Exchange]');
  const session = await facultyClient.createClassSession(createdClass.id, {
    name: `Live Exam Session ${suffix}`,
    durationMinutes: 45
  });
  console.log(`  [Faculty App] Created Session: "${session.name}" (Code: ${session.joinCode})`);

  const joinSessionResult = await studentClient.joinSession(session.joinCode, studentDeviceId);
  assert.equal(joinSessionResult.session.id, session.id);
  console.log(`  [Student App] Joined Session via code: ${session.joinCode} (Status: ${joinSessionResult.session.status})`);

  // 4. Bidirectional Real-time WebSocket Signal Channels
  console.log('\n[Phase 4: Establishing Bidirectional Real-time Signal Channels]');
  const facultyWsUrl = `${WS_URL}?token=${facultyAuth.accessToken}&sessionId=${session.id}`;
  const studentWsUrl = `${WS_URL}?token=${studentAuth.accessToken}&sessionId=${session.id}`;

  const studentReceivedSignals: any[] = [];
  const facultyReceivedSignals: any[] = [];

  const facultyWs = new WebSocket(facultyWsUrl);
  const studentWs = new WebSocket(studentWsUrl);

  await new Promise<void>((resolve, reject) => {
    let connected = 0;
    const timeout = setTimeout(() => reject(new Error('WebSocket channels timed out')), 15000);

    const onConnected = () => {
      connected++;
      if (connected === 2) {
        clearTimeout(timeout);
        resolve();
      }
    };

    facultyWs.on('open', () => {
      console.log('  ✔ [Faculty App WS] Connected to realtime gateway');
      onConnected();
    });

    studentWs.on('open', () => {
      console.log('  ✔ [Student App WS] Connected to realtime gateway');
      onConnected();
    });

    studentWs.on('message', (data) => {
      try {
        const msg = JSON.parse(data.toString());
        studentReceivedSignals.push(msg);
        console.log(`  📡 [Student App WS] Received Signal: "${msg.event}"`);
      } catch {}
    });

    facultyWs.on('message', (data) => {
      try {
        const msg = JSON.parse(data.toString());
        facultyReceivedSignals.push(msg);
        console.log(`  📡 [Faculty App WS] Received Signal: "${msg.event}"`);
      } catch {}
    });

    facultyWs.on('error', (err) => console.error('Faculty WS error:', err.message));
    studentWs.on('error', (err) => console.error('Student WS error:', err.message));
  });

  // 5. Signal: Start Session (Faculty -> Student)
  console.log('\n[Phase 5: Signal Exchange - Session Start]');
  await facultyClient.startSession(session.id);
  console.log('  [Faculty App] Emitted: START_SESSION');

  // Allow WS event propagation
  await new Promise(r => setTimeout(r, 2000));
  const startEvent = studentReceivedSignals.find(s => s.event === 'session.started');
  assert.ok(startEvent, 'Student must receive session.started event signal');
  console.log('  ✔ [Student App] Verified receipt of session.started signal from Faculty');

  // 6. Signal: Heartbeat & Native Lockdown Telemetry (Student -> Faculty)
  console.log('\n[Phase 6: Signal Exchange - Student Lockdown Telemetry]');
  await studentClient.sendHeartbeat({
    eventId: crypto.randomUUID(),
    sessionId: session.id,
    studentId: studentProfileId,
    deviceId: studentDeviceId,
    sequence: 1,
    platform: 'ANDROID',
    appVersion: '1.0.0',
    securityState: {
      isSupervised: true,
      isLockActive: true,
      nativeMechanism: 'ANDROID_LOCK_TASK',
      verificationSignal: 'CONFIRMED_BY_OS'
    },
    sessionState: 'ACTIVE',
    batteryLevel: 94,
    isCharging: true,
    networkState: 'WIFI',
    screenOn: true,
    deviceLocked: true,
    clientTimestamp: new Date().toISOString()
  });
  console.log('  [Student App] Transmitted Heartbeat Telemetry (Lock: ACTIVE, Battery: 94%, Power: CHARGING)');

  // Faculty Live Monitor checks data
  await new Promise(r => setTimeout(r, 1500));
  const liveMonitor = await facultyClient.getSessionLiveState(session.id);
  assert.ok(liveMonitor.participants.length > 0, 'Faculty live monitor must show participants');
  const participantData = liveMonitor.participants[0];
  console.log(`  ✔ [Faculty App Live Monitor] Participant: ${participantData.studentName} | Status: ${participantData.status} | Battery: ${participantData.batteryLevel}%`);
  assert.equal(participantData.batteryLevel, 94, 'Faculty must observe student exact battery level');

  // Verify real-time signal received on Faculty WebSocket
  const telemetrySignal = facultyReceivedSignals.find(s => s.event === 'student.telemetry');
  assert.ok(telemetrySignal, 'Faculty must receive student.telemetry signal');
  console.log(`  ✔ [Faculty App WS] Verified real-time telemetry signal received (Battery: ${telemetrySignal.data.batteryLevel}%, Device Locked: ${telemetrySignal.data.deviceLocked})`);
  assert.equal(telemetrySignal.data.deviceLocked, true);
  assert.equal(telemetrySignal.data.batteryLevel, 94);

  // 7. Signal: Pause Session (Faculty -> Student)
  console.log('\n[Phase 7: Signal Exchange - Session Pause]');
  await facultyClient.pauseSession(session.id);
  console.log('  [Faculty App] Emitted: PAUSE_SESSION');

  await new Promise(r => setTimeout(r, 2000));
  const pauseEvent = studentReceivedSignals.find(s => s.event === 'session.paused');
  assert.ok(pauseEvent, 'Student must receive session.paused event signal');
  console.log('  ✔ [Student App] Verified receipt of session.paused signal from Faculty');

  // 8. Signal: Resume Session (Faculty -> Student)
  console.log('\n[Phase 8: Signal Exchange - Session Resume]');
  await facultyClient.resumeSession(session.id);
  console.log('  [Faculty App] Emitted: RESUME_SESSION');

  await new Promise(r => setTimeout(r, 2000));
  const resumeEvent = studentReceivedSignals.find(s => s.event === 'session.resumed');
  assert.ok(resumeEvent, 'Student must receive session.resumed event signal');
  console.log('  ✔ [Student App] Verified receipt of session.resumed signal from Faculty');

  // 9. Signal: Emergency Breakout Notification (Student -> Faculty)
  console.log('\n[Phase 9: Signal Exchange - Student Emergency Alert]');
  await studentClient.requestEmergency({
    sessionId: session.id,
    studentId: studentProfileId,
    deviceId: studentDeviceId,
    reason: 'Medical Emergency Alert',
    clientTimestamp: new Date().toISOString()
  });
  console.log('  [Student App] Dispatched Emergency Breakout Request');

  await new Promise(r => setTimeout(r, 1500));
  const liveStateEmergency = await facultyClient.getSessionLiveState(session.id);
  console.log(`  ✔ [Faculty App] Monitored status during emergency: ${liveStateEmergency.participants[0].status}`);

  // Exit emergency & re-lock
  await studentClient.exitEmergency({
    sessionId: session.id,
    studentId: studentProfileId,
    deviceId: studentDeviceId,
    clientTimestamp: new Date().toISOString()
  });
  console.log('  [Student App] Emergency Exit & Re-lock Engaged');

  // 10. Signal: End Session (Faculty -> Student)
  console.log('\n[Phase 10: Signal Exchange - Session End & Release]');
  await facultyClient.endSession(session.id);
  console.log('  [Faculty App] Emitted: END_SESSION');

  await new Promise(r => setTimeout(r, 2000));
  const endEvent = studentReceivedSignals.find(s => s.event === 'session.ended');
  assert.ok(endEvent, 'Student must receive session.ended event signal');
  console.log('  ✔ [Student App] Verified receipt of session.ended signal (Lock Task Released)');

  facultyWs.close();
  studentWs.close();

  console.log('\n================================================================');
  console.log('  ALL DUAL APPLICATION DATA & SIGNAL CHECKS PASSED (100% OK)');
  console.log('================================================================');
}

testDualAppSignaling().catch((err) => {
  console.error('\n❌ Dual App Signaling Verification Failed:', err);
  process.exit(1);
});
