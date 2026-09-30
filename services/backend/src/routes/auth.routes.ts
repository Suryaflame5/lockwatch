import { Router } from 'express';
import { AuthService } from '../services/auth.service.js';
import {
  FacultyLoginSchema,
  StudentLoginSchema,
  RefreshTokenSchema,
  StudentRequestSignupOtpSchema,
  StudentVerifySignupOtpSchema,
  StudentCreateAccountSchema,
  StudentRequestPasswordResetOtpSchema,
  StudentVerifyPasswordResetOtpSchema,
  StudentResetPasswordSchema
} from '@lockwatch/validation';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.middleware.js';

export const authRouter = Router();
const authService = new AuthService();

// Faculty Authentication
authRouter.post('/faculty/login', async (req, res) => {
  try {
    const validated = FacultyLoginSchema.parse(req.body);
    const result = await authService.facultyLogin({
      ...validated,
      ipAddress: req.ip
    });
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
});

// Student Mobile OTP Sign-Up
authRouter.post('/student/request-signup-otp', async (req, res) => {
  try {
    const validated = StudentRequestSignupOtpSchema.parse(req.body);
    const result = await authService.requestStudentSignupOtp(validated.phoneNumber);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
});

authRouter.post('/student/verify-signup-otp', async (req, res) => {
  try {
    const validated = StudentVerifySignupOtpSchema.parse(req.body);
    const result = await authService.verifyStudentSignupOtp(validated.challengeId, validated.otp);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
});

const handleCreateAccount = async (req: any, res: any) => {
  try {
    const validated = StudentCreateAccountSchema.parse(req.body);
    const result = await authService.createStudentAccount(validated);
    res.status(201).json(result);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

authRouter.post('/student/create-account', handleCreateAccount);
authRouter.post('/student/register', handleCreateAccount);

// Student Password Reset via OTP
authRouter.post('/student/request-password-reset-otp', async (req, res) => {
  try {
    const validated = StudentRequestPasswordResetOtpSchema.parse(req.body);
    const result = await authService.requestStudentPasswordResetOtp(validated.phoneNumber);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
});

authRouter.post('/student/verify-password-reset-otp', async (req, res) => {
  try {
    const validated = StudentVerifyPasswordResetOtpSchema.parse(req.body);
    const result = await authService.verifyStudentPasswordResetOtp(validated.challengeId, validated.otp);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
});

authRouter.post('/student/reset-password', async (req, res) => {
  try {
    const validated = StudentResetPasswordSchema.parse(req.body);
    const result = await authService.resetStudentPassword(validated);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
});

// Student Login (Mobile Number or Register Number)
authRouter.post('/student/login', async (req, res) => {
  try {
    const validated = StudentLoginSchema.parse(req.body);
    const result = await authService.studentLogin({
      ...validated,
      ipAddress: req.ip
    });
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
});

// Token Refresh & Logout
authRouter.post('/refresh', async (req, res) => {
  try {
    const validated = RefreshTokenSchema.parse(req.body);
    const result = await authService.refreshAccessToken(validated.refreshToken);
    res.json(result);
  } catch (err: any) {
    res.status(401).json({ message: err.message });
  }
});

authRouter.post('/logout', requireAuth, async (req: AuthenticatedRequest, res) => {
  if (req.user?.userId) {
    await authService.logout(req.user.userId);
  }
  res.json({ success: true, message: 'Logged out successfully' });
});
