import express, { type Request, type Response, type NextFunction } from 'express';
import http from 'node:http';
import cors from 'cors';
import { config } from './config.js';
import { Logger } from './logger.js';
import { WebSocketGateway } from './websocket/gateway.js';
import { HeartbeatService } from './services/heartbeat.service.js';
import { authRouter } from './routes/auth.routes.js';
import { facultyRouter } from './routes/faculty.routes.js';
import { studentRouter } from './routes/student.routes.js';
import { deviceRouter } from './routes/device.routes.js';
import { eventRouter } from './routes/event.routes.js';
import { alertRouter } from './routes/alert.routes.js';
import { reportRouter } from './routes/report.routes.js';
import { healthRouter } from './routes/health.routes.js';
import { classRouter, studentClassRouter } from './routes/class.routes.js';
import { ExpirationWorker } from './services/expiration.worker.js';
import { DataStore } from './store/database.js';
import { PostgresSync } from './store/postgres-sync.js';

export const app = express();

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json({ limit: '5mb' }));

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on('finish', () => {
    Logger.info(`${req.method} ${req.originalUrl} ${res.statusCode} - ${Date.now() - start}ms`, {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      ip: req.ip
    });
  });
  next();
});

// Register routers
app.use('/', healthRouter);
app.use('/auth', authRouter);
app.use('/faculty', facultyRouter);
app.use('/classes', classRouter);
app.use('/students/classes', studentClassRouter);
app.use('/devices', deviceRouter);
app.use('/events', eventRouter);
app.use('/alerts', alertRouter);
app.use('/', reportRouter);
app.use('/', studentRouter);

export const server = http.createServer(app);

// Initialize WebSocket gateway & telemetry liveness monitor
export const wsGateway = WebSocketGateway.getInstance();
wsGateway.initialize(server);

export const heartbeatService = new HeartbeatService();
heartbeatService.startHeartbeatMonitor();

import { runMigrations } from './migrate.js';

export const expirationWorker = ExpirationWorker.getInstance();
if (process.env.NODE_ENV !== 'test' && process.env.RUN_WORKER !== 'false') {
  expirationWorker.start(3000);
}

if (process.env.NODE_ENV !== 'test') {
  const host = process.env.HOST || '0.0.0.0';

  const startServer = async () => {
    try {
      Logger.info('Initializing LockWatch database layer...');
      await runMigrations().catch(e => Logger.warn('Migration run note:', { msg: e.message }));
      await PostgresSync.getInstance().init(DataStore.getInstance());
    } catch (err: any) {
      Logger.error('Database initialization warning', { error: err.message });
    }

    server.listen(config.port, host, () => {
      Logger.info(`LockWatch Production Backend running on http://${host}:${config.port}`, {
        port: config.port,
        host,
        environment: process.env.NODE_ENV || 'production'
      });
    });
  };

  startServer();
}
