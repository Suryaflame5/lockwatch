import test from 'node:test';
import assert from 'node:assert/strict';
import { AuthService } from '../services/backend/dist/services/auth.service.js';
import { UserRole } from '@lockwatch/shared-models';

test('AuthService - Faculty Authentication with Password', async () => {
  const authService = new AuthService();
  const res = await authService.facultyLogin({
    identifier: 'faculty@apextech.edu',
    password: 'FacultyPassword123!',
    institutionCode: 'TECH-UNI'
  });

  assert.ok(res.accessToken, 'Access token should be issued');
  assert.ok(res.refreshToken, 'Refresh token should be issued');
  assert.equal(res.user.role, UserRole.FACULTY);
  assert.equal(res.user.email, 'faculty@apextech.edu');
});

test('AuthService - Faculty Authentication with Secure PIN', async () => {
  const authService = new AuthService();
  const res = await authService.facultyLogin({
    identifier: 'faculty@apextech.edu',
    pin: '123456',
    institutionCode: 'TECH-UNI'
  });

  assert.ok(res.accessToken);
  assert.equal(res.user.role, UserRole.FACULTY);
});

test('AuthService - Reject Invalid Password / PIN', async () => {
  const authService = new AuthService();
  await assert.rejects(
    async () => {
      await authService.facultyLogin({
        identifier: 'faculty@apextech.edu',
        password: 'WrongPassword!',
        institutionCode: 'TECH-UNI'
      });
    },
    /Invalid faculty credentials/
  );
});

test('AuthService - Student Authentication', async () => {
  const authService = new AuthService();
  const res = await authService.studentLogin({
    registerNumber: '23AIML104',
    password: 'StudentPassword123!',
    institutionCode: 'TECH-UNI'
  });

  assert.ok(res.accessToken);
  assert.equal(res.user.role, UserRole.STUDENT);
  assert.equal(res.user.studentProfile.registerNumber, '23AIML104');
});
