import { v4 as uuidv4 } from 'uuid';
import { DataStore } from '../store/database.js';
import { AuditLog } from '@lockwatch/shared-models';

export class AuditService {
  private store = DataStore.getInstance();

  public logAction(payload: {
    institutionId: string;
    facultyId?: string;
    userId?: string;
    action: string;
    sessionId?: string;
    studentId?: string;
    ipAddress?: string;
    userAgent?: string;
    metadata?: Record<string, unknown>;
    result: 'SUCCESS' | 'FAILURE';
  }): AuditLog {
    const log: AuditLog = {
      id: uuidv4(),
      institutionId: payload.institutionId,
      facultyId: payload.facultyId,
      userId: payload.userId,
      action: payload.action,
      sessionId: payload.sessionId,
      studentId: payload.studentId,
      timestamp: new Date().toISOString(),
      ipAddress: payload.ipAddress,
      userAgent: payload.userAgent,
      metadata: payload.metadata || {},
      result: payload.result
    };

    this.store.recordAudit(log);
    return log;
  }

  public getSessionAuditLogs(sessionId: string): AuditLog[] {
    return Array.from(this.store.auditLogs.values())
      .filter(l => l.sessionId === sessionId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }
}
