import { Router, type Response } from 'express';
import { requireAuth, requireRoles, AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { UserRole } from '@lockwatch/shared-models';
import { ClassService } from '../services/class.service.js';
import { AuditService } from '../services/audit.service.js';
import { DataStore } from '../store/database.js';
import {
  CreateClassSchema,
  UpdateClassSchema,
  AddStudentToClassSchema,
  BulkAddStudentsSchema,
  CreateClassSessionSchema,
  JoinClassCodeSchema,
  JoinClassQrSchema
} from '@lockwatch/validation';

export const classRouter = Router();
export const studentClassRouter = Router();

const classService = new ClassService();
const auditService = new AuditService();
const store = DataStore.getInstance();

// ==========================================
// Faculty Class Endpoints (/classes)
// ==========================================

classRouter.use(requireAuth, requireRoles(UserRole.FACULTY, UserRole.INSTITUTION_ADMIN, UserRole.SUPER_ADMIN));

classRouter.get('/', (req: AuthenticatedRequest, res: Response) => {
  try {
    const faculty = store.findFacultyByUserId(req.user!.userId);
    if (!faculty) return res.status(403).json({ message: 'Faculty profile not found' });

    const classes = classService.getFacultyClasses(faculty.id);
    res.json(classes);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ message });
  }
});

classRouter.post('/', (req: AuthenticatedRequest, res: Response) => {
  try {
    const faculty = store.findFacultyByUserId(req.user!.userId);
    if (!faculty) return res.status(403).json({ message: 'Faculty profile not found' });

    const validated = CreateClassSchema.parse(req.body);
    const newClass = classService.createClass(faculty.id, req.user!.institutionId, validated);

    auditService.logAction({
      institutionId: req.user!.institutionId,
      facultyId: faculty.id,
      userId: req.user!.userId,
      action: 'CLASS_CREATED',
      result: 'SUCCESS'
    });

    res.status(201).json(newClass);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(400).json({ message });
  }
});

classRouter.get('/:id', (req: AuthenticatedRequest<{ id: string }>, res: Response) => {
  try {
    const cls = classService.getClassById(req.params.id);
    res.json(cls);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(404).json({ message });
  }
});

classRouter.patch('/:id', (req: AuthenticatedRequest<{ id: string }>, res: Response) => {
  try {
    const faculty = store.findFacultyByUserId(req.user!.userId);
    if (!faculty) return res.status(403).json({ message: 'Faculty profile not found' });

    const validated = UpdateClassSchema.parse(req.body);
    const updated = classService.updateClass(req.params.id, faculty.id, validated);
    res.json(updated);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(400).json({ message });
  }
});

classRouter.post('/:id/archive', (req: AuthenticatedRequest<{ id: string }>, res: Response) => {
  try {
    const faculty = store.findFacultyByUserId(req.user!.userId);
    if (!faculty) return res.status(403).json({ message: 'Faculty profile not found' });

    classService.archiveClass(req.params.id, faculty.id);
    res.json({ message: 'Class archived successfully' });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(400).json({ message });
  }
});

classRouter.post('/:id/qr', (req: AuthenticatedRequest<{ id: string }>, res: Response) => {
  try {
    const faculty = store.findFacultyByUserId(req.user!.userId);
    if (!faculty) return res.status(403).json({ message: 'Faculty profile not found' });

    const qrData = classService.generateClassQr(req.params.id, faculty.id);
    res.json(qrData);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(400).json({ message });
  }
});

classRouter.get('/:id/roster', (req: AuthenticatedRequest<{ id: string }>, res: Response) => {
  try {
    const roster = classService.getClassRoster(req.params.id);
    res.json(roster);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(404).json({ message });
  }
});

classRouter.post('/:id/roster', (req: AuthenticatedRequest<{ id: string }>, res: Response) => {
  try {
    const validated = AddStudentToClassSchema.parse(req.body);
    const added = classService.addStudentToClass(req.params.id, validated.registerNumber);
    res.status(201).json(added);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(400).json({ message });
  }
});

classRouter.post('/:id/roster/bulk', (req: AuthenticatedRequest<{ id: string }>, res: Response) => {
  try {
    const validated = BulkAddStudentsSchema.parse(req.body);
    const result = classService.bulkAddStudents(req.params.id, validated.registerNumbers);
    res.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(400).json({ message });
  }
});

