/**
 * LockWatch Shared Domain Models & Contracts
 * High-integrity definitions for multi-tenant supervised assessment control
 */

export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  INSTITUTION_ADMIN = 'INSTITUTION_ADMIN',
  FACULTY = 'FACULTY',
  INVIGILATOR = 'INVIGILATOR',
  STUDENT = 'STUDENT'
}

export enum PlatformType {
  ANDROID = 'ANDROID',
  IOS = 'IOS'
}

export enum StudentStatus {
  READY = 'READY',
  ACTIVE = 'ACTIVE',
  EMERGENCY = 'EMERGENCY',
  LEFT_SUPERVISION = 'LEFT_SUPERVISION',
  OFFLINE = 'OFFLINE',
  RECONNECTED = 'RECONNECTED',
  LOCK_FAILED = 'LOCK_FAILED',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}

export enum SessionStatus {
  DRAFT = 'DRAFT',
  SCHEDULED = 'SCHEDULED',
  READY = 'READY',
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  ENDING = 'ENDING',
  ENDED = 'ENDED'
}

export enum SecurityCapability {
  ANDROID_LOCK_TASK = 'ANDROID_LOCK_TASK',
  ANDROID_DEVICE_OWNER = 'ANDROID_DEVICE_OWNER',
  IOS_AAC = 'IOS_AAC',
  IOS_MDM = 'IOS_MDM',
  IOS_SINGLE_APP_MODE = 'IOS_SINGLE_APP_MODE',
  REALTIME_CONNECTIVITY = 'REALTIME_CONNECTIVITY',
  PUSH_NOTIFICATIONS = 'PUSH_NOTIFICATIONS'
}

export enum CapabilityStatus {
  SUPPORTED = 'SUPPORTED',
  UNSUPPORTED = 'UNSUPPORTED',
  UNKNOWN = 'UNKNOWN',
  CONFIGURATION_REQUIRED = 'CONFIGURATION_REQUIRED',
  ERROR = 'ERROR'
}

export enum DeviceEnrollmentStatus {
  SECURE_READY = 'SECURE_READY',
  NOT_READY = 'NOT_READY',
  DEVICE_NOT_MANAGED = 'DEVICE_NOT_MANAGED',
  ASSESSMENT_CAPABILITY_AVAILABLE = 'ASSESSMENT_CAPABILITY_AVAILABLE',
  ASSESSMENT_CAPABILITY_UNAVAILABLE = 'ASSESSMENT_CAPABILITY_UNAVAILABLE'
}

export enum EventType {
  STUDENT_LOGGED_IN = 'STUDENT_LOGGED_IN',
  DEVICE_REGISTERED = 'DEVICE_REGISTERED',
  SESSION_JOINED = 'SESSION_JOINED',
  READY_CONFIRMED = 'READY_CONFIRMED',
  SESSION_STARTED = 'SESSION_STARTED',
  LOCK_COMMAND_SENT = 'LOCK_COMMAND_SENT',
  LOCK_INITIATED = 'LOCK_INITIATED',
  LOCK_CONFIRMED = 'LOCK_CONFIRMED',
  LOCK_FAILED = 'LOCK_FAILED',
  HEARTBEAT = 'HEARTBEAT',
  SCREEN_OFF = 'SCREEN_OFF',
  SCREEN_ON = 'SCREEN_ON',
  DEVICE_LOCKED = 'DEVICE_LOCKED',
  DEVICE_UNLOCKED = 'DEVICE_UNLOCKED',
  APP_LEFT = 'APP_LEFT',
  APP_RETURNED = 'APP_RETURNED',
  ASSESSMENT_INTERRUPTED = 'ASSESSMENT_INTERRUPTED',
  ASSESSMENT_RESUMED = 'ASSESSMENT_RESUMED',
  EMERGENCY_STARTED = 'EMERGENCY_STARTED',
  EMERGENCY_ENDED = 'EMERGENCY_ENDED',
  NETWORK_LOST = 'NETWORK_LOST',
  NETWORK_RESTORED = 'NETWORK_RESTORED',
  OFFLINE = 'OFFLINE',
  ONLINE = 'ONLINE',
  DEVICE_REBOOTED = 'DEVICE_REBOOTED',
  DEVICE_RECONNECTED = 'DEVICE_RECONNECTED',
  SESSION_PAUSED = 'SESSION_PAUSED',
  SESSION_RESUMED = 'SESSION_RESUMED',
  SESSION_COMPLETED = 'SESSION_COMPLETED',
  SESSION_ENDED = 'SESSION_ENDED',
  ERROR = 'ERROR'
}

