import { Router } from 'express';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { SessionEventSchema, BatchEventsSchema } from '@lockwatch/validation';
import { EventService } from '../services/event.service.js';
import { DataStore } from '../store/database.js';

export const eventRouter = Router();
const eventService = new EventService();
const store = DataStore.getInstance();

eventRouter.use(requireAuth);

eventRouter.post('/', (req: AuthenticatedRequest, res) => {
  try {
    const validated = SessionEventSchema.parse(req.body);
    const result = eventService.processEvent(validated as any);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
});

eventRouter.post('/batch', (req: AuthenticatedRequest, res) => {
  try {
    const validated = BatchEventsSchema.parse(req.body);
    const result = eventService.processBatch(validated.events as any);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
});

eventRouter.get('/sessions/:id/events', (req: AuthenticatedRequest, res) => {
  const session = store.sessions.get(req.params.id);
  if (!session || session.institutionId !== req.user!.institutionId) {
    return res.status(404).json({ message: 'Session not found' });
  }
  const events = store.getSessionEvents(req.params.id);
  res.json(events);
});
