import { v4 as uuidv4 } from 'uuid';
import { DataStore } from '../store/database.js';
import { Alert, AlertSeverity, EventType } from '@lockwatch/shared-models';
import { WebSocketGateway } from '../websocket/gateway.js';

export class AlertService {
  private store = DataStore.getInstance();
  private wsGateway = WebSocketGateway.getInstance();

  public createAlert(payload: {
    sessionId: string;
    studentId?: string;
    type: EventType | string;
    severity: AlertSeverity;
    message: string;
  }): Alert {
    const session = this.store.sessions.get(payload.sessionId);
    const student = payload.studentId ? this.store.students.get(payload.studentId) : undefined;

    const alert: Alert = {
      id: uuidv4(),
      sessionId: payload.sessionId,
      studentId: payload.studentId,
      institutionId: session?.institutionId || '',
      type: payload.type,
      severity: payload.severity,
      message: payload.message,
      studentName: student?.name,
      registerNumber: student?.registerNumber,
      timestamp: new Date().toISOString(),
      acknowledged: false
    };

    this.store.alerts.set(alert.id, alert);

    // Broadcast to faculty connected to this session
    this.wsGateway.broadcastToSession(payload.sessionId, 'alert.created', alert);

    return alert;
  }

  public acknowledgeAlert(alertId: string, userId: string): Alert {
    const alert = this.store.alerts.get(alertId);
    if (!alert) {
      throw new Error('Alert not found');
    }

    alert.acknowledged = true;
    alert.acknowledgedBy = userId;
    alert.acknowledgedAt = new Date().toISOString();

    this.wsGateway.broadcastToSession(alert.sessionId, 'alert.acknowledged', {
      alertId,
      acknowledgedBy: userId,
      acknowledgedAt: alert.acknowledgedAt
    });

    return alert;
  }
}
