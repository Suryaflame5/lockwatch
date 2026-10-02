import { DataStore } from '../store/database.js';
import {
  SessionStatus,
  StudentStatus,
  CommandType,
  CommandStatus,
  SessionCommand,
  ClassStatus
} from '@lockwatch/shared-models';
import { WebSocketGateway } from '../websocket/gateway.js';
import { Logger } from '../logger.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * ExpirationWorker
 * Authoritative server background worker that scans and expires sessions
 * whose scheduled duration/endsAt has elapsed. Releases student lockouts
 * while strictly maintaining their persistent class enrollment.
 */
export class ExpirationWorker {
  private static instance: ExpirationWorker;
  private store = DataStore.getInstance();
  private wsGateway = WebSocketGateway.getInstance();
  private timer: ReturnType<typeof setInterval> | null = null;
  private isRunning = false;

  private constructor() {}

  public static getInstance(): ExpirationWorker {
    if (!ExpirationWorker.instance) {
      ExpirationWorker.instance = new ExpirationWorker();
    }
    return ExpirationWorker.instance;
  }

  public start(intervalMs: number = 3000): void {
    if (this.isRunning) return;
    this.isRunning = true;
    Logger.info(`ExpirationWorker started with interval ${intervalMs}ms`);

    this.timer = setInterval(() => {
      this.checkAndExpireSessions();
    }, intervalMs);
  }

  public stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.isRunning = false;
    Logger.info('ExpirationWorker stopped');
  }

  public checkAndExpireSessions(): number {
    let expiredCount = 0;
    const now = Date.now();

    for (const session of this.store.sessions.values()) {
      if (session.status !== SessionStatus.ACTIVE && session.status !== SessionStatus.PAUSED && session.status !== SessionStatus.READY) {
        continue;
      }

      // Check if session has an explicit endsAt that has passed
      let isExpired = false;
      if (session.endsAt && new Date(session.endsAt).getTime() <= now) {
        isExpired = true;
      } else if (session.startTime && session.durationMinutes) {
        const expectedEnd = new Date(session.startTime).getTime() + session.durationMinutes * 60000;
        if (expectedEnd <= now) {
          isExpired = true;
        }
      }

      if (isExpired) {
        this.expireSession(session.id);
        expiredCount++;
      }
    }

    return expiredCount;
  }

  public expireSession(sessionId: string): void {
    const session = this.store.sessions.get(sessionId);
    if (!session) return;

    if (session.status === SessionStatus.ENDED) {
      return; // Already finalized
    }

    const previousStatus = session.status;
    session.status = SessionStatus.ENDED;
    session.endTime = new Date().toISOString();
    session.updatedAt = new Date().toISOString();

    // Release participants and issue END_SESSION command to trigger native unlock
    const participants = this.store.getSessionParticipants(sessionId);
    const expiresAt = new Date(Date.now() + 30000).toISOString();

    for (const p of participants) {
      p.status = StudentStatus.COMPLETED;
      p.deviceLocked = false;
      p.completedAt = new Date().toISOString();
      p.updatedAt = new Date().toISOString();

      // Issue native release command
      const cmd: SessionCommand = {
        id: uuidv4(),
        sessionId,
        studentId: p.studentId,
        deviceId: p.deviceId,
        commandType: CommandType.END_SESSION,
        status: CommandStatus.PENDING,
        issuedAt: new Date().toISOString(),
        expiresAt
      };
      this.store.commands.set(cmd.id, cmd);
    }

    // If associated with a class, clear active session
    if (session.classId) {
      const cls = this.store.classes.get(session.classId);
      if (cls && cls.activeSessionId === sessionId) {
        cls.activeSessionId = null;
        cls.updatedAt = new Date().toISOString();
      }
    }

    Logger.info(`Authoritative Expiration: Session "${session.name}" (${sessionId}) expired automatically. Released ${participants.length} devices.`);

    // Realtime notification to all participants and faculty
    this.wsGateway.broadcastToSession(sessionId, 'session.ended', {
      sessionId,
      reason: 'SESSION_EXPIRED',
      classId: session.classId,
      autoExpired: true
    });
  }
}
