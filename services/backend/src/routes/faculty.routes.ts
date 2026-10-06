import { Router, type Response } from 'express';
import { requireAuth, requireRoles, AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { UserRole } from '@lockwatch/shared-models';
import { SessionService } from '../services/session.service.js';
import { AuditService } from '../services/audit.service.js';
import { CreateSessionSchema } from '@lockwatch/validation';
import { DataStore } from '../store/database.js';

export const facultyRouter = Router();
const sessionService = new SessionService();
const auditService = new AuditService();
const store = DataStore.getInstance();

// All routes require FACULTY role
facultyRouter.use(requireAuth, requireRoles(UserRole.FACULTY, UserRole.INSTITUTION_ADMIN, UserRole.SUPER_ADMIN));

facultyRouter.get('/me', (req: AuthenticatedRequest, res: Response) => {
  const faculty = store.findFacultyByUserId(req.user!.userId);
  const institution = store.institutions.get(req.user!.institutionId);
  res.json({
    user: req.user,
    faculty,
    institution
  });
});

facultyRouter.get('/sessions', (req: AuthenticatedRequest, res: Response) => {
  const instId = req.user!.institutionId;
  const sessions = Array.from(store.sessions.values())
    .filter(s => s.institutionId === instId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  res.json(sessions);
});

facultyRouter.post('/sessions', (req: AuthenticatedRequest, res: Response) => {
  try {
    const validated = CreateSessionSchema.parse(req.body);
    const faculty = store.findFacultyByUserId(req.user!.userId);
    if (!faculty) {
      return res.status(403).json({ message: 'Faculty profile not found' });
    }

    const session = sessionService.createSession({
      facultyId: faculty.id,
      institutionId: req.user!.institutionId,
      ...validated
    });

    auditService.logAction({
      institutionId: req.user!.institutionId,
      facultyId: faculty.id,
      userId: req.user!.userId,
      action: 'SESSION_CREATED',
      sessionId: session.id,
      result: 'SUCCESS'
    });

    res.status(201).json(session);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(400).json({ message });
  }
});

facultyRouter.get('/sessions/:id/live', (req: AuthenticatedRequest<{ id: string }>, res: Response) => {
  try {
    const data = sessionService.getSessionLiveDetails(req.params.id);
    if (data.session.institutionId !== req.user!.institutionId) {
      return res.status(403).json({ message: 'Access denied: Multi-tenant boundary violation' });
    }
    res.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(404).json({ message });
  }
});

facultyRouter.get('/sessions/:id/readiness', (req: AuthenticatedRequest<{ id: string }>, res: Response) => {
  try {
    const session = store.sessions.get(req.params.id);
    if (!session || session.institutionId !== req.user!.institutionId) {
      return res.status(404).json({ message: 'Session not found' });
    }
    const readiness = sessionService.getSessionReadiness(req.params.id);
    res.json(readiness);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(400).json({ message });
  }
});

facultyRouter.post('/sessions/:id/start', (req: AuthenticatedRequest<{ id: string }>, res: Response) => {
  try {
    const faculty = store.findFacultyByUserId(req.user!.userId);
    if (!faculty) return res.status(403).json({ message: 'Faculty not found' });

    const session = sessionService.startSession(req.params.id, faculty.id);

    auditService.logAction({
      institutionId: req.user!.institutionId,
      facultyId: faculty.id,
      userId: req.user!.userId,
      action: 'SESSION_STARTED',
      sessionId: session.id,
      result: 'SUCCESS'
    });

    res.json(session);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(400).json({ message });
  }
});

facultyRouter.post('/sessions/:id/pause', (req: AuthenticatedRequest<{ id: string }>, res: Response) => {
  try {
    const faculty = store.findFacultyByUserId(req.user!.userId);
    if (!faculty) return res.status(403).json({ message: 'Faculty not found' });

    const session = sessionService.pauseSession(req.params.id, faculty.id);

    auditService.logAction({
      institutionId: req.user!.institutionId,
      facultyId: faculty.id,
      userId: req.user!.userId,
      action: 'SESSION_PAUSED',
      sessionId: session.id,
      result: 'SUCCESS'
    });

    res.json(session);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(400).json({ message });
  }
});

facultyRouter.post('/sessions/:id/resume', (req: AuthenticatedRequest<{ id: string }>, res: Response) => {
  try {
    const faculty = store.findFacultyByUserId(req.user!.userId);
    if (!faculty) return res.status(403).json({ message: 'Faculty not found' });

    const session = sessionService.resumeSession(req.params.id, faculty.id);

    auditService.logAction({
      institutionId: req.user!.institutionId,
      facultyId: faculty.id,
      userId: req.user!.userId,
      action: 'SESSION_RESUMED',
      sessionId: session.id,
      result: 'SUCCESS'
    });

    res.json(session);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(400).json({ message });
  }
});

facultyRouter.post('/sessions/:id/end', (req: AuthenticatedRequest<{ id: string }>, res: Response) => {
  try {
    const faculty = store.findFacultyByUserId(req.user!.userId);
    if (!faculty) return res.status(403).json({ message: 'Faculty not found' });

    const session = sessionService.endSession(req.params.id, faculty.id);

    auditService.logAction({
      institutionId: req.user!.institutionId,
      facultyId: faculty.id,
      userId: req.user!.userId,
      action: 'SESSION_ENDED',
      sessionId: session.id,
      result: 'SUCCESS'
    });

    res.json(session);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(400).json({ message });
  }
});

facultyRouter.get('/sessions/:id/audit-logs', (req: AuthenticatedRequest<{ id: string }>, res: Response) => {
  const session = store.sessions.get(req.params.id);
  if (!session || session.institutionId !== req.user!.institutionId) {
    return res.status(404).json({ message: 'Session not found' });
  }
  const logs = auditService.getSessionAuditLogs(req.params.id);
  res.json(logs);
});

facultyRouter.post('/sessions/:id/grant-permission', (req: AuthenticatedRequest<{ id: string }>, res: Response) => {
  try {
    const faculty = store.findFacultyByUserId(req.user!.userId);
    if (!faculty) return res.status(403).json({ message: 'Faculty not found' });

    const { studentId, durationMinutes } = req.body;
    if (!studentId) return res.status(400).json({ message: 'studentId is required' });

    const minutes = Math.max(1, Math.min(120, parseInt(durationMinutes || '5', 10)));
    const result = sessionService.grantTemporaryAccess(req.params.id, studentId, minutes, faculty.id);

    auditService.logAction({
      institutionId: req.user!.institutionId,
      facultyId: faculty.id,
      userId: req.user!.userId,
      action: 'TEMPORARY_ACCESS_GRANTED',
      sessionId: req.params.id,
      result: 'SUCCESS'
    });

    res.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(400).json({ message });
  }
});

facultyRouter.post('/sessions/:id/revoke-permission', (req: AuthenticatedRequest<{ id: string }>, res: Response) => {
  try {
    const faculty = store.findFacultyByUserId(req.user!.userId);
    if (!faculty) return res.status(403).json({ message: 'Faculty not found' });

    const { studentId } = req.body;
    if (!studentId) return res.status(400).json({ message: 'studentId is required' });

    const result = sessionService.revokeTemporaryAccess(req.params.id, studentId, faculty.id);

    auditService.logAction({
      institutionId: req.user!.institutionId,
      facultyId: faculty.id,
      userId: req.user!.userId,
      action: 'TEMPORARY_ACCESS_REVOKED',
      sessionId: req.params.id,
      result: 'SUCCESS'
    });

    res.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(400).json({ message });
  }
});

