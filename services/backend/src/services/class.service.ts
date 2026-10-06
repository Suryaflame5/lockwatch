import { v4 as uuidv4 } from 'uuid';
import { DataStore } from '../store/database.js';
import {
  Class,
  ClassMembership,
  ClassJoinToken,
  ClassRosterStudent,
  ClassHistoryItem,
  ClassReportSummary,
  ClassStatus,
  ClassMembershipStatus,
  ClassJoinMethod,
  ClassSessionParticipationMetrics,
  Session,
  SessionParticipant,
  SessionStatus,
  StudentStatus,
  NetworkQuality,
  DeviceEnrollmentStatus
} from '@lockwatch/shared-models';
import { WebSocketGateway } from '../websocket/gateway.js';
import { Logger } from '../logger.js';
import { PostgresSync } from '../store/postgres-sync.js';

export class ClassService {
  private store = DataStore.getInstance();
  private wsGateway = WebSocketGateway.getInstance();

  public createClass(facultyId: string, institutionId: string, data: {
    name: string;
    subject: string;
    department: string;
    year: string;
    semester: string;
    section: string;
    description?: string;
    classCode?: string;
    startTime?: string;
    endTime?: string;
  }): Class {
    let code = data.classCode?.toUpperCase();
    if (!code) {
      const deptCode = data.department.split(' ').map(w => w[0]).join('').substring(0, 4).toUpperCase() || 'CLS';
      const randSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
      code = `${deptCode}-${data.section.toUpperCase()}-${randSuffix}`;
    }

    if (this.store.findClassByCode(code)) {
      throw new Error(`Class with code ${code} already exists`);
    }

    const id = uuidv4();
    const newClass: Class = {
      id,
      institutionId,
      createdBy: facultyId,
      name: data.name,
      subject: data.subject,
      department: data.department,
      year: data.year,
      semester: data.semester,
      section: data.section,
      description: data.description || null,
      classCode: code,
      status: ClassStatus.ACTIVE,
      startTime: data.startTime || null,
      endTime: data.endTime || null,
      activeSessionId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.store.classes.set(id, newClass);
    this.store.indexClassCode(code, id);
    PostgresSync.getInstance().saveClass(newClass).catch(() => {});

    Logger.info(`Class created: ${newClass.name} (${newClass.classCode}) by faculty ${facultyId}`);
    return newClass;
  }

  public getFacultyClasses(facultyId: string): Class[] {
    return Array.from(this.store.classes.values())
      .filter(c => c.createdBy === facultyId && c.status !== ClassStatus.ARCHIVED)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public getClassById(classId: string): Class {
    const cls = this.store.findClassById(classId);
    if (!cls) {
      throw new Error(`Class not found with id ${classId}`);
    }
    return cls;
  }

  public updateClass(classId: string, facultyId: string, data: Partial<Class>): Class {
    const cls = this.getClassById(classId);
    if (cls.createdBy !== facultyId) {
      throw new Error('Unauthorized to update this class');
    }

    Object.assign(cls, {
      ...data,
      updatedAt: new Date().toISOString()
    });

    return cls;
  }

  public archiveClass(classId: string, facultyId: string): void {
    const cls = this.getClassById(classId);
    if (cls.createdBy !== facultyId) {
      throw new Error('Unauthorized to archive this class');
    }

    cls.status = ClassStatus.ARCHIVED;
    cls.archivedAt = new Date().toISOString();
    cls.updatedAt = new Date().toISOString();
    this.store.removeClassCodeIndex(cls.classCode);
    Logger.info(`Class archived: ${cls.name} (${cls.classCode})`);
  }

  public generateClassQr(classId: string, facultyId: string): { token: string; qrPayload: string; expiresAt: string } {
    const cls = this.getClassById(classId);
    if (cls.createdBy !== facultyId) {
      throw new Error('Unauthorized to generate QR for this class');
    }

    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(); // 2 hours validity

    const joinToken: ClassJoinToken = {
      id: uuidv4(),
      classId,
      tokenHash: token,
      expiresAt,
      createdAt: new Date().toISOString()
    };
    this.store.classJoinTokens.set(token, joinToken);

    const qrPayload = JSON.stringify({
      lockwatch: true,
      classId: cls.id,
      code: cls.classCode,
      token,
      expiresAt
    });

    return { token, qrPayload, expiresAt };
  }

  public getClassRoster(classId: string): ClassRosterStudent[] {
    const cls = this.getClassById(classId);
    const memberships = this.store.getClassMemberships(classId).filter(m => m.status === ClassMembershipStatus.ENROLLED);
    const roster: ClassRosterStudent[] = [];
    const activeSessionId = cls.activeSessionId;

    for (const mem of memberships) {
      const student = this.store.students.get(mem.studentId);
      if (!student) continue;

      const user = this.store.users.get(student.userId);
      const device = this.store.findDeviceByStudentId(student.id);
      const participant = activeSessionId ? this.store.findParticipant(activeSessionId, student.id) : undefined;

      roster.push({
        studentId: student.id,
        userId: student.userId,
        registerNumber: mem.registerNumber || student.registerNumber,
        displayName: mem.displayName || student.name,
        name: mem.displayName || student.name,
        phoneNumber: student.phoneNumber,
        department: student.department,
        className: student.className,
        membershipStatus: mem.status,
        joinMethod: mem.joinMethod || ClassJoinMethod.FACULTY_ADDED,
        deviceModel: device?.model,
        platform: device?.platform,
        enrollmentStatus: device?.enrollmentStatus || DeviceEnrollmentStatus.NOT_READY,
        sessionStatus: participant?.status,
        isSessionJoined: !!participant,
        lastActive: device?.lastSeenAt,
        joinedAt: mem.joinedAt,
        sessionJoinedAt: participant?.sessionJoinedAt || participant?.joinedAt
      });
    }

    return roster.sort((a, b) => a.registerNumber.localeCompare(b.registerNumber));
  }

  public getClassSessionParticipationMetrics(classId: string): ClassSessionParticipationMetrics {
    const cls = this.getClassById(classId);
    const totalEnrolled = this.store.getClassMemberships(classId).filter(m => m.status === ClassMembershipStatus.ENROLLED).length;

    if (!cls.activeSessionId) {
      return {
        totalEnrolled,
        joined: 0,
        ready: 0,
        active: 0,
        emergency: 0,
        interrupted: 0,
        offline: 0,
        notJoined: totalEnrolled
      };
    }

    const participants = this.store.getSessionParticipants(cls.activeSessionId);
    let ready = 0;
    let active = 0;
    let emergency = 0;
    let interrupted = 0;
    let offline = 0;

    for (const p of participants) {
      switch (p.status) {
        case StudentStatus.READY:
          ready++;
          break;
        case StudentStatus.ACTIVE:
          active++;
          break;
        case StudentStatus.EMERGENCY:
          emergency++;
          break;
        case StudentStatus.LEFT_SUPERVISION:
          interrupted++;
          break;
        case StudentStatus.OFFLINE:
          offline++;
          break;
        default:
          break;
      }
    }

    const joined = participants.length;
    const notJoined = Math.max(0, totalEnrolled - joined);

    return {
      totalEnrolled,
      joined,
      ready,
      active,
      emergency,
      interrupted,
      offline,
      notJoined
    };
  }

  public addStudentToClass(classId: string, registerNumber: string): ClassRosterStudent {
    const cls = this.getClassById(classId);
    const student = this.store.findStudentByRegAndInstitution(cls.institutionId, registerNumber);
    if (!student) {
      throw new Error(`Student with register number "${registerNumber}" not found in institution`);
    }

    if (this.store.isStudentEnrolledInClass(classId, student.id)) {
      throw new Error(`Student ${registerNumber} is already enrolled in this class`);
    }

    const user = this.store.users.get(student.userId);
    const membership: ClassMembership = {
      id: uuidv4(),
      classId,
      studentId: student.id,
      displayName: user?.name || student.name || 'Student',
      registerNumber: student.registerNumber,
      joinMethod: ClassJoinMethod.FACULTY_ADDED,
      status: ClassMembershipStatus.ENROLLED,
      joinedAt: new Date().toISOString()
    };
    this.store.addClassMembership(membership);
    this.store.classRosterRegIndex.set(`${classId}:${student.registerNumber.toUpperCase()}`, student.id);

    // If an active session is currently running for this class, auto-add student
    if (cls.activeSessionId) {
      this.attachStudentToActiveSession(cls.activeSessionId, student.id, cls.institutionId);
    }

    const device = this.store.findDeviceByStudentId(student.id);

    return {
      studentId: student.id,
      userId: student.userId,
      registerNumber: student.registerNumber,
      name: student.name,
      department: student.department,
      className: student.className,
      membershipStatus: membership.status,
      deviceModel: device?.model,
      platform: device?.platform,
      enrollmentStatus: device?.enrollmentStatus || DeviceEnrollmentStatus.NOT_READY,
      lastActive: device?.lastSeenAt,
      joinedAt: membership.joinedAt
    };
  }

  public bulkAddStudents(classId: string, registerNumbers: string[]): { added: number; failed: string[] } {
    let added = 0;
    const failed: string[] = [];

    for (const reg of registerNumbers) {
      try {
        this.addStudentToClass(classId, reg.trim());
        added++;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        failed.push(`${reg}: ${message}`);
      }
    }

    return { added, failed };
  }

  public removeStudentFromClass(classId: string, studentId: string): void {
    this.store.removeClassMembership(classId, studentId);
  }

  public getClassHistory(classId: string): ClassHistoryItem[] {
    const sessions = Array.from(this.store.sessions.values())
      .filter(s => s.classId === classId)
      .sort((a, b) => new Date(b.scheduledStartTime).getTime() - new Date(a.scheduledStartTime).getTime());

    return sessions.map(s => {
      const participants = this.store.getSessionParticipants(s.id);
      let interruptions = 0;
      let emergencies = 0;
      participants.forEach(p => {
        interruptions += p.interruptionCount;
        emergencies += p.emergencyUsageCount;
      });

      return {
        sessionId: s.id,
        sessionName: s.name,
        date: s.scheduledStartTime.split('T')[0] || s.createdAt.split('T')[0],
        startsAt: s.scheduledStartTime,
        endsAt: s.endsAt || new Date(new Date(s.scheduledStartTime).getTime() + s.durationMinutes * 60000).toISOString(),
        studentCount: participants.length,
        interruptionCount: interruptions,
        emergencyCount: emergencies,
        status: s.status
      };
    });
  }

  public getClassReport(classId: string): ClassReportSummary {
    const cls = this.getClassById(classId);
    const faculty = this.store.faculty.get(cls.createdBy);
    const memberships = this.store.getClassMemberships(classId);
    const sessions = Array.from(this.store.sessions.values()).filter(s => s.classId === classId);

    let totalAttendance = 0;
    let interruptions = 0;
    let emergencyEvents = 0;
    let offlineEvents = 0;
    let securityFailures = 0;
    let completedSessions = 0;

    for (const s of sessions) {
      if (s.status === SessionStatus.ENDED) {
        completedSessions++;
      }
      const participants = this.store.getSessionParticipants(s.id);
      totalAttendance += participants.length;
      participants.forEach(p => {
        interruptions += p.interruptionCount;
        emergencyEvents += p.emergencyUsageCount;
        if (p.networkQuality === NetworkQuality.OFFLINE) offlineEvents++;
        if (p.status === StudentStatus.LOCK_FAILED) securityFailures++;
      });
    }

    const sessionsConducted = sessions.length;
    const averageAttendance = sessionsConducted > 0 ? Math.round(totalAttendance / sessionsConducted) : 0;

    return {
      classId: cls.id,
      className: cls.name,
      classCode: cls.classCode,
      department: cls.department,
      section: cls.section,
      facultyName: faculty?.name || 'Faculty',
      totalStudents: memberships.length,
      sessionsConducted,
      averageAttendance,
      interruptions,
      emergencyEvents,
      offlineEvents,
      securityFailures,
      completedSessions
    };
  }

  public createClassSession(classId: string, facultyId: string, institutionId: string, data: {
    name: string;
    scheduledStartTime?: string;
    durationMinutes?: number;
    emergencyDurationSeconds?: number;
    rules?: string[];
  }): Session {
    const cls = this.getClassById(classId);
    if (cls.createdBy !== facultyId) {
      throw new Error('Unauthorized to schedule a session for this class');
    }

    // Check if class already has an active session
    if (cls.activeSessionId) {
      const activeSess = this.store.sessions.get(cls.activeSessionId);
      if (activeSess && (activeSess.status === SessionStatus.ACTIVE || activeSess.status === SessionStatus.READY || activeSess.status === SessionStatus.PAUSED)) {
        throw new Error(`Class already has an active session in progress ("${activeSess.name}")`);
      }
    }

    const durationMinutes = data.durationMinutes || 60;
    const startTime = data.scheduledStartTime || new Date().toISOString();
    const endsAt = new Date(new Date(startTime).getTime() + durationMinutes * 60000).toISOString();

    const sessionId = uuidv4();
    const joinCode = `LW-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const session: Session = {
      id: sessionId,
      institutionId,
      facultyId,
      classId,
      name: data.name,
      subject: cls.subject,
      department: cls.department,
      className: `${cls.name} (${cls.section})`,
      joinCode,
      joinTokenSecret: uuidv4(),
      status: SessionStatus.READY,
      scheduledStartTime: startTime,
      durationMinutes,
      endsAt,
      emergencyDurationSeconds: data.emergencyDurationSeconds || 15,
      joinWindowMinutes: 30,
      rules: data.rules && data.rules.length > 0 ? data.rules : [
        'Strict native OS lockdown active',
        'Controlled emergency access only',
        'Automatic lockdown release upon session expiration'
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.store.sessions.set(sessionId, session);
    this.store.indexSessionJoinCode(joinCode, sessionId);
    cls.activeSessionId = sessionId;
    cls.updatedAt = new Date().toISOString();

    // Auto-populate session participants from enrolled roster students
    const memberships = this.store.getClassMemberships(classId);
    let enrolledParticipantsCount = 0;

    for (const mem of memberships) {
      // Conflict check: if student is in another active session, skip or alert
      const activeStudentSession = this.store.getActiveSessionForStudent(mem.studentId);
      if (activeStudentSession && activeStudentSession.id !== sessionId) {
        Logger.warn(`Student ${mem.studentId} is already in another active session (${activeStudentSession.id})`);
        continue;
      }

      const device = this.store.findDeviceByStudentId(mem.studentId);
      if (!device) continue;

      const participantId = uuidv4();
      const participant: SessionParticipant = {
        id: participantId,
        sessionId,
        studentId: mem.studentId,
        deviceId: device.id,
        institutionId,
        status: StudentStatus.READY,
        joinedAt: new Date().toISOString(),
        lastHeartbeatAt: new Date().toISOString(),
        batteryLevel: 95,
        isCharging: false,
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

      this.store.participants.set(participantId, participant);
      enrolledParticipantsCount++;
    }

    Logger.info(`Class session created: ${session.name} with ${enrolledParticipantsCount} roster students pre-enrolled`);
    this.wsGateway.broadcastToFaculty(facultyId, {
      type: 'session.created',
      payload: { session, participantsCount: enrolledParticipantsCount }
    });

    return session;
  }

  public joinClassByCode(
    studentId: string,
    classCode: string,
    academicIdentity?: { displayName?: string; registerNumber?: string }
  ): { class: Class; membership: ClassMembership; message: string } {
    const cleanCode = classCode.trim().toUpperCase();
    const cls = this.store.findClassByCode(cleanCode) || this.store.findClassByCode(classCode.trim());
    if (!cls) {
      throw new Error(`That class code is invalid or has expired.`);
    }

    if (cls.status === ClassStatus.ARCHIVED) {
      throw new Error('This class has been archived');
    }

    const student = this.store.students.get(studentId);
    if (!student) {
      throw new Error('Student profile not found');
    }

    const regToUse = (academicIdentity?.registerNumber?.trim() || student.registerNumber).toUpperCase();
    const nameToUse = (academicIdentity?.displayName?.trim() || student.name);

    // Section 19, 33: Check duplicate register number within this class
    if (this.store.isRegisterNumberTakenInClass(cls.id, regToUse, studentId)) {
      throw new Error('That register number is already assigned in this class.');
    }

    let membership: ClassMembership | undefined;
    for (const m of this.store.classMemberships.values()) {
      if (m.classId === cls.id && m.studentId === studentId) {
        membership = m;
        if (m.status !== ClassMembershipStatus.ENROLLED) {
          m.status = ClassMembershipStatus.ENROLLED;
          m.joinedAt = new Date().toISOString();
        }
        if (academicIdentity?.displayName) m.displayName = nameToUse;
        if (academicIdentity?.registerNumber) m.registerNumber = regToUse;
        this.store.classRosterRegIndex.set(`${cls.id}:${regToUse}`, studentId);
        return {
          class: cls,
          membership,
          message: 'You are already enrolled in this class.'
        };
      }
    }

    membership = {
      id: uuidv4(),
      classId: cls.id,
      studentId,
      displayName: nameToUse,
      registerNumber: regToUse,
      joinMethod: ClassJoinMethod.CODE,
      status: ClassMembershipStatus.ENROLLED,
      joinedAt: new Date().toISOString()
    };
    this.store.addClassMembership(membership);
    this.store.classRosterRegIndex.set(`${cls.id}:${regToUse}`, studentId);

    // Section 73: Emit realtime websocket event
    this.wsGateway.broadcastToClass(cls.id, 'class.student_joined', {
      classId: cls.id,
      studentId,
      displayName: nameToUse,
      registerNumber: regToUse,
      joinedAt: membership.joinedAt
    });
    this.wsGateway.broadcastToFaculty(cls.createdBy, {
      type: 'class.student_joined',
      payload: {
        classId: cls.id,
        studentId,
        displayName: nameToUse,
        registerNumber: regToUse,
        joinedAt: membership.joinedAt
      }
    });

    // If an active session is currently running for this class, auto-attach student
    if (cls.activeSessionId) {
      this.attachStudentToActiveSession(cls.activeSessionId, studentId, cls.institutionId);
    }

    return {
      class: cls,
      membership,
      message: "You've joined the class."
    };
  }

  public joinClassByQr(
    studentId: string,
    qrToken: string,
    academicIdentity?: { displayName?: string; registerNumber?: string }
  ): { class: Class; membership: ClassMembership; message: string } {
    const tokenRecord = this.store.classJoinTokens.get(qrToken);
    if (!tokenRecord) {
      throw new Error('Invalid or expired QR token');
    }

    if (new Date(tokenRecord.expiresAt).getTime() < Date.now()) {
      throw new Error('QR token has expired. Request faculty for a fresh QR code.');
    }

    if (tokenRecord.revokedAt) {
      throw new Error('QR token has been revoked');
    }

    const cls = this.getClassById(tokenRecord.classId);
    const result = this.joinClassByCode(studentId, cls.classCode, academicIdentity);
    if (result.membership) {
      result.membership.joinMethod = ClassJoinMethod.QR;
    }
    return result;
  }

  public getStudentClasses(studentId: string): Array<{ class: Class; membership: ClassMembership; activeSession: Session | null }> {
    const memberships = this.store.getStudentClassMemberships(studentId);
    const results: Array<{ class: Class; membership: ClassMembership; activeSession: Session | null }> = [];

    for (const mem of memberships) {
      const cls = this.store.findClassById(mem.classId);
      if (!cls || cls.status === ClassStatus.ARCHIVED) continue;

      let activeSession: Session | null = null;
      if (cls.activeSessionId) {
        const sess = this.store.sessions.get(cls.activeSessionId);
        if (sess && (sess.status === SessionStatus.ACTIVE || sess.status === SessionStatus.READY || sess.status === SessionStatus.PAUSED)) {
          activeSession = sess;
        }
      }

      results.push({ class: cls, membership: mem, activeSession });
    }

    return results;
  }

  private attachStudentToActiveSession(sessionId: string, studentId: string, institutionId: string) {
    const sess = this.store.sessions.get(sessionId);
    if (!sess || (sess.status !== SessionStatus.ACTIVE && sess.status !== SessionStatus.READY && sess.status !== SessionStatus.PAUSED)) {
      return;
    }

    // Check if already in this session
    const existing = this.store.findParticipant(sessionId, studentId);
    if (existing) return;

    // Check conflict with other active sessions
    const activeStudentSession = this.store.getActiveSessionForStudent(studentId);
    if (activeStudentSession && activeStudentSession.id !== sessionId) {
      return;
    }

    const device = this.store.findDeviceByStudentId(studentId);
    if (!device) return;

    const participantId = uuidv4();
    const participant: SessionParticipant = {
      id: participantId,
      sessionId,
      studentId,
      deviceId: device.id,
      institutionId,
      status: sess.status === SessionStatus.ACTIVE ? StudentStatus.ACTIVE : StudentStatus.READY,
      joinedAt: new Date().toISOString(),
      lastHeartbeatAt: new Date().toISOString(),
      batteryLevel: 90,
      isCharging: false,
      networkQuality: NetworkQuality.ONLINE,
      screenOn: true,
      deviceLocked: sess.status === SessionStatus.ACTIVE,
      emergencyUsageCount: 0,
      interruptionCount: 0,
      offlineDurationSeconds: 0,
      lockVerified: sess.status === SessionStatus.ACTIVE,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.store.participants.set(participantId, participant);
  }
}
