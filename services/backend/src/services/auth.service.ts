import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { DataStore } from '../store/database.js';
import { config } from '../config.js';
import {
  UserRole,
  RefreshToken,
  User,
  Student,
  Device,
  PlatformType,
  DeviceEnrollmentStatus,
  ClassMembershipStatus,
  OtpPurpose,
  Institution,
  ClassJoinMethod
} from '@lockwatch/shared-models';
import { Logger } from '../logger.js';
import { OtpService, OtpProvider } from './otp.service.js';
import { normalizePhoneNumber } from './phone.utils.js';
import { PostgresSync } from '../store/postgres-sync.js';

export interface TokenPayload {
  userId: string;
  institutionId: string;
  role: UserRole;
  name: string;
  email: string;
  facultyId?: string;
  studentId?: string;
}

export class AuthService {
  private store = DataStore.getInstance();
  private failedAttempts = new Map<string, { count: number; lockedUntil: number }>();
  private otpService: OtpService = new OtpService(this.store);

  public getOtpService(): OtpService {
    return this.otpService;
  }

  public setOtpProvider(provider: OtpProvider): void {
    this.otpService.setProvider(provider);
  }

  public async facultyLogin(payload: {
    identifier: string;
    password?: string;
    pin?: string;
    institutionCode: string;
    ipAddress?: string;
  }) {
    const institution = this.store.findInstitutionByCode(payload.institutionCode);
    if (!institution) {
      throw new Error('Invalid institution code');
    }

    const lockKey = `${institution.id}:${payload.identifier.toLowerCase()}`;
    this.checkRateLimit(lockKey);

    let user: User | undefined;
    // Check if identifier is email or faculty ID number
    if (payload.identifier.includes('@')) {
      user = this.store.findUserByEmailAndInstitution(institution.id, payload.identifier);
    } else {
      for (const f of this.store.faculty.values()) {
        if (f.institutionId === institution.id && f.facultyIdNumber.toLowerCase() === payload.identifier.toLowerCase()) {
          user = this.store.users.get(f.userId);
          break;
        }
      }
    }

    if (!user || user.role !== UserRole.FACULTY || !user.isActive) {
      this.recordFailedAttempt(lockKey);
      throw new Error('Invalid faculty credentials');
    }

    // Verify Password or PIN
    let authenticated = false;
    if (payload.password && user.passwordHash) {
      authenticated = await bcrypt.compare(payload.password, user.passwordHash);
    } else if (payload.pin && user.pinHash) {
      authenticated = await bcrypt.compare(payload.pin, user.pinHash);
    }

    if (!authenticated) {
      this.recordFailedAttempt(lockKey);
      throw new Error('Invalid faculty credentials or PIN');
    }

    // Clear failed attempts on success
    this.failedAttempts.delete(lockKey);

    const faculty = this.store.findFacultyByUserId(user.id);
    const tokens = this.generateTokenPair({
      userId: user.id,
      institutionId: institution.id,
      role: user.role,
      name: user.name,
      email: user.email,
      facultyId: faculty?.id
    });

    Logger.info('Faculty logged in successfully', {
      userId: user.id,
      institutionId: institution.id,
      operation: 'FACULTY_LOGIN'
    });

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        facultyProfile: faculty,
        institution: {
          id: institution.id,
          code: institution.code,
          name: institution.name
        }
      },
      ...tokens
    };
  }

  // ==========================================
  // Student OTP Sign-Up & Password Reset Flows
  // ==========================================

  public async requestStudentSignupOtp(rawPhone: string) {
    const phoneNumber = normalizePhoneNumber(rawPhone);
    const existingStudent = this.store.findStudentByPhone(phoneNumber);
    if (existingStudent) {
      throw new Error('An account already exists for this mobile number.');
    }
    return this.otpService.requestOtp(phoneNumber, OtpPurpose.SIGNUP);
  }

  public async verifyStudentSignupOtp(challengeId: string, otp: string) {
    const result = await this.otpService.verifyOtp(challengeId, otp, OtpPurpose.SIGNUP);
    return {
      success: true,
      verificationToken: result.challengeId,
      phoneNumber: result.phoneNumber,
      message: 'Mobile number verified successfully.'
    };
  }

  public async createStudentAccount(payload: {
    verificationToken: string;
    password: string;
    name: string;
    registerNumber: string;
    institutionCode?: string;
  }) {
    // 1. Transactionally consume verified challenge
    const challenge = this.otpService.consumeVerifiedChallenge(payload.verificationToken, OtpPurpose.SIGNUP);
    const phoneNumber = challenge.phoneNumber;

    // 2. Database uniqueness constraint check (Section 4)
    if (this.store.findStudentByPhone(phoneNumber)) {
      throw new Error('An account already exists for this mobile number.');
    }

    if (!payload.password || payload.password.length < 6) {
      throw new Error('Password must be at least 6 characters long.');
    }

    const regUpper = payload.registerNumber.trim().toUpperCase();
    const instCode = payload.institutionCode?.trim() || 'TECH-UNI';
    const institution = this.store.findInstitutionByCode(instCode) || Array.from(this.store.institutions.values())[0];
    if (!institution) {
      throw new Error('Institution not found.');
    }

    const userId = uuidv4();
    const studentId = uuidv4();
    const deviceId = uuidv4();
    const passwordHash = bcrypt.hashSync(payload.password, 10);
    const cleanName = payload.name.trim();

    const user: User = {
      id: userId,
      institutionId: institution.id,
      role: UserRole.STUDENT,
      email: `${regUpper.toLowerCase()}@student.${institution.code.toLowerCase()}.edu`,
      passwordHash,
      name: cleanName,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.store.users.set(userId, user);
    this.store.userEmailIndex.set(`${institution.id}:${user.email.toLowerCase()}`, userId);

    const student: Student = {
      id: studentId,
      userId,
      institutionId: institution.id,
      registerNumber: regUpper,
      name: cleanName,
      phoneNumber,
      phoneVerifiedAt: new Date().toISOString(),
      department: 'Computer Science & Engineering',
      className: 'Undergraduate Program',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.store.students.set(studentId, student);
    this.store.studentRegIndex.set(`${institution.id}:${regUpper}`, studentId);
    this.store.studentPhoneIndex.set(phoneNumber, studentId);

    const device: Device = {
      id: deviceId,
      studentId,
      institutionId: institution.id,
      platform: PlatformType.ANDROID,
      manufacturer: 'Android Device',
      model: 'Mobile Client',
      osVersion: 'Android 14',
      appVersion: '1.0.0',
      enrollmentStatus: DeviceEnrollmentStatus.SECURE_READY,
      isDeviceOwner: true,
      hasAacEntitlement: false,
      publicKey: `MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA${regUpper}PUBKEY`,
      lastSeenAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.store.devices.set(deviceId, device);
    PostgresSync.getInstance().saveUser(user).catch(() => {});
    PostgresSync.getInstance().saveStudent(student).catch(() => {});
    PostgresSync.getInstance().saveDevice(device).catch(() => {});

    const tokens = this.generateTokenPair({
      userId,
      institutionId: institution.id,
      role: UserRole.STUDENT,
      name: cleanName,
      email: user.email,
      studentId
    });

    Logger.info('Student account created successfully via OTP verification', {
      userId,
      studentId,
      phoneNumber,
      registerNumber: regUpper
    });

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        studentProfile: student,
        device,
        institution: {
          id: institution.id,
          code: institution.code,
          name: institution.name
        }
      },
      ...tokens
    };
  }

  public async requestStudentPasswordResetOtp(rawPhone: string) {
    const phoneNumber = normalizePhoneNumber(rawPhone);
    const student = this.store.findStudentByPhone(phoneNumber);
    if (!student) {
      throw new Error('No student account found for this mobile number.');
    }
    return this.otpService.requestOtp(phoneNumber, OtpPurpose.PASSWORD_RESET);
  }

  public async verifyStudentPasswordResetOtp(challengeId: string, otp: string) {
    const result = await this.otpService.verifyOtp(challengeId, otp, OtpPurpose.PASSWORD_RESET);
    return {
      success: true,
      resetToken: result.challengeId,
      phoneNumber: result.phoneNumber,
      message: 'Mobile number verified. You may now reset your password.'
    };
  }

  public async resetStudentPassword(payload: { resetToken: string; newPassword: string }) {
    const challenge = this.otpService.consumeVerifiedChallenge(payload.resetToken, OtpPurpose.PASSWORD_RESET);
    const student = this.store.findStudentByPhone(challenge.phoneNumber);
    if (!student) {
      throw new Error('Student account not found.');
    }
    const user = this.store.users.get(student.userId);
    if (!user) {
      throw new Error('User profile not found.');
    }

    if (!payload.newPassword || payload.newPassword.length < 6) {
      throw new Error('Password must be at least 6 characters long.');
    }

    user.passwordHash = bcrypt.hashSync(payload.newPassword, 10);
    user.updatedAt = new Date().toISOString();

    Logger.info('Student password reset successfully', { studentId: student.id, userId: user.id });
    return {
      success: true,
      message: 'Your password has been reset.'
    };
  }

  // ==========================================
  // Student Login (Mobile Number or Register No)
  // ==========================================

  public async studentLogin(payload: {
    phoneNumber?: string;
    registerNumber?: string;
    password: string;
    institutionCode?: string;
    ipAddress?: string;
  }) {
    let student: Student | undefined;
    let institution: Institution | undefined;

    // Check if identifier is an email address
    const emailCandidate = (payload.phoneNumber && payload.phoneNumber.includes('@'))
      ? payload.phoneNumber.trim().toLowerCase()
      : (payload.registerNumber && payload.registerNumber.includes('@'))
        ? payload.registerNumber.trim().toLowerCase()
        : null;

    if (emailCandidate) {
      for (const u of this.store.users.values()) {
        if (u.email.toLowerCase() === emailCandidate && u.role === UserRole.STUDENT) {
          student = this.store.findStudentByUserId(u.id);
          if (student) {
            institution = this.store.institutions.get(student.institutionId);
          }
          break;
        }
      }
      if (!student) {
        throw new Error('Invalid email or student credentials.');
      }
    } else if (payload.phoneNumber) {
      // 1. Primary: Login by Mobile Number (Section 13)
      const normalized = normalizePhoneNumber(payload.phoneNumber);
      student = this.store.findStudentByPhone(normalized);
      if (!student) {
        throw new Error('Invalid mobile number or password.');
      }
      institution = this.store.institutions.get(student.institutionId);
    } else if (payload.registerNumber) {
      // 2. Check if registerNumber is an entered mobile number
      const digitsOnly = payload.registerNumber.replace(/[\s\-\(\)]/g, '');
      if (/^\+?\d{10,15}$/.test(digitsOnly)) {
        try {
          const norm = normalizePhoneNumber(payload.registerNumber);
          student = this.store.findStudentByPhone(norm);
          if (student) {
            institution = this.store.institutions.get(student.institutionId);
          }
        } catch {
          // Continue to register number lookup
        }
      }

      // 3. Fallback: Lookup by Register Number
      if (!student) {
        if (payload.institutionCode) {
          institution = this.store.findInstitutionByCode(payload.institutionCode);
          if (institution) {
            student = this.store.findStudentByRegAndInstitution(institution.id, payload.registerNumber);
          }
        } else {
          for (const s of this.store.students.values()) {
            if (s.registerNumber.toUpperCase() === payload.registerNumber.trim().toUpperCase()) {
              student = s;
              institution = this.store.institutions.get(s.institutionId);
              break;
            }
          }
        }
      }
    }

    let user: User | undefined;

    if (!student) {
      // Auto-provision student account if registerNumber was used with institutionCode (for backward compatibility)
      if (payload.registerNumber && payload.institutionCode) {
        const inst = this.store.findInstitutionByCode(payload.institutionCode);
        if (!inst) {
          throw new Error('Invalid institution code');
        }
        institution = inst;
        const newUserId = uuidv4();
        const newStudentId = uuidv4();
        const newDevId = uuidv4();
        const studentPasswordHash = bcrypt.hashSync(payload.password || 'StudentPassword123!', 10);

        user = {
          id: newUserId,
          institutionId: institution.id,
          role: UserRole.STUDENT,
          email: `${payload.registerNumber.toLowerCase()}@student.${institution.code.toLowerCase()}.edu`,
          passwordHash: studentPasswordHash,
          name: `Student ${payload.registerNumber.toUpperCase()}`,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        this.store.users.set(newUserId, user);
        this.store.userEmailIndex.set(`${institution.id}:${user.email.toLowerCase()}`, newUserId);

        student = {
          id: newStudentId,
          userId: newUserId,
          institutionId: institution.id,
          registerNumber: payload.registerNumber.toUpperCase(),
          name: user.name,
          department: 'Computer Science & Engineering',
          className: 'B.Tech CS-A',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        this.store.students.set(newStudentId, student);
        this.store.studentRegIndex.set(`${institution.id}:${student.registerNumber}`, newStudentId);

        const dev: Device = {
          id: newDevId,
          studentId: newStudentId,
          institutionId: institution.id,
          platform: PlatformType.ANDROID,
          manufacturer: 'Android Device',
          model: 'Mobile Client',
          osVersion: 'Android 14',
          appVersion: '1.0.0',
          enrollmentStatus: DeviceEnrollmentStatus.SECURE_READY,
          isDeviceOwner: true,
          hasAacEntitlement: false,
          publicKey: `MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA${payload.registerNumber}PUBKEY`,
          lastSeenAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        this.store.devices.set(newDevId, dev);
        PostgresSync.getInstance().saveUser(user).catch(() => {});
        PostgresSync.getInstance().saveStudent(student).catch(() => {});
        PostgresSync.getInstance().saveDevice(dev).catch(() => {});

        // Auto-enroll in all active classes of the institution
        for (const cls of this.store.classes.values()) {
          if (cls.institutionId === institution.id && cls.status === 'ACTIVE') {
            const memId = uuidv4();
            this.store.classMemberships.set(memId, {
              id: memId,
              classId: cls.id,
              studentId: newStudentId,
              displayName: student.name,
              registerNumber: student.registerNumber,
              joinMethod: ClassJoinMethod.FACULTY_ADDED,
              status: ClassMembershipStatus.ENROLLED,
              joinedAt: new Date().toISOString()
            });
            this.store.classMembershipIndex.add(`${cls.id}:${newStudentId}`);
            this.store.classRosterRegIndex.set(`${cls.id}:${student.registerNumber}`, newStudentId);
          }
        }
      } else {
        throw new Error('Invalid mobile number or credentials.');
      }
    } else {
      user = this.store.users.get(student.userId);
      if (!user || !user.isActive) {
        throw new Error('Student account inactive or unavailable');
      }

      const valid = await bcrypt.compare(payload.password, user.passwordHash);
      if (!valid) {
        throw new Error('Invalid student credentials');
      }
    }

    if (!institution) {
      institution = this.store.institutions.get(student.institutionId) || Array.from(this.store.institutions.values())[0];
    }

    const device = this.store.findDeviceByStudentId(student.id);

    const tokens = this.generateTokenPair({
      userId: user.id,
      institutionId: institution.id,
      role: user.role,
      name: user.name,
      email: user.email,
      studentId: student.id
    });

    Logger.info('Student logged in successfully', {
      userId: user.id,
      institutionId: institution.id,
      studentId: student.id,
      operation: 'STUDENT_LOGIN'
    });

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        studentProfile: student,
        device: device || null,
        institution: {
          id: institution.id,
          code: institution.code,
          name: institution.name
        }
      },
      ...tokens
    };
  }

  public async refreshAccessToken(refreshTokenStr: string) {
    try {
      const decoded = jwt.verify(refreshTokenStr, config.refreshSecret) as TokenPayload & { jti: string };
      const tokenDoc = this.store.refreshTokens.get(decoded.jti);

      if (!tokenDoc || tokenDoc.revoked) {
        throw new Error('Refresh token revoked or invalid');
      }

      // Mark old token revoked for rotation
      tokenDoc.revoked = true;

      const user = this.store.users.get(decoded.userId);
      if (!user || !user.isActive) {
        throw new Error('User not found or inactive');
      }

      const faculty = this.store.findFacultyByUserId(user.id);
      const student = this.store.findStudentByUserId(user.id);

      return this.generateTokenPair({
        userId: user.id,
        institutionId: user.institutionId,
        role: user.role,
        name: user.name,
        email: user.email,
        facultyId: faculty?.id,
        studentId: student?.id
      });
    } catch {
      throw new Error('Invalid or expired refresh token');
    }
  }

  public async logout(userId: string) {
    for (const token of this.store.refreshTokens.values()) {
      if (token.userId === userId) {
        token.revoked = true;
      }
    }
  }

  private generateTokenPair(payload: TokenPayload) {
    const tokenId = uuidv4();
    const accessToken = jwt.sign(payload, config.jwtSecret, { expiresIn: '15m' });
    const refreshToken = jwt.sign({ ...payload, jti: tokenId }, config.refreshSecret, { expiresIn: '7d' });

    const tokenDoc: RefreshToken = {
      id: tokenId,
      userId: payload.userId,
      tokenHash: tokenId,
      expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
      revoked: false,
      createdAt: new Date().toISOString()
    };
    this.store.refreshTokens.set(tokenId, tokenDoc);

    return { accessToken, refreshToken, expiresIn: 900 };
  }

  private checkRateLimit(key: string) {
    const record = this.failedAttempts.get(key);
    if (record && record.lockedUntil > Date.now()) {
      const waitSeconds = Math.ceil((record.lockedUntil - Date.now()) / 1000);
      throw new Error(`Account temporarily throttled due to multiple failed attempts. Try again in ${waitSeconds}s.`);
    }
  }

  private recordFailedAttempt(key: string) {
    const now = Date.now();
    const record = this.failedAttempts.get(key) || { count: 0, lockedUntil: 0 };
    record.count += 1;
    if (record.count >= 5) {
      record.lockedUntil = now + 60000; // 1 minute lockout
      record.count = 0;
    }
    this.failedAttempts.set(key, record);
  }
}
