import { Router } from 'express';
import { requireAuth, requireRoles, AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { UserRole } from '@lockwatch/shared-models';
import { ReportService } from '../services/report.service.js';
import { DataStore } from '../store/database.js';

export const reportRouter = Router();
const reportService = new ReportService();
const store = DataStore.getInstance();

const facultyAuth = [requireAuth, requireRoles(UserRole.FACULTY, UserRole.INSTITUTION_ADMIN, UserRole.SUPER_ADMIN)];

reportRouter.get('/sessions/:id/report', ...facultyAuth, (req: AuthenticatedRequest, res) => {
  try {
    const session = store.sessions.get(req.params.id);
    if (!session || session.institutionId !== req.user!.institutionId) {
      return res.status(404).json({ message: 'Session not found' });
    }
    const report = reportService.generateSessionReport(req.params.id);
    res.json(report);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
});

reportRouter.get('/sessions/:id/report.csv', ...facultyAuth, (req: AuthenticatedRequest, res) => {
  try {
    const session = store.sessions.get(req.params.id);
    if (!session || session.institutionId !== req.user!.institutionId) {
      return res.status(404).json({ message: 'Session not found' });
    }
    const csv = reportService.generateCsv(req.params.id);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="lockwatch_session_${session.joinCode}_report.csv"`);
    res.send(csv);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
});
