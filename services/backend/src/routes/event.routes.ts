import { Router, type Response } from 'express';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { SessionEventSchema, BatchEventsSchema } from '@lockwatch/validation';
import { EventService } from '../services/event.service.js';
import { DataStore } from '../store/database.js';

export const eventRouter = Router();
const eventService = new EventService();
const store = DataStore.getInstance();

eventRouter.use(requireAuth);

eventRouter.post('/', (req: AuthenticatedRequest, res: Response) => {
  try {
    const validated = SessionEventSchema.parse(req.body);
    const result = eventService.processEvent(validated as any);
    res.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(400).json({ message });
  }
});

eventRouter.post('/batch', (req: AuthenticatedRequest, res: Response) => {
  try {
    const validated = BatchEventsSchema.parse(req.body);
    const result = eventService.processBatch(validated.events as any);
    res.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(400).json({ message });
  }
});

eventRouter.get('/sessions/:id/events', (req: AuthenticatedRequest<{ id: string }>, res: Response) => {
  const session = store.sessions.get(req.params.id);
  if (!session || session.institutionId !== req.user!.institutionId) {
    return res.status(404).json({ message: 'Session not found' });
  }
  const events = store.getSessionEvents(req.params.id);
  res.json(events);
});
