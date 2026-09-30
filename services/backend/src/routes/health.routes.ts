import { Router } from 'express';
import { DataStore } from '../store/database.js';

export const healthRouter = Router();

healthRouter.get('/health', (_req, res) => {
  res.json({
    status: 'HEALTHY',
    service: 'lockwatch-backend',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

healthRouter.get('/ready', (_req, res) => {
  const store = DataStore.getInstance();
  const isReady = store.institutions.size > 0;
  res.status(isReady ? 200 : 503).json({
    ready: isReady,
    institutionsLoaded: store.institutions.size,
    timestamp: new Date().toISOString()
  });
});
