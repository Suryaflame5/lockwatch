import { DataStore } from '../store/database.js';
import {
  HeartbeatPayload,
  NetworkQuality,
  StudentStatus,
  AlertSeverity,
  EventType
} from '@lockwatch/shared-models';
import { AlertService } from './alert.service.js';
import { WebSocketGateway } from '../websocket/gateway.js';
import { config } from '../config.js';

export class HeartbeatService {
  private store = DataStore.getInstance();
  private alertService = new AlertService();
  private wsGateway = WebSocketGateway.getInstance();
  private monitorInterval?: NodeJS.Timeout;

  public startHeartbeatMonitor() {
    if (this.monitorInterval) return;

    this.monitorInterval = setInterval(() => {
      this.evaluateAllParticipantHealth();
    }, 5000);
    this.monitorInterval.unref();
  }

  public stopHeartbeatMonitor() {
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
      this.monitorInterval = undefined;
    }
  }

  public recordHeartbeat(payload: HeartbeatPayload) {
    const participant = this.store.findParticipant(payload.sessionId, payload.studentId);
    if (!participant) {
      throw new Error('Participant not found for heartbeat');
    }

    const previousQuality = participant.networkQuality;
    const now = new Date();

    participant.lastHeartbeatAt = now.toISOString();
    participant.batteryLevel = payload.batteryLevel;
    participant.isCharging = payload.isCharging;
    participant.screenOn = payload.screenOn;
    participant.deviceLocked = payload.deviceLocked;
    participant.networkQuality = NetworkQuality.ONLINE;

    // If was offline, mark reconnected
    if (previousQuality === NetworkQuality.OFFLINE) {
      const student = this.store.students.get(payload.studentId);
      this.alertService.createAlert({
        sessionId: payload.sessionId,
        studentId: payload.studentId,
        type: EventType.ONLINE,
        severity: AlertSeverity.INFO,
        message: `${student?.name || 'Student'}: Network re-established. Online.`
      });
      this.wsGateway.broadcastToSession(payload.sessionId, 'student.online', {
        studentId: payload.studentId
      });
    }

    // Verify native security state matches expectations
    if (participant.status === StudentStatus.ACTIVE && !payload.securityState.isLockActive) {
      // Security state dropped!
      participant.status = StudentStatus.LEFT_SUPERVISION;
      this.alertService.createAlert({
        sessionId: payload.sessionId,
        studentId: payload.studentId,
        type: EventType.ASSESSMENT_INTERRUPTED,
        severity: AlertSeverity.CRITICAL,
        message: `${payload.studentId}: Telemetry mismatch - Hardware lock mode dropped unexpectedly.`
      });
    }

    // Broadcast telemetry update to faculty
    this.wsGateway.broadcastToSession(payload.sessionId, 'student.telemetry', {
      studentId: payload.studentId,
      batteryLevel: payload.batteryLevel,
      isCharging: payload.isCharging,
      networkQuality: participant.networkQuality,
      screenOn: payload.screenOn,
      deviceLocked: payload.deviceLocked,
      lastHeartbeatAt: participant.lastHeartbeatAt
    });

    return { success: true };
  }

  private evaluateAllParticipantHealth() {
    const now = Date.now();

    for (const participant of this.store.participants.values()) {
      const session = this.store.sessions.get(participant.sessionId);
      if (!session || session.status === 'ENDED') continue;

      const lastHeartbeatMs = new Date(participant.lastHeartbeatAt).getTime();
      const elapsedSeconds = Math.floor((now - lastHeartbeatMs) / 1000);

      const oldQuality = participant.networkQuality;

      if (elapsedSeconds > config.offlineThresholdSeconds) {
        participant.networkQuality = NetworkQuality.OFFLINE;
        participant.offlineDurationSeconds = (participant.offlineDurationSeconds || 0) + 5;

        if (oldQuality !== NetworkQuality.OFFLINE) {
          const student = this.store.students.get(participant.studentId);
          this.alertService.createAlert({
            sessionId: participant.sessionId,
            studentId: participant.studentId,
            type: EventType.OFFLINE,
            severity: AlertSeverity.WARNING,
            message: `${student?.name || 'Student'}: Device is offline (>30s without heartbeat).`
          });
          this.wsGateway.broadcastToSession(participant.sessionId, 'student.offline', {
            studentId: participant.studentId,
            elapsedSeconds
          });
        }
      } else if (elapsedSeconds > config.staleThresholdSeconds) {
        participant.networkQuality = NetworkQuality.STALE;
      } else {
        participant.networkQuality = NetworkQuality.ONLINE;
      }
    }
  }
}
