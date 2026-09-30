import test from 'node:test';
import assert from 'node:assert/strict';
import { AuthService } from '../services/backend/dist/services/auth.service.js';
import { normalizePhoneNumber } from '../services/backend/dist/services/phone.utils.js';
import { TEST_CONNECTED_DEVICE, TEST_AUTH_CREDENTIALS } from './fixtures/test_device.js';
import { UserRole, PlatformType } from '@lockwatch/shared-models';

test('Test Device & Credentials - Configuration Verification', () => {
  assert.equal(TEST_AUTH_CREDENTIALS.email, 'suryaflame2007@gmail.com');
  assert.equal(TEST_AUTH_CREDENTIALS.password, 'StudentPassword123!');
  assert.equal(TEST_AUTH_CREDENTIALS.mobileNumber, '7418320315');
  assert.equal(normalizePhoneNumber(TEST_AUTH_CREDENTIALS.mobileNumber), '+917418320315');

  // Verify connected USB debugging Android device specifications
  assert.equal(TEST_CONNECTED_DEVICE.serial, '10MFA4FTZX0001C');
  assert.equal(TEST_CONNECTED_DEVICE.manufacturer, 'vivo');
  assert.equal(TEST_CONNECTED_DEVICE.model, 'V2521');
  assert.equal(TEST_CONNECTED_DEVICE.osVersion, 'Android 16 (API 36)');
  assert.equal(TEST_CONNECTED_DEVICE.platform, 'ANDROID');
});

test('AuthService - Login with Mobile Number (7418320315) and Test Device Info', async () => {
  const authService = new AuthService();

  const res = await authService.studentLogin({
    phoneNumber: TEST_AUTH_CREDENTIALS.mobileNumber,
    password: TEST_AUTH_CREDENTIALS.password,
    institutionCode: TEST_AUTH_CREDENTIALS.institutionCode
  });

  assert.ok(res.accessToken, 'Access token should be issued');
  assert.ok(res.refreshToken, 'Refresh token should be issued');
  assert.equal(res.user.role, UserRole.STUDENT);
  assert.equal(res.user.email, 'suryaflame2007@gmail.com');
  assert.equal(res.user.studentProfile.phoneNumber, '+917418320315');
  assert.equal(res.user.studentProfile.name, 'Surya');

  // Verify linked hardware device matches connected vivo V2521
  assert.ok(res.user.device);
  assert.equal(res.user.device.manufacturer, 'vivo');
  assert.equal(res.user.device.model, 'V2521');
  assert.equal(res.user.device.osVersion, 'Android 16 (API 36)');
  assert.equal(res.user.device.platform, PlatformType.ANDROID);
  assert.equal(res.user.device.isDeviceOwner, true);
});

test('AuthService - Login with Email (suryaflame2007@gmail.com)', async () => {
  const authService = new AuthService();

  const res = await authService.studentLogin({
    registerNumber: TEST_AUTH_CREDENTIALS.email,
    password: TEST_AUTH_CREDENTIALS.password,
    institutionCode: TEST_AUTH_CREDENTIALS.institutionCode
  });

  assert.ok(res.accessToken);
  assert.equal(res.user.email, 'suryaflame2007@gmail.com');
  assert.equal(res.user.studentProfile.phoneNumber, '+917418320315');
  assert.equal(res.user.device.model, 'V2521');
});

test('AuthService - Reject Invalid Password for Test Account', async () => {
  const authService = new AuthService();

  await assert.rejects(
    async () => {
      await authService.studentLogin({
        phoneNumber: TEST_AUTH_CREDENTIALS.mobileNumber,
        password: 'IncorrectPassword',
        institutionCode: TEST_AUTH_CREDENTIALS.institutionCode
      });
    },
    /Invalid student credentials/
  );
});
