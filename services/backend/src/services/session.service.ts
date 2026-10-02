import { v4 as uuidv4 } from 'uuid';
import { DataStore } from '../store/database.js';
import {
  Session,
  SessionParticipant,
  SessionCommand,
  SessionStatus,
  StudentStatus,
  CommandType,
  CommandStatus,
  PlatformType,
  StudentReadinessResult,
  DashboardSummaryMetrics,
  EventType,
  DeviceEnrollmentStatus,
  NetworkQuality
} from '@lockwatch/shared-models';
import { SecurityCapabilityService } from './capability.service.js';
import { WebSocketGateway } from '../websocket/gateway.js';
import { Logger } from '../logger.js';

export class SessionService {
  private store = DataStore.getInstance();
  private wsGateway = WebSocketGateway.getInstance();
  private sessionTimers = new Map<string, ReturnType<typeof setTimeout>>();

  public createSession(data: {
    facultyId: string;
    institutionId: string;
    name: string;
    subject: string;
    department: string;
    className: string;
    scheduledStartTime: string;
    durationMinutes: number;
    emergencyDurationSeconds?: number;
    joinWindowMinutes?: number;
    rules?: string[];
  }): Session {
    const id = uuidv4();
    // Generate clean 6-character uppercase join code
    const joinCode = `LW-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const session: Session = {
      id,
      institutionId: data.institutionId,
      facultyId: data.facultyId,
      name: data.name,
      subject: data.subject,
      department: data.department,
      className: data.className,
      joinCode,
      joinTokenSecret: uuidv4(),
      status: SessionStatus.READY,
      scheduledStartTime: data.scheduledStartTime,
      durationMinutes: data.durationMinutes,
      emergencyDurationSeconds: data.emergencyDurationSeconds || 15,
      joinWindowMinutes: data.joinWindowMinutes || 30,
      rules: data.rules || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.store.sessions.set(id, session);
    this.store.indexSessionJoinCode(joinCode, id);

    Logger.info('Session created', {
      sessionId: id,
      institutionId: data.institutionId,
      operation: 'CREATE_SESSION'
    });

    return session;
  }

  public joinSession(studentId: string, joinCode: string, deviceId: string) {
    const session = this.store.findSessionByJoinCode(joinCode);
    if (!session) {
      throw new Error('Invalid session join code');
    }

    if (session.status === SessionStatus.ENDED) {
      throw new Error('This session has already ended');
    }

    const student = this.store.students.get(studentId);
    if (!student || student.institutionId !== session.institutionId) {
      throw new Error('Unauthorized: Student does not belong to the session institution');
    }

    let device = this.store.devices.get(deviceId) || this.store.findDeviceByStudentId(studentId);
    if (!device) {
      device = {
        id: deviceId,
        studentId,
        institutionId: session.institutionId,
        platform: PlatformType.ANDROID,
        manufacturer: 'Mobile Client',
        model: 'Smartphone',
        osVersion: 'Android/iOS',
        appVersion: '1.0.0',
        enrollmentStatus: DeviceEnrollmentStatus.SECURE_READY,
        isDeviceOwner: true,
        hasAacEntitlement: false,
        publicKey: `MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA${deviceId}PUBKEY`,
        lastSeenAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      this.store.devices.set(deviceId, device);
    }

    // Check duplicate participant
    let participant = this.store.findParticipant(session.id, studentId);
    if (participant) {
      // Reconnection or device update
      participant.deviceId = deviceId;
      participant.lastHeartbeatAt = new Date().toISOString();
      participant.networkQuality = NetworkQuality.ONLINE;
      participant.updatedAt = new Date().toISOString();
    } else {
      participant = {
        id: uuidv4(),
        sessionId: session.id,
        studentId,
        deviceId,
        institutionId: session.institutionId,
        status: StudentStatus.READY,
        joinedAt: new Date().toISOString(),
        lastHeartbeatAt: new Date().toISOString(),
        batteryLevel: 100,
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
      this.store.participants.set(participant.id, participant);
    }

    // Record Event
    this.recordSystemEvent(session.id, studentId, deviceId, EventType.SESSION_JOINED, {
      joinCode,
      deviceModel: device.model
    });

    // Notify faculty via realtime WebSocket
    this.wsGateway.broadcastToSession(session.id, 'student.joined', {
      participant,
      student,
      device
    });

    return {
      session,
      participant
    };
  }

  public getSessionReadiness(sessionId: string): StudentReadinessResult[] {
    const participants = this.store.getSessionParticipants(sessionId);
    const results: StudentReadinessResult[] = [];

    for (const p of participants) {
      const student = this.store.students.get(p.studentId);
      const device = this.store.devices.get(p.deviceId);

      if (!student || !device) continue;

      const evalResult = SecurityCapabilityService.determineEnrollmentStatus(device);
      const isDeviceEnrolled = evalResult.status === DeviceEnrollmentStatus.SECURE_READY;
      const isNetworkReady = p.networkQuality === NetworkQuality.ONLINE;

      const isReady = isDeviceEnrolled && isNetworkReady;

      results.push({
        studentId: student.id,
        registerNumber: student.registerNumber,
        studentName: student.name,
        platform: device.platform,
        deviceModel: device.model,
        accountValid: true,
        sessionValid: true,
        deviceEnrolled: isDeviceEnrolled,
        securityCapabilitySupported: isDeviceEnrolled,
        networkReady: isNetworkReady,
        isReady,
        problem: isReady ? null : (evalResult.reason || 'Device not ready for secure supervision')
      });
    }

    return results;
  }

  public startSession(sessionId: string, facultyId: string) {
    const session = this.store.sessions.get(sessionId);
    if (!session) throw new Error('Session not found');

    if (session.facultyId !== facultyId) {
      throw new Error('Unauthorized: Faculty does not own this session');
    }

    if (session.status === SessionStatus.ACTIVE) {
      throw new Error('Session is already active');
    }

    session.status = SessionStatus.ACTIVE;
    session.startTime = new Date().toISOString();
    session.updatedAt = new Date().toISOString();

    // Issue START_SESSION command to all connected devices
    const participants = this.store.getSessionParticipants(sessionId);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 30000).toISOString(); // 30 sec command expiry

    for (const p of participants) {
      const cmd: SessionCommand = {
        id: uuidv4(),
        sessionId,
        studentId: p.studentId,
        deviceId: p.deviceId,
        commandType: CommandType.START_SESSION,
        status: CommandStatus.PENDING,
        issuedAt: now.toISOString(),
        expiresAt
      };
      this.store.commands.set(cmd.id, cmd);
    }

    // Start Authoritative Session Expiration Timer
    const durationMs = session.durationMinutes * 60 * 1000;
    if (this.sessionTimers.has(sessionId)) {
      clearTimeout(this.sessionTimers.get(sessionId));
    }

    const timer = setTimeout(() => {
      this.handleSessionAutoExpire(sessionId);
    }, durationMs);
    this.sessionTimers.set(sessionId, timer);

    // Notify Realtime Gateway
    this.wsGateway.broadcastToSession(sessionId, 'session.started', {
      sessionId,
      startTime: session.startTime,
      durationMinutes: session.durationMinutes
    });

    Logger.info('Session started successfully', {
      sessionId,
      facultyId,
      participantCount: participants.length,
      operation: 'START_SESSION'
    });

    return session;
  }

  public pauseSession(sessionId: string, facultyId: string) {
    const session = this.store.sessions.get(sessionId);
    if (!session || session.facultyId !== facultyId) throw new Error('Unauthorized');

    session.status = SessionStatus.PAUSED;
    session.updatedAt = new Date().toISOString();

    this.wsGateway.broadcastToSession(sessionId, 'session.paused', { sessionId });
    return session;
  }

  public resumeSession(sessionId: string, facultyId: string) {
    const session = this.store.sessions.get(sessionId);
    if (!session || session.facultyId !== facultyId) throw new Error('Unauthorized');

    session.status = SessionStatus.ACTIVE;
    session.updatedAt = new Date().toISOString();

    this.wsGateway.broadcastToSession(sessionId, 'session.resumed', { sessionId });
    return session;
  }

  public endSession(sessionId: string, facultyId: string) {
    const session = this.store.sessions.get(sessionId);
    if (!session || session.facultyId !== facultyId) throw new Error('Unauthorized');

    if (this.sessionTimers.has(sessionId)) {
      clearTimeout(this.sessionTimers.get(sessionId));
      this.sessionTimers.delete(sessionId);
    }

    session.status = SessionStatus.ENDED;
    session.endTime = new Date().toISOString();
    session.updatedAt = new Date().toISOString();

    // Mark participants completed
    const participants = this.store.getSessionParticipants(sessionId);
    participants.forEach(p => {
      p.status = StudentStatus.COMPLETED;
      p.completedAt = new Date().toISOString();
      p.updatedAt = new Date().toISOString();
    });

    this.wsGateway.broadcastToSession(sessionId, 'session.ended', { sessionId });
    return session;
  }

  private handleSessionAutoExpire(sessionId: string) {
    const session = this.store.sessions.get(sessionId);
    if (session && session.status === SessionStatus.ACTIVE) {
      session.status = SessionStatus.ENDED;
      session.endTime = new Date().toISOString();
      session.updatedAt = new Date().toISOString();

      const participants = this.store.getSessionParticipants(sessionId);
      participants.forEach(p => {
        p.status = StudentStatus.COMPLETED;
        p.completedAt = new Date().toISOString();
      });

      this.wsGateway.broadcastToSession(sessionId, 'session.ended', {
        sessionId,
        reason: 'SESSION_EXPIRED'
      });
      Logger.info('Session auto-expired by authoritative timer', { sessionId });
    }
  }

  public getLiveDashboardMetrics(sessionId: string): DashboardSummaryMetrics {
    const participants = this.store.getSessionParticipants(sessionId);
    const metrics: DashboardSummaryMetrics = {
      totalStudents: participants.length,
      connected: 0,
      active: 0,
      emergency: 0,
      leftSupervision: 0,
      offline: 0,
      completed: 0,
      lockErrors: 0,
      ready: 0
    };

    for (const p of participants) {
      if (p.networkQuality === NetworkQuality.ONLINE) metrics.connected++;

      switch (p.status) {
        case StudentStatus.ACTIVE:
          metrics.active++;
          break;
        case StudentStatus.EMERGENCY:
          metrics.emergency++;
          break;
        case StudentStatus.LEFT_SUPERVISION:
          metrics.leftSupervision++;
          break;
        case StudentStatus.OFFLINE:
          metrics.offline++;
          break;
        case StudentStatus.LOCK_FAILED:
          metrics.lockErrors++;
          break;
        case StudentStatus.COMPLETED:
          metrics.completed++;
          break;
        case StudentStatus.READY:
          metrics.ready++;
          break;
      }
    }

    return metrics;
  }

  public getSessionLiveDetails(sessionId: string) {
    const session = this.store.sessions.get(sessionId);
    if (!session) throw new Error('Session not found');

    const participants = this.store.getSessionParticipants(sessionId).map(p => {
      const student = this.store.students.get(p.studentId);
      const device = this.store.devices.get(p.deviceId);
      return {
        ...p,
        studentName: student?.name || 'Unknown',
        registerNumber: student?.registerNumber || 'Unknown',
        platform: device?.platform || PlatformType.ANDROID,
        deviceModel: device?.model || 'Generic Device',
        osVersion: device?.osVersion || 'Unknown OS',
        isDeviceOwner: device?.isDeviceOwner || false,
        hasAacEntitlement: device?.hasAacEntitlement || false,
        enrollmentStatus: device?.enrollmentStatus || DeviceEnrollmentStatus.NOT_READY
      };
    });

    return {
      session,
      metrics: this.getLiveDashboardMetrics(sessionId),
      participants,
      alerts: this.store.getSessionAlerts(sessionId).slice(0, 50)
    };
  }

  private recordSystemEvent(sessionId: string, studentId: string, deviceId: string, type: EventType, metadata: Record<string, unknown>) {
    const event = {
      id: uuidv4(),
      sessionId,
      studentId,
      deviceId,
      institutionId: this.store.sessions.get(sessionId)?.institutionId || '',
      type,
      sequence: Date.now(),
      clientTimestamp: new Date().toISOString(),
      serverReceivedTimestamp: new Date().toISOString(),
      metadata
    };
    this.store.recordEvent(event);
  }
}
