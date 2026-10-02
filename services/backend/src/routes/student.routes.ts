import { Router, type Response } from 'express';
import { requireAuth, requireRoles, AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { UserRole, StudentStatus, CommandStatus, EventType, AlertSeverity } from '@lockwatch/shared-models';
import { SessionService } from '../services/session.service.js';
import { AlertService } from '../services/alert.service.js';
import { DataStore } from '../store/database.js';
import { CommandAckSchema, EmergencyActionSchema } from '@lockwatch/validation';
import { EventService } from '../services/event.service.js';

import { ClassService } from '../services/class.service.js';

export const studentRouter = Router();
const sessionService = new SessionService();
const classService = new ClassService();
const eventService = new EventService();
const alertService = new AlertService();
const store = DataStore.getInstance();

const studentAuth = [requireAuth, requireRoles(UserRole.STUDENT)];

studentRouter.get('/students/me', ...studentAuth, (req: AuthenticatedRequest, res: Response) => {
  const student = store.findStudentByUserId(req.user!.userId);
  if (!student) {
    return res.status(404).json({ message: 'Student profile not found' });
  }
  const device = store.findDeviceByStudentId(student.id);
  const institution = store.institutions.get(req.user!.institutionId);
  const enrolledClasses = classService.getStudentClasses(student.id);
  const activeSession = store.getActiveSessionForStudent(student.id);

  res.json({
    user: req.user,
    student,
    classes: enrolledClasses,
    activeSession: activeSession || null,
    device: device || null,
    institution: institution || null
  });
});

studentRouter.post('/sessions/:id/join', ...studentAuth, (req: AuthenticatedRequest<{ id: string }>, res: Response) => {
  try {
    const student = store.findStudentByUserId(req.user!.userId);
    if (!student) return res.status(403).json({ message: 'Student profile not found' });

    const deviceId = req.body.deviceId;
    const joinCode = req.body.joinCode || req.params.id;

    const result = sessionService.joinSession(student.id, joinCode, deviceId);
    res.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(400).json({ message });
  }
});

studentRouter.get('/sessions/:id/status', ...studentAuth, (req: AuthenticatedRequest<{ id: string }>, res: Response) => {
  const student = store.findStudentByUserId(req.user!.userId);
  if (!student) return res.status(403).json({ message: 'Student not found' });

  const session = store.sessions.get(req.params.id);
  if (!session) return res.status(404).json({ message: 'Session not found' });

  const participant = store.findParticipant(session.id, student.id);
  res.json({
    session: {
      id: session.id,
      name: session.name,
      subject: session.subject,
      status: session.status,
      startTime: session.startTime,
      durationMinutes: session.durationMinutes,
      emergencyDurationSeconds: session.emergencyDurationSeconds,
      rules: session.rules
    },
    participant
  });
});

studentRouter.post('/commands/acknowledge', ...studentAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const validated = CommandAckSchema.parse(req.body);
    const cmd = store.commands.get(validated.commandId);
    if (cmd) {
      cmd.status = validated.status;
      cmd.executedAt = validated.executedAt;
      cmd.error = validated.error;
    }

    // If START_SESSION was acknowledged as SUCCESS, verify lock state
    if (cmd?.commandType === 'START_SESSION' && validated.status === CommandStatus.SUCCESS) {
      const participant = store.findParticipant(validated.sessionId, validated.studentId);
      if (participant) {
        participant.lockVerified = true;
        participant.status = StudentStatus.ACTIVE;
      }
    }

    res.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(400).json({ message });
  }
});

studentRouter.post('/emergency/request', ...studentAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const validated = EmergencyActionSchema.parse(req.body);
    const session = store.sessions.get(validated.sessionId);
    if (!session) return res.status(404).json({ message: 'Session not found' });

    eventService.processEvent({
      id: req.body.eventId || `${Date.now()}-emergency-start`,
      sessionId: validated.sessionId,
      studentId: validated.studentId,
      deviceId: validated.deviceId,
      institutionId: session.institutionId,
      type: EventType.EMERGENCY_STARTED,
      sequence: Date.now(),
      clientTimestamp: validated.clientTimestamp,
      serverReceivedTimestamp: new Date().toISOString(),
      metadata: { reason: validated.reason || 'Student triggered emergency access' }
    });

    res.json({
      success: true,
      emergencyDurationSeconds: session.emergencyDurationSeconds || 15
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(400).json({ message });
  }
});

studentRouter.post('/emergency/exit', ...studentAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const validated = EmergencyActionSchema.parse(req.body);
    const session = store.sessions.get(validated.sessionId);
    if (!session) return res.status(404).json({ message: 'Session not found' });

    eventService.processEvent({
      id: req.body.eventId || `${Date.now()}-emergency-exit`,
      sessionId: validated.sessionId,
      studentId: validated.studentId,
      deviceId: validated.deviceId,
      institutionId: session.institutionId,
      type: EventType.EMERGENCY_ENDED,
      sequence: Date.now(),
      clientTimestamp: validated.clientTimestamp,
      serverReceivedTimestamp: new Date().toISOString(),
      metadata: {}
    });

    res.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(400).json({ message });
  }
});