classRouter.delete('/:id/roster/:studentId', (req: AuthenticatedRequest<{ id: string; studentId: string }>, res: Response) => {
  try {
    classService.removeStudentFromClass(req.params.id, req.params.studentId);
    res.json({ message: 'Student removed from class roster' });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(400).json({ message });
  }
});

classRouter.get('/:id/history', (req: AuthenticatedRequest<{ id: string }>, res: Response) => {
  try {
    const history = classService.getClassHistory(req.params.id);
    res.json(history);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(404).json({ message });
  }
});

classRouter.get('/:id/report', (req: AuthenticatedRequest<{ id: string }>, res: Response) => {
  try {
    const report = classService.getClassReport(req.params.id);
    res.json(report);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(404).json({ message });
  }
});

classRouter.post('/:id/sessions', (req: AuthenticatedRequest<{ id: string }>, res: Response) => {
  try {
    const faculty = store.findFacultyByUserId(req.user!.userId);
    if (!faculty) return res.status(403).json({ message: 'Faculty profile not found' });

    const validated = CreateClassSessionSchema.parse({
      ...req.body,
      classId: req.params.id
    });

    const session = classService.createClassSession(
      req.params.id,
      faculty.id,
      req.user!.institutionId,
      validated
    );

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

// GET /classes/:id/session-status (Section 72)
classRouter.get('/:id/session-status', (req: AuthenticatedRequest<{ id: string }>, res: Response) => {
  try {
    const cls = store.classes.get(req.params.id);
    if (!cls || cls.institutionId !== req.user!.institutionId) {
      return res.status(404).json({ message: 'Class not found' });
    }
    const metrics = classService.getClassSessionParticipationMetrics(cls.id);
    let activeSession = null;
    if (cls.activeSessionId) {
      activeSession = store.sessions.get(cls.activeSessionId) || null;
    }
    res.json({
      classId: cls.id,
      className: cls.name,
      activeSession,
      metrics
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(400).json({ message });
  }
});

// ==========================================
// Student Class Endpoints (/students/classes)
// ==========================================

studentClassRouter.use(requireAuth, requireRoles(UserRole.STUDENT));

studentClassRouter.get('/', (req: AuthenticatedRequest, res: Response) => {
  try {
    const student = store.findStudentByUserId(req.user!.userId);
    if (!student) return res.status(403).json({ message: 'Student profile not found' });

    const classes = classService.getStudentClasses(student.id);
    res.json(classes);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ message });
  }
});

studentClassRouter.post('/join-code', (req: AuthenticatedRequest, res: Response) => {
  try {
    const student = store.findStudentByUserId(req.user!.userId);
    if (!student) return res.status(403).json({ message: 'Student profile not found' });

    const validated = JoinClassCodeSchema.parse(req.body);
    const result = classService.joinClassByCode(student.id, validated.classCode, {
      displayName: validated.displayName,
      registerNumber: validated.registerNumber
    });
    res.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(400).json({ message });
  }
});

studentClassRouter.post('/join-qr', (req: AuthenticatedRequest, res: Response) => {
  try {
    const student = store.findStudentByUserId(req.user!.userId);
    if (!student) return res.status(403).json({ message: 'Student profile not found' });

    const validated = JoinClassQrSchema.parse(req.body);
    const result = classService.joinClassByQr(student.id, validated.qrToken, {
      displayName: validated.displayName,
      registerNumber: validated.registerNumber
    });
    res.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(400).json({ message });
  }
});

studentClassRouter.post('/join', (req: AuthenticatedRequest, res: Response) => {
  try {
    const student = store.findStudentByUserId(req.user!.userId);
    if (!student) return res.status(403).json({ message: 'Student profile not found' });

    const { classCode, qrToken, displayName, registerNumber } = req.body;
    let result;
    if (qrToken) {
      result = classService.joinClassByQr(student.id, qrToken, { displayName, registerNumber });
    } else if (classCode) {
      result = classService.joinClassByCode(student.id, classCode, { displayName, registerNumber });
    } else {
      return res.status(400).json({ message: 'Either class code or QR token is required.' });
    }
    res.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(400).json({ message });
  }
});

