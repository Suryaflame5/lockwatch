import test from 'node:test';
import assert from 'node:assert/strict';
import { AuthService } from '../services/backend/dist/services/auth.service.js';
import { ClassService } from '../services/backend/dist/services/class.service.js';
import { OtpService, TestOtpProvider } from '../services/backend/dist/services/otp.service.js';
import { normalizePhoneNumber } from '../services/backend/dist/services/phone.utils.js';
import { DataStore } from '../services/backend/dist/store/database.js';
import { OtpPurpose, ClassJoinMethod, UserRole } from '@lockwatch/shared-models';

test('Phone Utilities - E.164 Normalization', () => {
  assert.equal(normalizePhoneNumber('+91 98765 43210'), '+919876543210');
  assert.equal(normalizePhoneNumber('9876543210', 'IN'), '+919876543210');
  assert.equal(normalizePhoneNumber('+1 (555) 234-5678'), '+15552345678');
});

test('OTP Service - Request Challenge, Hashing, and Single-Use Token', async () => {
  const store = DataStore.getInstance();
  const testProvider = new TestOtpProvider();
  const otpService = new OtpService(store, testProvider);

  const phone = '+919876500001';
  const { challengeId, phoneNumber } = await otpService.requestOtp(phone, OtpPurpose.SIGNUP);

  assert.ok(challengeId);
  assert.equal(phoneNumber, phone);

  // Retrieve generated OTP from test provider
  const generatedOtp = testProvider.getLastOtp(phone, OtpPurpose.SIGNUP);
  assert.ok(generatedOtp);
  assert.equal(generatedOtp.length, 6);

  // Invalid code attempt must reject
  await assert.rejects(
    async () => {
      await otpService.verifyOtp(challengeId, '000000', OtpPurpose.SIGNUP);
    },
    /Incorrect verification code/
  );

  // Valid code verification
  const goodVerify = await otpService.verifyOtp(challengeId, generatedOtp, OtpPurpose.SIGNUP);
  assert.equal(goodVerify.verified, true);
  assert.ok(goodVerify.challengeId);

  // Single-use token consumption
  const consumed = otpService.consumeVerifiedChallenge(goodVerify.challengeId, OtpPurpose.SIGNUP);
  assert.equal(consumed.phoneNumber, phone);

  // Second consumption must fail (single-use guarantee)
  assert.throws(
    () => otpService.consumeVerifiedChallenge(goodVerify.challengeId, OtpPurpose.SIGNUP),
    /This verification code has already been used/
  );
});

test('AuthService - Student Signup Flow with OTP and Unique Mobile Constraint', async () => {
  const authService = new AuthService();
  const testProvider = new TestOtpProvider();
  authService.setOtpProvider(testProvider);

  const phone = '+919876500099';

  // 1. Request Signup OTP
  const { challengeId } = await authService.requestStudentSignupOtp(phone);
  assert.ok(challengeId);

  const otp = testProvider.getLastOtp(phone, OtpPurpose.SIGNUP)!;
  assert.ok(otp);

  // 2. Verify Signup OTP
  const { verificationToken } = await authService.verifyStudentSignupOtp(challengeId, otp);
  assert.ok(verificationToken);

  // 3. Create Account
  const res = await authService.createStudentAccount({
    verificationToken,
    password: 'SecurePassword123!',
    name: 'New Student Test',
    registerNumber: '23TEST099',
    institutionCode: 'TECH-UNI'
  });

  assert.ok(res.accessToken);
  assert.equal(res.user.role, UserRole.STUDENT);
  assert.equal(res.user.studentProfile.registerNumber, '23TEST099');

  // 4. Duplicate Signup Attempt with same mobile number must be rejected
  await assert.rejects(
    async () => {
      await authService.requestStudentSignupOtp(phone);
    },
    /An account already exists for this mobile number/
  );

  // 5. Login using Mobile Phone + Password
  const loginRes = await authService.studentLogin({
    phoneNumber: phone,
    password: 'SecurePassword123!',
    institutionCode: 'TECH-UNI'
  });
  assert.ok(loginRes.accessToken);
  assert.equal(loginRes.user.studentProfile.registerNumber, '23TEST099');
});

test('AuthService - Forgot Password Flow with OTP', async () => {
  const authService = new AuthService();
  const testProvider = new TestOtpProvider();
  authService.setOtpProvider(testProvider);

  const phone = '+919876543210'; // Seeded student 23AIML104

  // 1. Request Password Reset OTP
  const { challengeId } = await authService.requestStudentPasswordResetOtp(phone);
  assert.ok(challengeId);

  const otp = testProvider.getLastOtp(phone, OtpPurpose.PASSWORD_RESET)!;
  assert.ok(otp);

  // 2. Verify OTP
  const { resetToken } = await authService.verifyStudentPasswordResetOtp(challengeId, otp);
  assert.ok(resetToken);

  // 3. Reset Password
  const resetRes = await authService.resetStudentPassword({
    resetToken,
    newPassword: 'BrandNewPassword123!'
  });
  assert.equal(resetRes.success, true);

  // 4. Verify login with new password
  const newLogin = await authService.studentLogin({
    phoneNumber: phone,
    password: 'BrandNewPassword123!'
  });
  assert.ok(newLogin.accessToken);
});

test('Class Enrollment - Academic Identity and Per-Class Register Uniqueness', async () => {
  const classService = new ClassService();
  const store = DataStore.getInstance();
  const instId = '11111111-1111-1111-1111-111111111111';

  // Create a new class
  const cls = classService.createClass(
    '22222222-2222-2222-2222-222222222222',
    instId,
    {
      name: 'Algorithm Analysis',
      subject: 'CS302',
      department: 'CSE',
      year: '2026',
      semester: '6',
      section: 'A'
    }
  );

  // First student joins class with academic identity
  const student1 = store.findStudentByRegAndInstitution(instId, '23AIML104')!;
  assert.ok(student1, 'Student 104 must exist');

  const join1 = classService.joinClassByCode(student1.id, cls.classCode, {
    displayName: 'Arun Kumar Confirmed',
    registerNumber: '23AIML104'
  });

  assert.equal(join1.membership.displayName, 'Arun Kumar Confirmed');
  assert.equal(join1.membership.registerNumber, '23AIML104');
  assert.equal(join1.membership.joinMethod, ClassJoinMethod.CODE);

  // Second student attempts to join the same class using duplicate register number
  const student2 = store.findStudentByRegAndInstitution(instId, '23AIML118')!;
  assert.ok(student2, 'Student 118 must exist');

  assert.throws(
    () => {
      classService.joinClassByCode(student2.id, cls.classCode, {
        displayName: 'Impostor Name',
        registerNumber: '23AIML104' // DUPLICATE IN SAME CLASS
      });
    },
    /already assigned in this class/
  );

  // Second student joins with their own unique register number
  const join2 = classService.joinClassByCode(student2.id, cls.classCode, {
    displayName: 'Priya Sundaram Confirmed',
    registerNumber: '23AIML118'
  });
  assert.equal(join2.membership.registerNumber, '23AIML118');

  // Verify separated participation metrics
  const metrics = classService.getClassSessionParticipationMetrics(cls.id);
  assert.equal(metrics.totalEnrolled, 2);
  assert.equal(metrics.joined, 0); // No session started or joined yet
  assert.equal(metrics.notJoined, 2);
});
