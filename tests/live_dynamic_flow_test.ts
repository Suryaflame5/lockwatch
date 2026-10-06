import { LockWatchApiClient } from '@lockwatch/api-client';

async function testDynamicFlow() {
  console.log('--- STARTING DYNAMIC REAL-TIME CLASS & SESSION FLOW TEST ---');

  const facultyClient = new LockWatchApiClient({ baseUrl: 'http://localhost:4000' });
  const studentClient = new LockWatchApiClient({ baseUrl: 'http://localhost:4000' });

  // 1. Faculty Login
  console.log('1. Logging in as Faculty...');
  const facAuth = await facultyClient.facultyLogin({
    identifier: 'faculty@apextech.edu',
    pin: '123456',
    institutionCode: 'TECH-UNI'
  });
  console.log('   Faculty authenticated:', facAuth.user.name);

  // 2. Student Login
  console.log('2. Logging in as Student Surya...');
  const stuAuth = await studentClient.studentLogin({
    phoneNumber: '+917418320315',
    password: 'surya@2007',
    institutionCode: 'TECH-UNI'
  });
  console.log('   Student authenticated:', stuAuth.user.name, 'Reg:', stuAuth.user.studentProfile.registerNumber);

  // 3. Faculty creates a brand new dynamic class with a unique join code
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const testClassCode = `AI-LAB-${randomSuffix}`;
  console.log(`3. Faculty creating new class with code: ${testClassCode}...`);
  const newClass = await facultyClient.createClass({
    name: `Deep Learning Lab Section ${randomSuffix}`,
    subject: 'CS899 - Deep Learning Architectures',
    department: 'Artificial Intelligence',
    year: '2026-2027',
    semester: 'Semester 7',
    section: 'D',
    classCode: testClassCode
  });
  console.log('   Class created successfully! ID:', newClass.id, 'Code:', newClass.classCode);

  // 4. Student joins this newly created class using the class code
  console.log(`4. Student joining class using code "${testClassCode}"...`);
  const joinResult = await studentClient.joinClassByCode(testClassCode, {
    displayName: 'Surya',
    registerNumber: '23AIML007'
  });
  console.log('   Student joined class:', joinResult.message, 'Class:', joinResult.class.name);

  // 5. Faculty verifies roster dynamically
  console.log('5. Faculty checking updated class roster...');
  const roster = await facultyClient.getClassRoster(newClass.id);
  const foundInRoster = roster.find(r => r.registerNumber === '23AIML007');
  if (!foundInRoster) {
    throw new Error('Student 23AIML007 not found in faculty roster!');
  }
  console.log(`   Roster verified! Student ${foundInRoster.displayName} (${foundInRoster.registerNumber}) is enrolled.`);

  // 6. Student verifies enrolled classes
  console.log('6. Student fetching enrolled classes...');
  const studentClasses = await studentClient.getStudentClasses();
  const enrolledInNewClass = studentClasses.find(c => c.class.id === newClass.id);
  if (!enrolledInNewClass) {
    throw new Error('Newly created class not found in student enrolled classes!');
  }
  console.log('   Student enrolled classes confirmed. Found:', enrolledInNewClass.class.name);

  // 7. Faculty starts/creates a live exam session for this newly created class
  console.log('7. Faculty creating a live session for this class...');
  const newSession = await facultyClient.createClassSession(newClass.id, {
    name: `Midterm Practical Assessment - Section ${randomSuffix}`,
    durationMinutes: 90
  });
  console.log('   Session scheduled! ID:', newSession.id, 'JoinCode:', newSession.joinCode);

  // 8. Faculty starts the session
  console.log('8. Faculty starting the session...');
  await facultyClient.startSession(newSession.id);
  console.log('   Session started successfully!');

  // 9. Student checks for live sessions in enrolled classes
  console.log('9. Student checking for active sessions in class...');
  const updatedStudentClasses = await studentClient.getStudentClasses();
  const liveClass = updatedStudentClasses.find(c => c.class.id === newClass.id);
  if (!liveClass?.activeSession || liveClass.activeSession.status !== 'ACTIVE') {
    throw new Error('Active session not dynamically attached to student class!');
  }
  console.log('   Student detected active session:', liveClass.activeSession.name, 'Status:', liveClass.activeSession.status);

  // 10. Student joins the live exam session
  console.log('10. Student joining active exam session...');
  const sessionJoinRes = await studentClient.joinSession(newSession.joinCode, stuAuth.user.device.id);
  console.log('   Student joined session! Status:', sessionJoinRes.participant.status);

  // 11. Faculty verifies participant status in session
  console.log('11. Faculty checking participant status in session...');
  const liveState = await facultyClient.getSessionLiveState(newSession.id);
  const participants = liveState.participants || [];
  const studentParticipant = participants.find((p: any) => p.studentId === stuAuth.user.studentProfile.id);
  if (!studentParticipant) {
    throw new Error('Student participant not found in active session!');
  }
  console.log('   Participant verified on Faculty Monitor! Student status:', studentParticipant.status);

  console.log('========================================================');
  console.log('>>> ALL DYNAMIC REAL-TIME TESTS PASSED WITH 100% SUCCESS <<<');
  console.log('========================================================');
}

testDynamicFlow().catch((err) => {
  console.error('TEST FAILED:', err);
  process.exit(1);
});
