import { Router } from 'express';
import { DataStore } from '../store/database.js';
import { PostgresService } from '../store/postgres.js';

export const healthRouter = Router();

healthRouter.get('/health', (_req, res) => {
  res.json({
    status: 'HEALTHY',
    service: 'lockwatch-backend',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

healthRouter.get('/health/db', async (_req, res) => {
  const pgService = PostgresService.getInstance();
  const dbHealth = await pgService.testConnection();
  res.status(dbHealth.connected ? 200 : 503).json({
    service: 'lockwatch-backend',
    database: dbHealth.database || 'lockwatch',
    user: dbHealth.user || 'lockwatch_app',
    status: dbHealth.connected ? 'CONNECTED' : 'DISCONNECTED',
    latencyMs: dbHealth.latencyMs,
    error: dbHealth.error,
    timestamp: new Date().toISOString()
  });
});

healthRouter.get('/ready', async (_req, res) => {
  const store = DataStore.getInstance();
  const isReady = store.institutions.size > 0;
  res.status(isReady ? 200 : 503).json({
    ready: isReady,
    institutionsLoaded: store.institutions.size,
    timestamp: new Date().toISOString()
  });
});
