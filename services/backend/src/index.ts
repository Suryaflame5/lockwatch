import express from 'express';
import http from 'http';
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

export const app = express();

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json({ limit: '5mb' }));

// Request logging middleware
app.use((req, res, next) => {
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

export const expirationWorker = ExpirationWorker.getInstance();
if (process.env.NODE_ENV !== 'test') {
  expirationWorker.start(3000);
}

if (process.env.NODE_ENV !== 'test') {
  server.listen(config.port, () => {
    Logger.info(`LockWatch Production Backend running on port ${config.port}`, {
      port: config.port,
      environment: process.env.NODE_ENV || 'production'
    });
  });
}
