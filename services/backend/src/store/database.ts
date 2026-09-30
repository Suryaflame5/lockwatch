import bcrypt from 'bcryptjs';
import {
  Institution,
  User,
  Faculty,
  Student,
  Device,
  Session,
  SessionParticipant,
  SessionCommand,
  SessionEvent,
  Alert,
  AuditLog,
  RefreshToken,
  UserRole,
  PlatformType,
  StudentStatus,
  SessionStatus,
  DeviceEnrollmentStatus,
  NetworkQuality,
  Class,
  ClassMembership,
  ClassJoinToken,
  ClassStatus,
  ClassMembershipStatus,
  OtpChallenge,
  ClassJoinMethod
} from '@lockwatch/shared-models';

/**
 * High-Integrity DataStore with transactional simulation, multi-tenant isolation,
 * and immutable event sequencing.
 */
export class DataStore {
  private static instance: DataStore;

  public institutions = new Map<string, Institution>();
  public users = new Map<string, User>();
  public faculty = new Map<string, Faculty>();
  public students = new Map<string, Student>();
  public devices = new Map<string, Device>();
  public sessions = new Map<string, Session>();
  public participants = new Map<string, SessionParticipant>();
  public commands = new Map<string, SessionCommand>();
  public events = new Map<string, SessionEvent>();
  public alerts = new Map<string, Alert>();
  public auditLogs = new Map<string, AuditLog>();
  public refreshTokens = new Map<string, RefreshToken>();
  public classes = new Map<string, Class>();
  public classMemberships = new Map<string, ClassMembership>();
  public classJoinTokens = new Map<string, ClassJoinToken>();
  public otpChallenges = new Map<string, OtpChallenge>();

  // Uniqueness indexes
  public deviceSequenceIndex = new Set<string>(); // `${deviceId}:${sequence}`
  public sessionJoinCodeIndex = new Map<string, string>(); // joinCode -> sessionId
  public userEmailIndex = new Map<string, string>(); // `${institutionId}:${email}` -> userId
  public studentRegIndex = new Map<string, string>(); // `${institutionId}:${registerNumber}` -> studentId
  public studentPhoneIndex = new Map<string, string>(); // normalizedPhoneNumber -> studentId (UNIQUE)
  public classCodeIndex = new Map<string, string>(); // classCode -> classId
  public classMembershipIndex = new Set<string>(); // `${classId}:${studentId}`
  public classRosterRegIndex = new Map<string, string>(); // `${classId}:${registerNumber}` -> studentId (UNIQUE per class)

  private constructor() {
    this.seedInitialData();
  }

  public static getInstance(): DataStore {
    if (!DataStore.instance) {
      DataStore.instance = new DataStore();
    }
    return DataStore.instance;
  }

