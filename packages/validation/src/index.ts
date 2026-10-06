import { z } from 'zod';
import {
  PlatformType,
  EventType,
  CommandType,
  CommandStatus,
  StudentStatus,
  AlertSeverity
} from '@lockwatch/shared-models';

export const FacultyLoginSchema = z.object({
  identifier: z.string().min(3, 'Faculty identifier or email is required').max(100),
  password: z.string().min(6, 'Password must be at least 6 characters').optional(),
  pin: z.string().regex(/^\d{6,8}$/, 'PIN must be 6 to 8 digits').optional(),
  institutionCode: z.string().min(2, 'Institution code is required').max(20)
}).refine(data => data.password || data.pin, {
  message: 'Either password or secure faculty PIN must be provided',
  path: ['password']
});

export const StudentLoginSchema = z.object({
  phoneNumber: z.string().min(8).max(25).optional(),
  registerNumber: z.string().min(3).max(50).optional(),
  password: z.string().min(4, 'Password is required').max(100),
  institutionCode: z.string().min(2).max(20).optional()
}).refine(data => data.phoneNumber || data.registerNumber, {
  message: 'Either mobile number or register number must be provided',
  path: ['phoneNumber']
});

export const StudentRequestSignupOtpSchema = z.object({
  phoneNumber: z.string().min(8, 'Valid mobile number required').max(25)
});

export const StudentVerifySignupOtpSchema = z.object({
  challengeId: z.string().min(10, 'Valid challenge ID required'),
  otp: z.string().regex(/^\d{6}$/, 'OTP must be 6 digits')
});

export const StudentCreateAccountSchema = z.object({
  verificationToken: z.string().min(10, 'Valid verification token required'),
  password: z.string().min(6, 'Password must be at least 6 characters').max(100),
  name: z.string().min(2, 'Full Name is required').max(100),
  registerNumber: z.string().min(2, 'Register Number is required').max(50),
  institutionCode: z.string().min(2).max(20).optional()
});

export const StudentRequestPasswordResetOtpSchema = z.object({
  phoneNumber: z.string().min(8, 'Valid mobile number required').max(25)
});

export const StudentVerifyPasswordResetOtpSchema = z.object({
  challengeId: z.string().min(10, 'Valid challenge ID required'),
  otp: z.string().regex(/^\d{6}$/, 'OTP must be 6 digits')
});

export const StudentResetPasswordSchema = z.object({
  resetToken: z.string().min(10, 'Valid reset token required'),
  newPassword: z.string().min(6, 'Password must be at least 6 characters').max(100)
});

export const RefreshTokenSchema = z.object({
  refreshToken: z.string().min(20, 'Valid refresh token required')
});

export const DeviceRegistrationSchema = z.object({
  deviceId: z.string().uuid('Cryptographic device UUID required'),
  platform: z.nativeEnum(PlatformType),
  manufacturer: z.string().min(1).max(50),
  model: z.string().min(1).max(50),
  osVersion: z.string().min(1).max(30),
  appVersion: z.string().min(1).max(20),
  publicKey: z.string().min(32, 'Valid public key required'),
  isDeviceOwner: z.boolean().default(false),
  hasAacEntitlement: z.boolean().default(false)
});

export const CreateSessionSchema = z.object({
  name: z.string().min(3, 'Session name is required').max(100),
  subject: z.string().min(2, 'Subject is required').max(100),
  department: z.string().min(2, 'Department is required').max(100),
  className: z.string().min(1, 'Class/batch is required').max(50),
  scheduledStartTime: z.string().datetime({ message: 'Valid scheduled ISO date required' }),
  durationMinutes: z.number().int().min(5, 'Minimum 5 minutes').max(360, 'Maximum 6 hours'),
  emergencyDurationSeconds: z.number().int().min(10).max(60).default(15),
  joinWindowMinutes: z.number().int().min(5).max(120).default(30),
  rules: z.array(z.string()).default([])
});

export const JoinSessionSchema = z.object({
  joinCode: z.string().min(4).max(12),
  deviceId: z.string().uuid()
});

export const HeartbeatSchema = z.object({
  eventId: z.string().uuid(),
  deviceId: z.string().uuid(),
  studentId: z.string().uuid(),
  sessionId: z.string().uuid(),
  sequence: z.number().int().nonnegative(),
  platform: z.nativeEnum(PlatformType),
  appVersion: z.string(),
  securityState: z.object({
    isSupervised: z.boolean(),
    isLockActive: z.boolean(),
    nativeMechanism: z.enum(['ANDROID_LOCK_TASK', 'IOS_AAC', 'IOS_MDM_SAM', 'NONE']),
    verificationSignal: z.string()
  }),
  sessionState: z.nativeEnum(StudentStatus),
  batteryLevel: z.number().min(0).max(100),
  isCharging: z.boolean(),
  networkState: z.enum(['WIFI', 'CELLULAR', 'NONE']),
  screenOn: z.boolean(),
  deviceLocked: z.boolean(),
  clientTimestamp: z.string().datetime()
});

