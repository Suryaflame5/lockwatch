import { ExpirationWorker } from './services/expiration.worker.js';
import { Logger } from './logger.js';
import { PostgresService } from './store/postgres.js';
import { config } from './config.js';

Logger.info('Starting LockWatch Standalone Expiration Worker service...', {
  environment: process.env.NODE_ENV || 'production',
  intervalMs: config.staleThresholdSeconds * 1000 || 3000
});

const worker = ExpirationWorker.getInstance();
const interval = parseInt(process.env.WORKER_INTERVAL_MS || '3000', 10);
worker.start(interval);

// Handle graceful shutdown
const shutdown = async (signal: string) => {
  Logger.info(`${signal} received. Gracefully stopping ExpirationWorker...`);
  worker.stop();
  try {
    await PostgresService.getInstance().close();
  } catch {}
  Logger.info('ExpirationWorker stopped cleanly.');
  process.exit(0);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
