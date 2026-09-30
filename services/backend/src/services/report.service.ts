import { DataStore } from '../store/database.js';
import {
  SessionReportSummary,
  DashboardSummaryMetrics,
  PlatformType,
  StudentStatus,
  EventType
} from '@lockwatch/shared-models';

export class ReportService {
  private store = DataStore.getInstance();

  public generateSessionReport(sessionId: string): SessionReportSummary {
    const session = this.store.sessions.get(sessionId);
    if (!session) throw new Error('Session not found');

    const faculty = this.store.faculty.get(session.facultyId);
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

    const students = participants.map(p => {
      const stu = this.store.students.get(p.studentId);
      const dev = this.store.devices.get(p.deviceId);

      switch (p.status) {
        case StudentStatus.ACTIVE: metrics.active++; break;
        case StudentStatus.EMERGENCY: metrics.emergency++; break;
        case StudentStatus.LEFT_SUPERVISION: metrics.leftSupervision++; break;
        case StudentStatus.OFFLINE: metrics.offline++; break;
        case StudentStatus.LOCK_FAILED: metrics.lockErrors++; break;
        case StudentStatus.COMPLETED: metrics.completed++; break;
        case StudentStatus.READY: metrics.ready++; break;
      }

      const devEvents = this.store.getSessionEvents(sessionId).filter(e => e.studentId === p.studentId);

      return {
        name: stu?.name || 'Unknown',
        registerNumber: stu?.registerNumber || 'Unknown',
        platform: dev?.platform || PlatformType.ANDROID,
        deviceModel: dev?.model || 'Generic',
        osVersion: dev?.osVersion || 'Unknown OS',
        status: p.status,
        joinedAt: p.joinedAt,
        startedAt: p.startedAt,
        completedAt: p.completedAt,
        interruptions: p.interruptionCount || 0,
        emergencyCount: p.emergencyUsageCount || 0,
        offlineSeconds: p.offlineDurationSeconds || 0,
        securityEventsCount: devEvents.length
      };
    });

    const criticalEvents = this.store.getSessionAlerts(sessionId).map(a => ({
      timestamp: a.timestamp,
      studentName: a.studentName || 'System',
      registerNumber: a.registerNumber || '-',
      type: a.type as EventType,
      message: a.message
    }));

    return {
      session: {
        id: session.id,
        name: session.name,
        subject: session.subject,
        department: session.department,
        className: session.className,
        date: session.scheduledStartTime.split('T')[0],
        startTime: session.startTime,
        durationMinutes: session.durationMinutes,
        facultyName: faculty?.name || 'Faculty Invigilator'
      },
      metrics,
      students,
      criticalEvents
    };
  }

  public generateCsv(sessionId: string): string {
    const report = this.generateSessionReport(sessionId);

    const headers = [
      'Register Number',
      'Student Name',
      'Platform',
      'Device Model',
      'OS Version',
      'Final Status',
      'Joined At',
      'Interruptions',
      'Emergency Count',
      'Offline Duration (sec)',
      'Security Events'
    ];

    const rows = report.students.map(s => [
      `"${s.registerNumber}"`,
      `"${s.name}"`,
      s.platform,
      `"${s.deviceModel}"`,
      `"${s.osVersion}"`,
      s.status,
      `"${s.joinedAt}"`,
      s.interruptions,
      s.emergencyCount,
      s.offlineSeconds,
      s.securityEventsCount
    ]);

    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  }
}