export enum CommandType {
  START_SESSION = 'START_SESSION',
  PAUSE_SESSION = 'PAUSE_SESSION',
  RESUME_SESSION = 'RESUME_SESSION',
  END_SESSION = 'END_SESSION',
  REQUEST_HEARTBEAT = 'REQUEST_HEARTBEAT',
  EMERGENCY_OVERRIDE = 'EMERGENCY_OVERRIDE'
}

export enum CommandStatus {
  PENDING = 'PENDING',
  RECEIVED = 'RECEIVED',
  EXECUTING = 'EXECUTING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  TIMEOUT = 'TIMEOUT'
}

export enum AlertSeverity {
  CRITICAL = 'CRITICAL',
  WARNING = 'WARNING',
  NORMAL = 'NORMAL',
  INFO = 'INFO'
}

export enum NetworkQuality {
  ONLINE = 'ONLINE',
  STALE = 'STALE',
  OFFLINE = 'OFFLINE'
}

// Database & Domain Entities

export interface Institution {
  id: string;
  code: string;
  name: string;
  domain: string;
  retentionDays: number;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  institutionId: string;
  role: UserRole;
  email: string;
  passwordHash: string;
  pinHash?: string | null;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Faculty {
  id: string;
  userId: string;
  institutionId: string;
  facultyIdNumber: string;
  department: string;
  designation: string;
  name: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

export enum OtpPurpose {
  SIGNUP = 'SIGNUP',
  PASSWORD_RESET = 'PASSWORD_RESET',
  PHONE_CHANGE = 'PHONE_CHANGE'
}

export interface OtpChallenge {
  id: string;
  phoneNumber: string; // E.164 normalized e.g. +919876543210
  purpose: OtpPurpose;
  otpHash: string;
  expiresAt: string;
  attemptCount: number;
  maxAttempts: number;
  verifiedAt?: string | null;
  consumedAt?: string | null;
  createdAt: string;
}

export interface Student {
  id: string;
  userId: string;
  institutionId: string;
  registerNumber: string;
  name: string;
  phoneNumber?: string;
  phoneVerifiedAt?: string | null;
  department: string;
  className: string;
  createdAt: string;
  updatedAt: string;
}

export interface Device {
  id: string; // Cryptographic application-generated UUID
  studentId: string;
  institutionId: string;
  platform: PlatformType;
  manufacturer: string;
  model: string;
  osVersion: string;
  appVersion: string;
  enrollmentStatus: DeviceEnrollmentStatus;
  isDeviceOwner: boolean;
  hasAacEntitlement: boolean;
  publicKey: string;
  lastSeenAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface Session {
  id: string;
  institutionId: string;
  facultyId: string;
  name: string;
  subject: string;
  department: string;
  className: string;
  joinCode: string;
  joinTokenSecret: string;
  status: SessionStatus;
  classId?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  endsAt?: string | null;
  scheduledStartTime: string;
  durationMinutes: number;
  emergencyDurationSeconds: number; // default 15
  joinWindowMinutes: number;
  rules: string[];
  createdAt: string;
  updatedAt: string;
}

export interface SessionParticipant {
  id: string;
  sessionId: string;
  studentId: string;
  deviceId: string;
  institutionId: string;
  status: StudentStatus;
  joinedAt: string;
  sessionJoinedAt?: string;
  startedAt?: string | null;
  completedAt?: string | null;
  lastHeartbeatAt: string;
  lastEventAt?: string | null;
  batteryLevel: number;
  isCharging: boolean;
  networkQuality: NetworkQuality;
  screenOn: boolean;
  deviceLocked: boolean;
  emergencyUsageCount: number;
  interruptionCount: number;
  offlineDurationSeconds: number;
  lockVerified: boolean;
  lockFailureReason?: string | null;
  permissionRequested?: boolean;
  permissionReason?: string | null;
  permissionRequestedAt?: string | null;
  isAccessGranted?: boolean;
  accessGrantedUntil?: string | null;
  temporaryAccessMinutes?: number;
  createdAt: string;
  updatedAt: string;
}

export interface SessionCommand {
  id: string;
  sessionId: string;
  studentId?: string | null; // null if broadcast to all
  deviceId?: string | null;
  commandType: CommandType;
  status: CommandStatus;
  issuedAt: string;
  expiresAt: string;
  executedAt?: string | null;
  error?: string | null;
  metadata?: Record<string, unknown>;
}

export interface SessionEvent {
  id: string; // eventId (UUID)
  sessionId: string;
  studentId: string;
  deviceId: string;
  institutionId: string;
  type: EventType;
  sequence: number;
  clientTimestamp: string;
  serverReceivedTimestamp: string;
  metadata: Record<string, unknown>;
}

export interface Alert {
  id: string;
  sessionId: string;
  studentId?: string | null;
  institutionId: string;
  type: EventType | string;
  severity: AlertSeverity;
  message: string;
  studentName?: string | null;
  registerNumber?: string | null;
  timestamp: string;
  acknowledged: boolean;
  acknowledgedBy?: string | null;
  acknowledgedAt?: string | null;
}

export interface AuditLog {
  id: string;
  institutionId: string;
  facultyId?: string | null;
  userId?: string | null;
  action: string;
  sessionId?: string | null;
  studentId?: string | null;
  timestamp: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown>;
  result: 'SUCCESS' | 'FAILURE';
}

export interface RefreshToken {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: string;
  revoked: boolean;
  createdAt: string;
}

// Telemetry & Heartbeat contracts

export interface HeartbeatPayload {
  eventId: string;
  deviceId: string;
  studentId: string;
  sessionId: string;
  sequence: number;
  platform: PlatformType;
  appVersion: string;
  securityState: {
    isSupervised: boolean;
    isLockActive: boolean;
    nativeMechanism: 'ANDROID_LOCK_TASK' | 'IOS_AAC' | 'IOS_MDM_SAM' | 'NONE';
    verificationSignal: string;
  };
  sessionState: StudentStatus;
  batteryLevel: number;
  isCharging: boolean;
  networkState: 'WIFI' | 'CELLULAR' | 'NONE';
  screenOn: boolean;
  deviceLocked: boolean;
  clientTimestamp: string;
}

export interface StudentReadinessResult {
  studentId: string;
  registerNumber: string;
  studentName: string;
  platform: PlatformType;
  deviceModel: string;
  accountValid: boolean;
  sessionValid: boolean;
  deviceEnrolled: boolean;
  securityCapabilitySupported: boolean;
  networkReady: boolean;
  isReady: boolean;
  problem?: string | null;
}

export interface DashboardSummaryMetrics {
  totalStudents: number;
  connected: number;
  active: number;
  emergency: number;
  leftSupervision: number;
  offline: number;
  completed: number;
  lockErrors: number;
  ready: number;
}

export interface SessionReportSummary {
  session: {
    id: string;
    name: string;
    subject: string;
    department: string;
    className: string;
    date: string;
    startTime?: string | null;
    durationMinutes: number;
    facultyName: string;
  };
  metrics: DashboardSummaryMetrics;
  students: Array<{
    name: string;
    registerNumber: string;
    platform: PlatformType;
    deviceModel: string;
    osVersion: string;
    status: StudentStatus;
    joinedAt: string;
    startedAt?: string | null;
    completedAt?: string | null;
    interruptions: number;
    emergencyCount: number;
    offlineSeconds: number;
    securityEventsCount: number;
  }>;
  criticalEvents: Array<{
    timestamp: string;
    studentName: string;
    registerNumber: string;
    type: EventType;
    message: string;
  }>;
}

// Platform Security Common Abstraction

export interface PlatformSecurityStatus {
  isSupported: boolean;
  isEnrolled: boolean;
  isLocked: boolean;
  activeMechanism: 'ANDROID_LOCK_TASK' | 'IOS_AAC' | 'IOS_MDM_SAM' | 'NONE';
  failureReason?: string | null;
  details: Record<string, unknown>;
}

export interface IPlatformSecurityManager {
  checkCapabilities(): Promise<Record<SecurityCapability, CapabilityStatus>>;
  verifyReadiness(): Promise<{ isReady: boolean; problem?: string }>;
  startLock(): Promise<{ success: boolean; error?: string }>;
  stopLock(): Promise<{ success: boolean; error?: string }>;
  getSecurityStatus(): Promise<PlatformSecurityStatus>;
  enterEmergency(durationSeconds: number): Promise<{ success: boolean; error?: string }>;
  exitEmergency(): Promise<{ success: boolean; error?: string }>;
}

// ==========================================
// Class Management System Domain Definitions
// ==========================================

export enum ClassStatus {
  ACTIVE = 'ACTIVE',
  UPCOMING = 'UPCOMING',
  ENDED = 'ENDED',
  ARCHIVED = 'ARCHIVED'
}

export enum ClassMembershipStatus {
  ENROLLED = 'ENROLLED',
  PENDING = 'PENDING',
  REMOVED = 'REMOVED',
  BLOCKED = 'BLOCKED'
}

export enum ClassJoinMethod {
  CODE = 'CODE',
  QR = 'QR',
  FACULTY_ADDED = 'FACULTY_ADDED',
  BULK_IMPORT = 'BULK_IMPORT'
}

export interface Class {
  id: string;
  institutionId: string;
  createdBy: string; // Faculty ID
  name: string;
  subject: string;
  department: string;
  year: string;
  semester: string;
  section: string;
  description?: string | null;
  classCode: string;
  status: ClassStatus;
  startTime?: string | null; // e.g. "09:00"
  endTime?: string | null;   // e.g. "10:30"
  activeSessionId?: string | null;
  createdAt: string;
  updatedAt: string;
  archivedAt?: string | null;
}

export interface ClassMembership {
  id: string;
  classId: string;
  studentId: string;
  displayName: string;
  registerNumber: string;
  joinMethod: ClassJoinMethod;
  status: ClassMembershipStatus;
  joinedAt: string;
  removedAt?: string | null;
}

export interface ClassJoinToken {
  id: string;
  classId: string;
  tokenHash: string;
  expiresAt: string;
  revokedAt?: string | null;
  createdAt: string;
}

export interface ClassRosterStudent {
  studentId: string;
  userId: string;
  registerNumber: string;
  displayName?: string;
  name: string;
  phoneNumber?: string;
  department: string;
  className: string;
  membershipStatus: ClassMembershipStatus;
  joinMethod?: ClassJoinMethod;
  deviceModel?: string;
  platform?: PlatformType;
  enrollmentStatus?: DeviceEnrollmentStatus;
  sessionStatus?: StudentStatus;
  isSessionJoined?: boolean;
  lastActive?: string;
  joinedAt: string;
  sessionJoinedAt?: string;
}

export interface ClassSessionParticipationMetrics {
  totalEnrolled: number;
  joined: number;
  ready: number;
  active: number;
  emergency: number;
  interrupted: number;
  offline: number;
  notJoined: number;
}

export interface ClassHistoryItem {
  sessionId: string;
  sessionName: string;
  date: string;
  startsAt: string;
  endsAt: string;
  studentCount: number;
  interruptionCount: number;
  emergencyCount: number;
  status: SessionStatus;
}

export interface ClassReportSummary {
  classId: string;
  className: string;
  classCode: string;
  department: string;
  section: string;
  facultyName: string;
  totalStudents: number;
  sessionsConducted: number;
  averageAttendance: number;
  interruptions: number;
  emergencyEvents: number;
  offlineEvents: number;
  securityFailures: number;
  completedSessions: number;
}

// React Native Native Module Security Contract
export type SecurityState =
  | 'UNAVAILABLE'
  | 'CHECKING'
  | 'READY'
  | 'STARTING'
  | 'ACTIVE'
  | 'INTERRUPTED'
  | 'ENDING'
  | 'ENDED'
  | 'FAILED';

export type NativeSecurityEvent =
  | 'lockConfirmed'
  | 'lockFailed'
  | 'lockExited'
  | 'deviceRebooted'
  | 'securityStateChanged'
  | 'assessmentBegan'
  | 'assessmentFailed'
  | 'assessmentInterrupted'
  | 'assessmentEnded';

