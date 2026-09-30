import { Router } from 'express';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { AlertService } from '../services/alert.service.js';
import { DataStore } from '../store/database.js';

export const alertRouter = Router();
const alertService = new AlertService();
const store = DataStore.getInstance();

alertRouter.use(requireAuth);

alertRouter.get('/sessions/:id/alerts', (req: AuthenticatedRequest, res) => {
  const session = store.sessions.get(req.params.id);
  if (!session || session.institutionId !== req.user!.institutionId) {
    return res.status(404).json({ message: 'Session not found' });
  }
  const alerts = store.getSessionAlerts(req.params.id);
  res.json(alerts);
});

alertRouter.post('/:id/acknowledge', (req: AuthenticatedRequest, res) => {
  try {
    const alert = alertService.acknowledgeAlert(req.params.id, req.user!.userId);
    res.json(alert);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
});
