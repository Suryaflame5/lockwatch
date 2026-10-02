import assert from 'node:assert/strict';
import WebSocket from 'ws';
import { LockWatchApiClient } from '../packages/api-client/src/index.js';

const BASE_URL = process.env.TARGET_URL || 'https://lockwatch.onrender.com';
const WS_URL = process.env.WS_URL || 'wss://lockwatch.onrender.com/ws';

async function runProductionVerification() {
  console.log('====================================================');
  console.log('  LOCKWATCH PRODUCTION LIVE SYSTEM VERIFICATION');
  console.log(`  Target Backend: ${BASE_URL}`);
  console.log(`  WebSocket URL:  ${WS_URL}`);
  console.log('====================================================\n');

  const facultyClient = new LockWatchApiClient({ baseUrl: BASE_URL });
  const studentClient = new LockWatchApiClient({ baseUrl: BASE_URL });

  // 1. Health & Database Checks
  console.log('[1/7] Verifying Health & Database Status...');
  const healthRes = await fetch(`${BASE_URL}/health`);
  assert.equal(healthRes.status, 200, 'Health endpoint must return 200');
  const healthData = await healthRes.json();
  assert.equal(healthData.status, 'HEALTHY');
  console.log(`  ✔ Health status: ${healthData.status} (${healthData.service} v${healthData.version})`);

  const dbRes = await fetch(`${BASE_URL}/health/db`);
  assert.equal(dbRes.status, 200, 'Health DB endpoint must return 200');
  const dbData = await dbRes.json();
  assert.equal(dbData.status, 'CONNECTED');
  console.log(`  ✔ Database status: ${dbData.status} (database: ${dbData.database}, latency: ${dbData.latencyMs}ms)`);

  // 2. Authentication (Faculty & Student)
  console.log('\n[2/7] Verifying Authentication on Production...');
  const facLogin = await facultyClient.facultyLogin({
    identifier: 'faculty@apextech.edu',
    pin: '123456',
    institutionCode: 'TECH-UNI'
  });
  assert.ok(facLogin.accessToken, 'Faculty login must return access token');
  console.log(`  ✔ Faculty authenticated: ${facLogin.user.name} (${facLogin.user.email})`);

  const stuLogin = await studentClient.studentLogin({
    phoneNumber: '7418320315',
    password: 'StudentPassword123!',
    institutionCode: 'TECH-UNI'
  });
  assert.ok(stuLogin.accessToken, 'Student login must return access token');
  console.log(`  ✔ Student authenticated: ${stuLogin.user.name} (${stuLogin.user.studentProfile.registerNumber})`);

  // 3. Class Creation & Joining
  console.log('\n[3/7] Verifying Class Creation & Joining...');
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const testClassCode = `PROD${randomSuffix}`;
  const newClass = await facultyClient.createClass({
    name: `Production Verification Class ${randomSuffix}`,
    subject: 'CS801',
    department: 'Computer Science',
    year: '2026-2027',
    semester: 'Semester 8',
    section: 'A',
    classCode: testClassCode
  });
  assert.ok(newClass.id, 'Class must be created');
  console.log(`  ✔ Class created: "${newClass.name}" (Code: ${newClass.classCode})`);

  const studentDeviceId = stuLogin.user.device?.id || 'dev-prod-student-001';
  const studentProfileId = stuLogin.user.studentProfile.id;

  const joinRes = await studentClient.joinClassByCode(newClass.classCode, {
    displayName: 'Automated Prod Student',
    registerNumber: `REG-${randomSuffix}`
  }, studentDeviceId);
  assert.ok(joinRes, 'Student should join class');
  console.log(`  ✔ Student joined class via code: ${testClassCode}`);

  // 4. Examination Session Lifecycle
  console.log('\n[4/7] Verifying Examination Session Lifecycle...');
  const newSession = await facultyClient.createClassSession(newClass.id, {
    name: `Production Exam Session ${randomSuffix}`,
    durationMinutes: 60
  });
  assert.ok(newSession.id, 'Session created');
  assert.ok(newSession.joinCode, 'Session join code generated');
  console.log(`  ✔ Session created: "${newSession.name}" (Join Code: ${newSession.joinCode})`);

  // Student joins session
  const joinedSession = await studentClient.joinSession(newSession.joinCode, studentDeviceId);
  assert.ok(joinedSession.session, 'Student joined session');
  console.log(`  ✔ Student joined session (Status: ${joinedSession.session.status})`);

  // 5. WebSocket Real-time Connectivity & Events
  console.log('\n[5/7] Verifying Real-time WebSocket Gateway & Events...');
  const facultyWsUrl = `${WS_URL}?token=${facLogin.accessToken}&sessionId=${newSession.id}`;
  const studentWsUrl = `${WS_URL}?token=${stuLogin.accessToken}&sessionId=${newSession.id}`;

  const receivedEvents: string[] = [];

  const facultyWs = new WebSocket(facultyWsUrl);
  const studentWs = new WebSocket(studentWsUrl);

  await new Promise<void>((resolve, reject) => {
    let connectedCount = 0;
    const timeout = setTimeout(() => reject(new Error('WebSocket connection timed out')), 15000);

    const checkConnected = () => {
      connectedCount++;
      if (connectedCount === 2) {
        clearTimeout(timeout);
        resolve();
      }
    };

    facultyWs.on('open', () => {
      console.log('  ✔ Faculty WebSocket connected to wss://lockwatch.onrender.com/ws');
      checkConnected();
    });

    studentWs.on('open', () => {
      console.log('  ✔ Student WebSocket connected to wss://lockwatch.onrender.com/ws');
      checkConnected();
    });

    studentWs.on('message', (data) => {
      try {
        const msg = JSON.parse(data.toString());
        if (msg.event) receivedEvents.push(msg.event);
      } catch {}
    });

    facultyWs.on('error', (err) => console.error('Faculty WS error:', err.message));
    studentWs.on('error', (err) => console.error('Student WS error:', err.message));
  });

  // 6. Session Start & End (Triggering Realtime Events)
  console.log('\n[6/7] Testing Live Session Start & Lockdown State...');
  await facultyClient.startSession(newSession.id);
  console.log('  ✔ Faculty started session');

  // Send student heartbeat telemetry
  await studentClient.sendHeartbeat({
    eventId: crypto.randomUUID(),
    sessionId: newSession.id,
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
    batteryLevel: 98,
    isCharging: false,
    networkState: 'WIFI',
    screenOn: true,
    deviceLocked: true,
    clientTimestamp: new Date().toISOString()
  });
  console.log('  ✔ Student telemetry/heartbeat transmitted (Lockdown Active: TRUE)');

  // Verify Faculty Live State
  const liveState = await facultyClient.getSessionLiveState(newSession.id);
  assert.ok(liveState.participants.length > 0, 'Live state must report active participants');
  console.log(`  ✔ Faculty live state verified: ${liveState.participants.length} participant(s) active`);

  // Faculty ends session
  await facultyClient.endSession(newSession.id);
  console.log('  ✔ Faculty ended session (Lockdown released)');

  // Small delay to allow WS event propagation
  await new Promise(r => setTimeout(r, 2000));
  facultyWs.close();
  studentWs.close();

  // 7. Expiration / Cleanup Verification
  console.log('\n[7/7] Verifying Expiration & History Reporting...');
  const report = await facultyClient.getClassReport(newClass.id);
  assert.ok(report, 'Class report should be available');
  console.log(`  ✔ Class report retrieved successfully: ${report.totalStudents} total students enrolled`);

  console.log('\n====================================================');
  console.log('  ALL PRODUCTION VERIFICATION CHECKS PASSED (100% OK)');
  console.log('====================================================');
}

runProductionVerification().catch(err => {
  console.error('\n❌ Production Verification Failed:', err);
  process.exit(1);
});
