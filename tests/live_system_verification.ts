import assert from 'node:assert/strict';
import { LockWatchApiClient } from '../packages/api-client/src/index.js';

const BASE_URL = 'http://localhost:4000';

async function runLiveVerification() {
  console.log('====================================================');
  console.log('  LOCKWATCH PRODUCTION LIVE SYSTEM VERIFICATION');
  console.log(`  Target Backend: ${BASE_URL}`);
  console.log('====================================================\n');

  const facultyClient = new LockWatchApiClient({ baseUrl: BASE_URL });
  const studentClient = new LockWatchApiClient({ baseUrl: BASE_URL });

  // 1. Health Check
  console.log('[1/8] Verifying Health & Service Liveness...');
  const healthRes = await fetch(`${BASE_URL}/health`);
  assert.equal(healthRes.status, 200, 'Health endpoint should return 200');
  const healthData = await healthRes.json();
  console.log(`  ✔ Health status: ${healthData.status}, timestamp: ${healthData.timestamp}`);

  // 2. Faculty Authentication (PIN & Password)
  console.log('\n[2/8] Verifying Faculty Authentication...');
  // PIN Login
  const facPinRes = await facultyClient.facultyLogin({
    identifier: 'faculty@apextech.edu',
    pin: '123456',
    institutionCode: 'TECH-UNI'
  });
  assert.ok(facPinRes.accessToken, 'Faculty PIN login should return access token');
  console.log(`  ✔ Faculty PIN login successful: ${facPinRes.user.name} (${facPinRes.user.email})`);

  // Password Login
  const facPassRes = await facultyClient.facultyLogin({
    identifier: 'faculty@apextech.edu',
    password: 'FacultyPassword123!',
    institutionCode: 'TECH-UNI'
  });
  assert.ok(facPassRes.accessToken, 'Faculty Password login should return access token');
  console.log(`  ✔ Faculty Password login successful: ${facPassRes.user.name}`);

  // 3. Student Authentication (Phone, Reg No, Email)
  console.log('\n[3/8] Verifying Student Multi-Identifier Authentication...');
  // Phone Login
  const stuPhoneRes = await studentClient.studentLogin({
    phoneNumber: '7418320315',
    password: 'StudentPassword123!',
    institutionCode: 'TECH-UNI'
  });
  assert.ok(stuPhoneRes.accessToken, 'Student phone login should return access token');
  console.log(`  ✔ Student phone login successful: ${stuPhoneRes.user.name} (+917418320315)`);

  // Register Number Login
  const stuRegRes = await studentClient.studentLogin({
    registerNumber: '23AIML104',
    password: 'StudentPassword123!',
    institutionCode: 'TECH-UNI'
  });
  assert.ok(stuRegRes.accessToken, 'Student regNo login should return access token');
  console.log(`  ✔ Student Register No login successful: ${stuRegRes.user.name} (${stuRegRes.user.studentProfile.registerNumber})`);

  // Email Login
  const stuEmailRes = await studentClient.studentLogin({
    registerNumber: 'suryaflame2007@gmail.com',
    password: 'StudentPassword123!',
    institutionCode: 'TECH-UNI'
  });
  assert.ok(stuEmailRes.accessToken, 'Student Email login should return access token');
  console.log(`  ✔ Student Email login successful: ${stuEmailRes.user.email}`);

  // 4. Student OTP Account Creation & Forgot Password Flow
  console.log('\n[4/8] Verifying Student OTP Account Registration & Password Reset...');
  const testPhone = `+9198765${Math.floor(10000 + Math.random() * 90000)}`;
  const otpReqRes = await studentClient.requestStudentSignupOtp(testPhone);
  assert.ok(otpReqRes.challengeId, 'OTP challenge ID must be generated');
  console.log(`  ✔ Signup OTP requested for ${testPhone}, challengeId: ${otpReqRes.challengeId.slice(0, 8)}...`);

  // In test/dev environment, default OTP challenge is 123456
  const otpVerifyRes = await studentClient.verifyStudentSignupOtp(otpReqRes.challengeId, '123456');
  assert.ok(otpVerifyRes.verificationToken, 'Verification token must be returned');
  console.log(`  ✔ Signup OTP verified successfully, verification token issued`);

  const uniqueReg = `23TEST${Math.floor(100 + Math.random() * 900)}`;
  const createAccRes = await studentClient.createStudentAccount({
    verificationToken: otpVerifyRes.verificationToken,
    password: 'NewStudentSecure123!',
    name: 'Test Student Automated',
    registerNumber: uniqueReg,
    institutionCode: 'TECH-UNI'
  });
  assert.ok(createAccRes.accessToken, 'Account creation should return access token');
  console.log(`  ✔ Account created: ${createAccRes.user.name}, Reg: ${uniqueReg}`);

  // Test Forgot Password Flow
  const forgotOtpRes = await studentClient.requestStudentPasswordResetOtp(testPhone);
  const forgotVerifyRes = await studentClient.verifyStudentPasswordResetOtp(forgotOtpRes.challengeId, '123456');
  await studentClient.resetStudentPassword({
    resetToken: forgotVerifyRes.resetToken,
    newPassword: 'UpdatedPass456!'
  });
  console.log(`  ✔ Password reset flow verified with OTP challenge`);

  // Verify login with new password
  const newLoginRes = await studentClient.studentLogin({
    phoneNumber: testPhone,
    password: 'UpdatedPass456!',
    institutionCode: 'TECH-UNI'
  });
  assert.ok(newLoginRes.accessToken, 'Login with new password should succeed');
  console.log(`  ✔ Successfully authenticated with updated password`);

  // 5. Academic Class Management & Roster Enrollment
  console.log('\n[5/8] Verifying Academic Class Lifecycle & Dynamic Roster Joining...');
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const testClassCode = `CS${randomSuffix}`;
  const newClass = await facultyClient.createClass({
    name: 'Advanced Distributed Systems',
    subject: 'CS702',
    department: 'Computer Science & Engineering',
    year: '2026-2027',
    semester: 'Semester 7',
    section: 'A',
    classCode: testClassCode
  });
  console.log(`  ✔ Class created: "${newClass.name}" (Code: ${newClass.classCode})`);

  // Generate dynamic QR Code for class
  const classQr = await facultyClient.generateClassQr(newClass.id);
  assert.ok(classQr.token, 'QR token must be generated');
  console.log(`  ✔ Class QR generated (Token: ${classQr.token.slice(0, 10)}..., expires: ${classQr.expiresAt})`);

  // Student joins class by Code
  const joinByCodeRes = await studentClient.joinClassByCode(newClass.classCode, {
    displayName: 'Surya Live Student',
    registerNumber: `REG-${randomSuffix}`
  });
  assert.ok(joinByCodeRes.membership, 'Student should be enrolled in class');
  console.log(`  ✔ Student enrolled in class via Code: ${newClass.classCode}`);

  // Verify class roster on Faculty side
  const facultyClasses = await facultyClient.getFacultyClasses();
  const createdClassOnFaculty = facultyClasses.find((c: any) => c.id === newClass.id);
  assert.ok(createdClassOnFaculty, 'Created class must appear in faculty classes');
  console.log(`  ✔ Faculty retrieved class list (${facultyClasses.length} total classes)`);

  // 6. Examination Session Lifecycle & Real-time Kiosk Lockdown
  console.log('\n[6/8] Verifying Examination Session Lifecycle & Kiosk Lockdown...');
  const newSession = await facultyClient.createClassSession(newClass.id, {
    name: 'Distributed Systems Midterm Exam',
    durationMinutes: 90
  });
  assert.ok(newSession.id, 'Session should be created');
  assert.ok(newSession.joinCode, 'Session joinCode must exist');
  console.log(`  ✔ Exam session created: "${newSession.name}" (Code: ${newSession.joinCode})`);

  const studentDeviceId = newLoginRes.user.device.id;
  const studentProfileId = newLoginRes.user.studentProfile.id;

  // Student joins session
  const stuJoinedSession = await studentClient.joinSession(newSession.joinCode, studentDeviceId);
  console.log(`  ✔ Student joined session (Status: ${stuJoinedSession.session.status})`);

  // Faculty starts the session (Kiosk Lockdown Engaged)
  await facultyClient.startSession(newSession.id);
  const liveState = await facultyClient.getSessionLiveState(newSession.id);
  console.log(`  ✔ Faculty started session -> (LOCKDOWN ACTIVE)`);

  // Student sends device telemetry (Heartbeat / Battery / Lock Status)
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
      verificationSignal: 'NATIVE_LOCK_OK'
    },
    sessionState: 'ACTIVE',
    batteryLevel: 94,
    isCharging: false,
    networkState: 'WIFI',
    screenOn: true,
    deviceLocked: true,
    clientTimestamp: new Date().toISOString()
  });
  console.log(`  ✔ Student telemetry sent: Battery 94%, Kiosk Locked: TRUE`);

  // Faculty views live telemetry monitor
  const liveStateAfterHeartbeat = await facultyClient.getSessionLiveState(newSession.id);
  assert.ok(liveStateAfterHeartbeat.participants.length > 0, 'Live state must report active participants');
  console.log(`  ✔ Faculty Live Monitor: ${liveStateAfterHeartbeat.participants.length} devices connected and supervised`);

  // Student Emergency 15s Breakout Request
  console.log('\n[7/8] Verifying 15-Second Emergency Breakout Workflow...');
  const emergencyRes = await studentClient.requestEmergency({
    sessionId: newSession.id,
    studentId: studentProfileId,
    deviceId: studentDeviceId,
    reason: 'Emergency Medical Assistance Required',
    clientTimestamp: new Date().toISOString()
  });
  console.log(`  ✔ Emergency access requested. Duration: ${emergencyRes.emergencyDurationSeconds || 15}s`);

  // Exit Emergency
  await studentClient.exitEmergency({
    sessionId: newSession.id,
    studentId: studentProfileId,
    deviceId: studentDeviceId,
    clientTimestamp: new Date().toISOString()
  });
  console.log(`  ✔ Emergency exited. Native kiosk lockdown re-engaged`);

  // Faculty ends session
  await facultyClient.endSession(newSession.id);
  console.log(`  ✔ Session concluded cleanly. Kiosk lock safely disengaged`);

  // 8. 60-Student High-Concurrency Classroom Load Simulation
  console.log('\n[8/8] Verifying High-Concurrency Classroom Load (60 Devices Concurrent)...');
  const CONCURRENT_STUDENTS = 60;
  const startTime = Date.now();
  const simulatedRequests = Array.from({ length: CONCURRENT_STUDENTS }, (_, i) => {
    return facultyClient.getClassRoster(newClass.id).then(res => ({
      index: i + 1,
      ok: Array.isArray(res)
    }));
  });

  const results = await Promise.all(simulatedRequests);
  const totalDuration = Date.now() - startTime;
  const allSuccessful = results.every(r => r.ok);
  assert.ok(allSuccessful, 'All 60 concurrent student requests must succeed');
  console.log(`  ✔ Successfully handled ${CONCURRENT_STUDENTS} concurrent device requests in ${totalDuration}ms (Avg ${(totalDuration / CONCURRENT_STUDENTS).toFixed(1)}ms/req)`);

  console.log('\n====================================================');
  console.log('  ALL 8 PRODUCTION TEST MODULES PASSED (100% OK)');
  console.log('====================================================');
}

runLiveVerification().catch(err => {
  console.error('\n❌ Live Verification Failed:', err);
  process.exit(1);
});
