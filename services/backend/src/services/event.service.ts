import { DataStore } from '../store/database.js';
import {
  SessionEvent,
  EventType,
  StudentStatus,
  AlertSeverity
} from '@lockwatch/shared-models';
import { AlertService } from './alert.service.js';
import { WebSocketGateway } from '../websocket/gateway.js';
import { Logger } from '../logger.js';

export class EventService {
  private store = DataStore.getInstance();
  private alertService = new AlertService();
  private wsGateway = WebSocketGateway.getInstance();

  public processEvent(event: SessionEvent): { accepted: boolean; duplicate: boolean } {
    const session = this.store.sessions.get(event.sessionId);
    if (!session) {
      throw new Error('Session not found for event');
    }

    // Server-received timestamp is authoritative
    event.serverReceivedTimestamp = new Date().toISOString();
    event.institutionId = session.institutionId;

    const accepted = this.store.recordEvent(event);
    if (!accepted) {
      // Idempotent duplicate
      return { accepted: false, duplicate: true };
    }

    const participant = this.store.findParticipant(event.sessionId, event.studentId);
    if (participant) {
      participant.lastEventAt = event.serverReceivedTimestamp;
      this.updateParticipantStateFromEvent(participant, event);
    }

    // Broadcast event to active faculty
    this.wsGateway.broadcastToSession(event.sessionId, 'event.created', event);

    return { accepted: true, duplicate: false };
  }

  public processBatch(events: SessionEvent[]): { processed: number; duplicates: number } {
    let processed = 0;
    let duplicates = 0;

    for (const evt of events) {
      const res = this.processEvent(evt);
      if (res.accepted) processed++;
      if (res.duplicate) duplicates++;
    }

    return { processed, duplicates };
  }

  private updateParticipantStateFromEvent(participant: any, event: SessionEvent) {
    const student = this.store.students.get(event.studentId);
    const studentName = student ? student.name : 'Student';

    switch (event.type) {
      case EventType.LOCK_CONFIRMED:
        participant.lockVerified = true;
        participant.status = StudentStatus.ACTIVE;
        participant.lockFailureReason = null;
        this.wsGateway.broadcastToSession(event.sessionId, 'student.status_changed', {
          studentId: event.studentId,
          status: StudentStatus.ACTIVE
        });
        break;

      case EventType.LOCK_FAILED:
        participant.lockVerified = false;
        participant.status = StudentStatus.LOCK_FAILED;
        participant.lockFailureReason = (event.metadata?.error as string) || 'Native platform lockdown failed';
        this.alertService.createAlert({
          sessionId: event.sessionId,
          studentId: event.studentId,
          type: EventType.LOCK_FAILED,
          severity: AlertSeverity.CRITICAL,
          message: `${studentName}: Hardware lock initialization failed: ${participant.lockFailureReason}`
        });
        this.wsGateway.broadcastToSession(event.sessionId, 'student.lock_failed', {
          studentId: event.studentId,
          reason: participant.lockFailureReason
        });
        break;

      case EventType.APP_LEFT:
      case EventType.ASSESSMENT_INTERRUPTED:
        participant.status = StudentStatus.LEFT_SUPERVISION;
        participant.interruptionCount = (participant.interruptionCount || 0) + 1;
        this.alertService.createAlert({
          sessionId: event.sessionId,
          studentId: event.studentId,
          type: event.type,
          severity: AlertSeverity.CRITICAL,
          message: `${studentName}: Supervision interrupted. Student left secure application boundary.`
        });
        this.wsGateway.broadcastToSession(event.sessionId, 'student.app_left', {
          studentId: event.studentId,
          timestamp: event.serverReceivedTimestamp
        });
        break;

      case EventType.APP_RETURNED:
      case EventType.ASSESSMENT_RESUMED:
        participant.status = StudentStatus.ACTIVE;
        this.alertService.createAlert({
          sessionId: event.sessionId,
          studentId: event.studentId,
          type: event.type,
          severity: AlertSeverity.NORMAL,
          message: `${studentName}: Supervision restored. Returned to active assessment.`
        });
        this.wsGateway.broadcastToSession(event.sessionId, 'student.app_returned', {
          studentId: event.studentId,
          timestamp: event.serverReceivedTimestamp
        });
        break;

      case EventType.EMERGENCY_STARTED:
        participant.status = StudentStatus.EMERGENCY;
        participant.emergencyUsageCount = (participant.emergencyUsageCount || 0) + 1;
        this.alertService.createAlert({
          sessionId: event.sessionId,
          studentId: event.studentId,
          type: EventType.EMERGENCY_STARTED,
          severity: AlertSeverity.CRITICAL,
          message: `${studentName}: Controlled emergency access requested. Count: ${participant.emergencyUsageCount}.`
        });
        this.wsGateway.broadcastToSession(event.sessionId, 'student.emergency_started', {
          studentId: event.studentId,
          timestamp: event.serverReceivedTimestamp
        });
        break;

      case EventType.EMERGENCY_ENDED:
        participant.status = StudentStatus.ACTIVE;
        this.alertService.createAlert({
          sessionId: event.sessionId,
          studentId: event.studentId,
          type: EventType.EMERGENCY_ENDED,
          severity: AlertSeverity.NORMAL,
          message: `${studentName}: Emergency mode completed. Returned to supervised state.`
        });
        this.wsGateway.broadcastToSession(event.sessionId, 'student.emergency_ended', {
          studentId: event.studentId,
          timestamp: event.serverReceivedTimestamp
        });
        break;

      case EventType.SCREEN_OFF:
        participant.screenOn = false;
        break;

      case EventType.SCREEN_ON:
        participant.screenOn = true;
        break;

      case EventType.DEVICE_LOCKED:
        participant.deviceLocked = true;
        break;

      case EventType.DEVICE_UNLOCKED:
        participant.deviceLocked = false;
        break;

      case EventType.DEVICE_REBOOTED:
        this.alertService.createAlert({
          sessionId: event.sessionId,
          studentId: event.studentId,
          type: EventType.DEVICE_REBOOTED,
          severity: AlertSeverity.WARNING,
          message: `${studentName}: Device reboot detected. Attempting automatic session recovery.`
        });
        break;

      default:
        break;
    }
  }
}