  private seedInitialData() {
    const instId = '11111111-1111-1111-1111-111111111111';
    const institution: Institution = {
      id: instId,
      code: 'TECH-UNI',
      name: 'Apex Institute of Technology & Sciences',
      domain: 'apextech.edu',
      retentionDays: 90,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.institutions.set(instId, institution);

    // Faculty password: FacultyPassword123!
    // Faculty PIN: 123456
    const passwordHash = bcrypt.hashSync('FacultyPassword123!', 10);
    const pinHash = bcrypt.hashSync('123456', 10);
    const studentPasswordHash = bcrypt.hashSync('StudentPassword123!', 10);

    const facultyUserId = '22222222-2222-2222-2222-222222222222';
    const facultyUser: User = {
      id: facultyUserId,
      institutionId: instId,
      role: UserRole.FACULTY,
      email: 'faculty@apextech.edu',
      passwordHash,
      pinHash,
      name: 'Dr. Rajesh Raman',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.users.set(facultyUserId, facultyUser);
    this.userEmailIndex.set(`${instId}:${facultyUser.email.toLowerCase()}`, facultyUserId);

    const facultyProfileId = '33333333-3333-3333-3333-333333333333';
    const facultyProfile: Faculty = {
      id: facultyProfileId,
      userId: facultyUserId,
      institutionId: instId,
      facultyIdNumber: 'FAC-CS-084',
      department: 'Computer Science & Engineering',
      designation: 'Professor & Head',
      name: 'Dr. Rajesh Raman',
      email: 'faculty@apextech.edu',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.faculty.set(facultyProfileId, facultyProfile);

    // 60 Seed Students (full class coverage for 58-60 students)
    const baseNames = [
      'Arun Kumar', 'Priya Sundaram', 'Karthik Raja', 'Deepa Murugan', 'Vijay Venkat',
      'Ananya Sharma', 'Rohan Gupta', 'Meera Nair', 'Siddharth Iyer', 'Pooja Reddy',
      'Aditya Varma', 'Divya Patel', 'Gautam Menon', 'Sneha Kulkarni', 'Varun Rao',
      'Nandini Joshi', 'Kunal Shah', 'Bhavna Das', 'Abhishek Sen', 'Kavita Pillai',
      'Harish Chandra', 'Lavanya Natarajan', 'Manoj Kumar', 'Gayatri Bhatt', 'Vikas Mehra',
      'Swati Deshmukh', 'Ashwin Pillai', 'Ritu Saxena', 'Naveen Reddy', 'Aarthi Krishnan',
      'Tarun Sethi', 'Sunita Roy', 'Pranav Mishra', 'Tanvi Singhal', 'Chirag Parekh',
      'Sangeeta Paul', 'Rahul Dravid', 'Shreya Ghoshal', 'Nikhil Kamath', 'Aishwarya Rai',
      'Suresh Raina', 'Vidya Balan', 'Rohit Sharma', 'Anushka Sharma', 'Sachin Ramesh',
      'Deepika Padukone', 'Virat Kohli', 'Kareena Kapoor', 'Ranbir Kapoor', 'Alia Bhatt',
      'Ayushmann Khurrana', 'Radhika Apte', 'Rajkummar Rao', 'Shraddha Kapoor', 'Vicky Kaushal',
      'Taapsee Pannu', 'Kartik Aaryan', 'Kriti Sanon', 'Dev Patel', 'Mithali Raj'
    ];

    const studentData: Array<{
      id: string;
      userId: string;
      reg: string;
      name: string;
      email: string;
      platform: PlatformType;
      model: string;
      os: string;
      isOwner: boolean;
      aac: boolean;
      ready: DeviceEnrollmentStatus;
    }> = [];

    for (let i = 1; i <= 60; i++) {
      const idxStr = String(i).padStart(3, '0');
      const userId = `44444444-4444-4444-4444-444444444${idxStr}`;
      const stuId = `55555555-5555-5555-5555-555555555${idxStr}`;

      if (i === 1) {
        studentData.push({
          id: '55555555-5555-5555-5555-555555555001',
          userId: '44444444-4444-4444-4444-444444444001',
          reg: '23AIML104',
          name: 'Arun Kumar',
          email: 'arun.k@student.apextech.edu',
          platform: PlatformType.ANDROID,
          model: 'Galaxy A54 5G',
          os: 'Android 14 (API 34)',
          isOwner: true,
          aac: false,
          ready: DeviceEnrollmentStatus.SECURE_READY
        });
      } else if (i === 2) {
        studentData.push({
          id: '55555555-5555-5555-5555-555555555002',
          userId: '44444444-4444-4444-4444-444444444002',
          reg: '23AIML118',
          name: 'Priya Sundaram',
          email: 'priya.s@student.apextech.edu',
          platform: PlatformType.IOS,
          model: 'iPhone 15 Pro',
          os: 'iOS 17.5.1',
          isOwner: false,
          aac: true,
          ready: DeviceEnrollmentStatus.SECURE_READY
        });
      } else if (i === 3) {
        studentData.push({
          id: '55555555-5555-5555-5555-555555555003',
          userId: '44444444-4444-4444-4444-444444444003',
          reg: '23AIML122',
          name: 'Karthik Raja',
          email: 'karthik.r@student.apextech.edu',
          platform: PlatformType.ANDROID,
          model: 'Pixel 8',
          os: 'Android 14 (API 34)',
          isOwner: true,
          aac: false,
          ready: DeviceEnrollmentStatus.SECURE_READY
        });
      } else if (i === 4) {
        studentData.push({
          id: '55555555-5555-5555-5555-555555555004',
          userId: '44444444-4444-4444-4444-444444444004',
          reg: '23AIML130',
          name: 'Deepa Murugan',
          email: 'deepa.m@student.apextech.edu',
          platform: PlatformType.IOS,
          model: 'iPad 10th Gen',
          os: 'iPadOS 17.4',
          isOwner: false,
          aac: true,
          ready: DeviceEnrollmentStatus.SECURE_READY
        });
      } else if (i === 5) {
        studentData.push({
          id: '55555555-5555-5555-5555-555555555005',
          userId: '44444444-4444-4444-4444-444444444005',
          reg: '23AIML145',
          name: 'Vijay Venkat',
          email: 'vijay.v@student.apextech.edu',
          platform: PlatformType.ANDROID,
          model: 'Redmi Note 13',
          os: 'Android 13 (MIUI 14)',
          isOwner: false,
          aac: false,
          ready: DeviceEnrollmentStatus.NOT_READY
        });
      } else {
        const isIos = i % 4 === 0;
        const regNum = `23AIML${100 + i}`;
        const name = baseNames[i - 1] || `Student ${i}`;
        studentData.push({
          id: stuId,
          userId,
          reg: regNum,
          name,
          email: `student${i}@student.apextech.edu`,
          platform: isIos ? PlatformType.IOS : PlatformType.ANDROID,
          model: isIos ? 'iPhone 14' : 'Galaxy S23',
          os: isIos ? 'iOS 17.4' : 'Android 14 (API 34)',
          isOwner: !isIos,
          aac: isIos,
          ready: DeviceEnrollmentStatus.SECURE_READY
        });
      }
    }

    studentData.forEach((s, idx) => {
      const u: User = {
        id: s.userId,
        institutionId: instId,
        role: UserRole.STUDENT,
        email: s.email,
        passwordHash: studentPasswordHash,
        name: s.name,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      this.users.set(s.userId, u);
      this.userEmailIndex.set(`${instId}:${s.email.toLowerCase()}`, s.userId);

      const phone = `+919876543${String(100 + idx + 1).padStart(3, '0')}`;
      const stu: Student = {
        id: s.id,
        userId: s.userId,
        institutionId: instId,
        registerNumber: s.reg,
        name: s.name,
        phoneNumber: phone,
        phoneVerifiedAt: new Date().toISOString(),
        department: 'Artificial Intelligence',
        className: 'B.Tech AI-A',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      this.students.set(s.id, stu);
      this.studentRegIndex.set(`${instId}:${s.reg.toUpperCase()}`, s.id);
      this.studentPhoneIndex.set(phone, s.id);
      // For student 104, also index the demo standard phone +919876543210
      if (s.reg === '23AIML104') {
        this.studentPhoneIndex.set('+919876543210', s.id);
      }

      const devId = `66666666-6666-6666-6666-666666666${String(idx + 1).padStart(3, '0')}`;
      const dev: Device = {
        id: devId,
        studentId: s.id,
        institutionId: instId,
        platform: s.platform,
        manufacturer: s.platform === PlatformType.ANDROID ? (s.model.includes('Galaxy') ? 'Samsung' : s.model.includes('Pixel') ? 'Google' : 'Xiaomi') : 'Apple',
        model: s.model,
        osVersion: s.os,
        appVersion: '1.0.0',
        enrollmentStatus: s.ready,
        isDeviceOwner: s.isOwner,
        hasAacEntitlement: s.aac,
        publicKey: `MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA${s.reg}PUBKEY`,
        lastSeenAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      this.devices.set(devId, dev);
    });

    // Seed Developer / Tester Account (Current USB Debugging Connected Android Device: vivo V2521)
    const suryaUserId = '44444444-4444-4444-4444-444444444999';
    const suryaStudentId = '55555555-5555-5555-5555-555555555999';
    const suryaDevId = '66666666-6666-6666-6666-666666666999';
    const suryaPassHash = studentPasswordHash;
    const suryaPhone = '+917418320315';

    const suryaUser: User = {
      id: suryaUserId,
      institutionId: instId,
      role: UserRole.STUDENT,
      email: 'suryaflame2007@gmail.com',
      passwordHash: suryaPassHash,
      name: 'Surya',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.users.set(suryaUserId, suryaUser);
    this.userEmailIndex.set(`${instId}:suryaflame2007@gmail.com`, suryaUserId);

    const suryaStudent: Student = {
      id: suryaStudentId,
      userId: suryaUserId,
      institutionId: instId,
      registerNumber: '23AIML007',
      name: 'Surya',
      phoneNumber: suryaPhone,
      phoneVerifiedAt: new Date().toISOString(),
      department: 'Artificial Intelligence',
      className: 'B.Tech AI-A',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.students.set(suryaStudentId, suryaStudent);
    this.studentRegIndex.set(`${instId}:23AIML007`, suryaStudentId);
    this.studentPhoneIndex.set(suryaPhone, suryaStudentId);
    this.studentPhoneIndex.set('7418320315', suryaStudentId);

    const suryaDev: Device = {
      id: suryaDevId,
      studentId: suryaStudentId,
      institutionId: instId,
      platform: PlatformType.ANDROID,
      manufacturer: 'vivo',
      model: 'V2521',
      osVersion: 'Android 16 (API 36)',
      appVersion: '1.0.0',
      enrollmentStatus: DeviceEnrollmentStatus.SECURE_READY,
      isDeviceOwner: true,
      hasAacEntitlement: false,
      publicKey: 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAsuryaVivoSecKey999',
      lastSeenAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.devices.set(suryaDevId, suryaDev);

    // Seed Class
    const classId = '99999999-9999-9999-9999-999999999999';
    const seededClass: Class = {
      id: classId,
      institutionId: instId,
      createdBy: facultyProfileId,
      name: 'AI & Machine Learning Section E',
      subject: 'CS804 - Artificial Intelligence & Neural Networks',
      department: 'Computer Science & Engineering',
      year: '2026-2027',
      semester: 'Semester 6',
      section: 'E',
      description: 'Supervised classroom and laboratory examinations for Section E students.',
      classCode: 'AIML-E-8K42',
      status: ClassStatus.ACTIVE,
      startTime: '09:00',
      endTime: '10:30',
      activeSessionId: '77777777-7777-7777-7777-777777777777',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.classes.set(classId, seededClass);
    this.classCodeIndex.set(seededClass.classCode.toUpperCase(), classId);

    // Enroll students in Seed Class with academic identity
    studentData.forEach((s, idx) => {
      const idxPad = String(idx + 1).padStart(3, '0');
      const memId = `aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa${idxPad}`;
      const membership: ClassMembership = {
        id: memId,
        classId,
        studentId: s.id,
        displayName: s.name,
        registerNumber: s.reg,
        joinMethod: ClassJoinMethod.FACULTY_ADDED,
        status: ClassMembershipStatus.ENROLLED,
        joinedAt: new Date(Date.now() - 86400000).toISOString()
      };
      this.classMemberships.set(memId, membership);
      this.classMembershipIndex.add(`${classId}:${s.id}`);
      this.classRosterRegIndex.set(`${classId}:${s.reg.toUpperCase()}`, s.id);
    });

    const suryaMemId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa999';
    this.classMemberships.set(suryaMemId, {
      id: suryaMemId,
      classId,
      studentId: suryaStudentId,
      displayName: 'Surya',
      registerNumber: '23AIML007',
      joinMethod: ClassJoinMethod.FACULTY_ADDED,
      status: ClassMembershipStatus.ENROLLED,
      joinedAt: new Date(Date.now() - 86400000).toISOString()
    });
    this.classMembershipIndex.add(`${classId}:${suryaStudentId}`);
    this.classRosterRegIndex.set(`${classId}:23AIML007`, suryaStudentId);

    // Seed Session
    const sessId = '77777777-7777-7777-7777-777777777777';
    const session: Session = {
      id: sessId,
      institutionId: instId,
      facultyId: facultyProfileId,
      classId,
      name: 'Artificial Intelligence Internal Assessment I',
      subject: 'CS804 - Artificial Intelligence & Neural Networks',
      department: 'Computer Science & Engineering',
      className: 'B.Tech AI-A',
      joinCode: 'LW-AI-804',
      joinTokenSecret: 'secret_token_lw_ai_804_signature_2026',
      status: SessionStatus.READY,
      scheduledStartTime: new Date(Date.now() + 600000).toISOString(),
      durationMinutes: 90,
      endsAt: new Date(Date.now() + 90 * 60000).toISOString(),
      emergencyDurationSeconds: 15,
      joinWindowMinutes: 30,
      rules: [
        'Strict native OS lockdown active',
        'Unauthorized task switching is strictly audited',
        'Controlled emergency access is limited to 15 seconds',
        'All interruptions are recorded with immutable server timestamps'
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.sessions.set(sessId, session);
    this.sessionJoinCodeIndex.set(session.joinCode.toUpperCase(), sessId);

    // Connect participants initially
    studentData.forEach((s, idx) => {
      const idxPad = String(idx + 1).padStart(3, '0');
      const partId = `88888888-8888-8888-8888-888888888${idxPad}`;
      const devId = `66666666-6666-6666-6666-666666666${idxPad}`;
      const p: SessionParticipant = {
        id: partId,
        sessionId: sessId,
        studentId: s.id,
        deviceId: devId,
        institutionId: instId,
        status: StudentStatus.READY,
        joinedAt: new Date(Date.now() - 120000).toISOString(),
        lastHeartbeatAt: new Date().toISOString(),
        batteryLevel: 85 - idx * 4,
        isCharging: idx === 1,
        networkQuality: NetworkQuality.ONLINE,
        screenOn: true,
        deviceLocked: false,
        emergencyUsageCount: 0,
        interruptionCount: 0,
        offlineDurationSeconds: 0,
        lockVerified: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      this.participants.set(partId, p);
    });
  }

  // --- Multi-Tenant Query Helpers ---

  public findInstitutionByCode(code: string): Institution | undefined {
    for (const inst of this.institutions.values()) {
      if (inst.code.toUpperCase() === code.toUpperCase()) return inst;
    }
    return undefined;
  }

  public findUserByEmailAndInstitution(institutionId: string, email: string): User | undefined {
    const id = this.userEmailIndex.get(`${institutionId}:${email.toLowerCase()}`);
    return id ? this.users.get(id) : undefined;
  }

  public findStudentByRegAndInstitution(institutionId: string, reg: string): Student | undefined {
    const id = this.studentRegIndex.get(`${institutionId}:${reg.toUpperCase()}`);
    return id ? this.students.get(id) : undefined;
  }

  public findFacultyByUserId(userId: string): Faculty | undefined {
    for (const f of this.faculty.values()) {
      if (f.userId === userId) return f;
    }
    return undefined;
  }

  public findStudentByUserId(userId: string): Student | undefined {
    for (const s of this.students.values()) {
      if (s.userId === userId) return s;
    }
    return undefined;
  }

  public findDeviceByStudentId(studentId: string): Device | undefined {
    for (const d of this.devices.values()) {
      if (d.studentId === studentId) return d;
    }
    return undefined;
  }

  public findSessionByJoinCode(code: string): Session | undefined {
    const id = this.sessionJoinCodeIndex.get(code.toUpperCase());
    return id ? this.sessions.get(id) : undefined;
  }

  public findParticipant(sessionId: string, studentId: string): SessionParticipant | undefined {
    for (const p of this.participants.values()) {
      if (p.sessionId === sessionId && p.studentId === studentId) return p;
    }
    return undefined;
  }

  public getSessionParticipants(sessionId: string): SessionParticipant[] {
    return Array.from(this.participants.values()).filter(p => p.sessionId === sessionId);
  }

  public getSessionAlerts(sessionId: string): Alert[] {
    return Array.from(this.alerts.values())
      .filter(a => a.sessionId === sessionId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  public getSessionEvents(sessionId: string): SessionEvent[] {
    return Array.from(this.events.values())
      .filter(e => e.sessionId === sessionId)
      .sort((a, b) => a.sequence - b.sequence);
  }

  // --- Class Management Helpers ---

  public findClassByCode(code: string): Class | undefined {
    const id = this.classCodeIndex.get(code.toUpperCase());
    return id ? this.classes.get(id) : undefined;
  }

  public findClassById(id: string): Class | undefined {
    return this.classes.get(id);
  }

  public indexClassCode(code: string, classId: string) {
    this.classCodeIndex.set(code.toUpperCase(), classId);
  }

  public removeClassCodeIndex(code: string) {
    this.classCodeIndex.delete(code.toUpperCase());
  }

  public getClassMemberships(classId: string): ClassMembership[] {
    return Array.from(this.classMemberships.values()).filter(m => m.classId === classId && m.status === ClassMembershipStatus.ENROLLED);
  }

  public getStudentClassMemberships(studentId: string): ClassMembership[] {
    return Array.from(this.classMemberships.values()).filter(m => m.studentId === studentId && m.status === ClassMembershipStatus.ENROLLED);
  }

  public isStudentEnrolledInClass(classId: string, studentId: string): boolean {
    return this.classMembershipIndex.has(`${classId}:${studentId}`);
  }

  public addClassMembership(membership: ClassMembership) {
    this.classMemberships.set(membership.id, membership);
    this.classMembershipIndex.add(`${membership.classId}:${membership.studentId}`);
  }

  public removeClassMembership(classId: string, studentId: string) {
    for (const [id, m] of this.classMemberships.entries()) {
      if (m.classId === classId && m.studentId === studentId) {
        m.status = ClassMembershipStatus.REMOVED;
        m.removedAt = new Date().toISOString();
        this.classMembershipIndex.delete(`${classId}:${studentId}`);
        break;
      }
    }
  }

  /**
   * Conflict Detection: Find if a student is already in an ACTIVE session
   */
  public getActiveSessionForStudent(studentId: string): Session | undefined {
    for (const p of this.participants.values()) {
      if (p.studentId === studentId && (p.status === StudentStatus.ACTIVE || p.status === StudentStatus.READY || p.status === StudentStatus.EMERGENCY)) {
        const sess = this.sessions.get(p.sessionId);
        if (sess && (sess.status === SessionStatus.ACTIVE || sess.status === SessionStatus.READY || sess.status === SessionStatus.PAUSED)) {
          return sess;
        }
      }
    }
    return undefined;
  }

  public indexSessionJoinCode(code: string, sessionId: string) {
    this.sessionJoinCodeIndex.set(code.toUpperCase(), sessionId);
  }

  // --- Idempotent Event Insert ---

  public recordEvent(event: SessionEvent): boolean {
    const key = `${event.deviceId}:${event.sequence}`;
    if (this.deviceSequenceIndex.has(key) || this.events.has(event.id)) {
      return false; // Idempotent duplicate
    }
    this.deviceSequenceIndex.add(key);
    this.events.set(event.id, event);
    return true;
  }

  // --- Audit Log Insert ---

  public recordAudit(log: AuditLog): void {
    this.auditLogs.set(log.id, log);
  }

  // --- Student Phone & Roster Uniqueness ---

  public findStudentByPhone(normalizedPhone: string): Student | undefined {
    const studentId = this.studentPhoneIndex.get(normalizedPhone);
    return studentId ? this.students.get(studentId) : undefined;
  }

  public isRegisterNumberTakenInClass(classId: string, registerNumber: string, excludingStudentId?: string): boolean {
    const key = `${classId}:${registerNumber.trim().toUpperCase()}`;
    const studentId = this.classRosterRegIndex.get(key);
    if (!studentId) return false;
    return excludingStudentId ? studentId !== excludingStudentId : true;
  }
}