export const SessionEventSchema = z.object({
  eventId: z.string().uuid(),
  sessionId: z.string().uuid(),
  studentId: z.string().uuid(),
  deviceId: z.string().uuid(),
  type: z.nativeEnum(EventType),
  sequence: z.number().int().nonnegative(),
  clientTimestamp: z.string().datetime(),
  metadata: z.record(z.unknown()).default({})
});

export const BatchEventsSchema = z.object({
  events: z.array(SessionEventSchema).min(1).max(100)
});

export const CommandAckSchema = z.object({
  commandId: z.string().uuid(),
  sessionId: z.string().uuid(),
  studentId: z.string().uuid(),
  deviceId: z.string().uuid(),
  status: z.nativeEnum(CommandStatus),
  executedAt: z.string().datetime(),
  error: z.string().optional(),
  metadata: z.record(z.unknown()).optional()
});

export const EmergencyActionSchema = z.object({
  sessionId: z.string().uuid(),
  studentId: z.string().uuid(),
  deviceId: z.string().uuid(),
  reason: z.string().max(255).optional(),
  clientTimestamp: z.string().datetime()
});

export const AcknowledgeAlertSchema = z.object({
  alertId: z.string().uuid()
});

// Class Management Schemas
export const CreateClassSchema = z.object({
  name: z.string().min(2, 'Class name is required').max(100),
  subject: z.string().min(2, 'Subject is required').max(100),
  department: z.string().max(100).optional().default('Computer Science & Engineering'),
  year: z.string().max(20).optional().default('2026-2027'),
  semester: z.string().max(20).optional().default('Semester 1'),
  section: z.string().max(20).optional().default('A'),
  description: z.string().max(500).optional(),
  classCode: z.string().min(4).max(20).optional(),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Valid HH:MM format required').optional(),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Valid HH:MM format required').optional()
});

export const UpdateClassSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  subject: z.string().min(2).max(100).optional(),
  department: z.string().min(2).max(100).optional(),
  year: z.string().min(1).max(20).optional(),
  semester: z.string().min(1).max(20).optional(),
  section: z.string().min(1).max(20).optional(),
  description: z.string().max(500).optional(),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional()
});

export const JoinClassCodeSchema = z.object({
  classCode: z.string().min(4, 'Class code is required').max(30),
  displayName: z.string().min(2, 'Full name is required').max(100).optional(),
  registerNumber: z.string().min(2, 'Register number is required').max(50).optional(),
  deviceId: z.string().uuid('Valid device UUID required').optional()
});

export const JoinClassQrSchema = z.object({
  qrToken: z.string().min(10, 'Valid QR join token required'),
  displayName: z.string().min(2, 'Full name is required').max(100).optional(),
  registerNumber: z.string().min(2, 'Register number is required').max(50).optional(),
  deviceId: z.string().uuid('Valid device UUID required').optional()
});

export const JoinClassGenericSchema = z.object({
  classCode: z.string().min(4).max(30).optional(),
  qrToken: z.string().min(10).optional(),
  displayName: z.string().min(2, 'Full name is required').max(100),
  registerNumber: z.string().min(2, 'Register number is required').max(50),
  deviceId: z.string().uuid().optional()
}).refine(data => data.classCode || data.qrToken, {
  message: 'Either class code or QR token must be provided',
  path: ['classCode']
});

export const AddStudentToClassSchema = z.object({
  registerNumber: z.string().min(2, 'Student register number is required').max(50)
});

export const BulkAddStudentsSchema = z.object({
  registerNumbers: z.array(z.string().min(2).max(50)).min(1, 'At least one student register number is required')
});

export const CreateClassSessionSchema = z.object({
  classId: z.string().uuid('Valid class UUID is required'),
  name: z.string().min(3, 'Session name is required').max(100),
  scheduledStartTime: z.string().datetime().optional(),
  durationMinutes: z.number().int().min(5, 'Minimum 5 minutes').max(360, 'Maximum 6 hours').default(60),
  emergencyDurationSeconds: z.number().int().min(10).max(60).default(15),
  rules: z.array(z.string()).default([])
});

export type FacultyLoginInput = z.infer<typeof FacultyLoginSchema>;
export type StudentLoginInput = z.infer<typeof StudentLoginSchema>;
export type DeviceRegistrationInput = z.infer<typeof DeviceRegistrationSchema>;
export type CreateSessionInput = z.infer<typeof CreateSessionSchema>;
export type JoinSessionInput = z.infer<typeof JoinSessionSchema>;
export type HeartbeatInput = z.infer<typeof HeartbeatSchema>;
export type SessionEventInput = z.infer<typeof SessionEventSchema>;
export type BatchEventsInput = z.infer<typeof BatchEventsSchema>;
export type CommandAckInput = z.infer<typeof CommandAckSchema>;
export type CreateClassInput = z.infer<typeof CreateClassSchema>;
export type UpdateClassInput = z.infer<typeof UpdateClassSchema>;
export type JoinClassCodeInput = z.infer<typeof JoinClassCodeSchema>;
export type JoinClassQrInput = z.infer<typeof JoinClassQrSchema>;
export type AddStudentToClassInput = z.infer<typeof AddStudentToClassSchema>;
export type BulkAddStudentsInput = z.infer<typeof BulkAddStudentsSchema>;
export type CreateClassSessionInput = z.infer<typeof CreateClassSessionSchema>;
