import WebSocket, { WebSocketServer } from 'ws';
import type http from 'node:http';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { Logger } from '../logger.js';
import type { TokenPayload } from '../services/auth.service.js';

interface ClientSocket extends WebSocket {
  isAlive: boolean;
  sessionId?: string;
  userId?: string;
  role?: string;
}

export class WebSocketGateway {
  private static instance: WebSocketGateway;
  private wss?: WebSocketServer;
  private sessionRooms = new Map<string, Set<ClientSocket>>();

  private constructor() {}

  public static getInstance(): WebSocketGateway {
    if (!WebSocketGateway.instance) {
      WebSocketGateway.instance = new WebSocketGateway();
    }
    return WebSocketGateway.instance;
  }

  public initialize(server: http.Server) {
    this.wss = new WebSocketServer({ server, path: '/ws' });

    this.wss.on('connection', (ws: ClientSocket, req) => {
      ws.isAlive = true;

      // Extract token from query or URL
      const url = new URL(req.url || '', `http://${req.headers.host}`);
      const token = url.searchParams.get('token');
      const sessionId = url.searchParams.get('sessionId');

      if (!token) {
        ws.close(1008, 'Token required');
        return;
      }

      try {
        const decoded = jwt.verify(token, config.jwtSecret) as TokenPayload;
        ws.userId = decoded.userId;
        ws.role = decoded.role;
        ws.sessionId = sessionId || undefined;

        if (sessionId) {
          this.joinSessionRoom(sessionId, ws);
        }

        ws.on('pong', () => {
          ws.isAlive = true;
        });

        ws.on('message', (message: WebSocket.RawData) => {
          try {
            const data = JSON.parse(message.toString());
            this.handleClientMessage(ws, data);
          } catch (e) {
            Logger.warn('Invalid WebSocket message received', { error: String(e) });
          }
        });

        ws.on('close', () => {
          if (ws.sessionId) {
            this.leaveSessionRoom(ws.sessionId, ws);
          }
        });

        // Send connection confirmation
        ws.send(JSON.stringify({ event: 'connected', timestamp: new Date().toISOString() }));
      } catch {
        ws.close(1008, 'Invalid authentication token');
      }
    });

    // Heartbeat check for active sockets every 30 seconds
    const pingInterval = setInterval(() => {
      if (!this.wss) return;
      this.wss.clients.forEach((ws) => {
        const client = ws as ClientSocket;
        if (!client.isAlive) return client.terminate();
        client.isAlive = false;
        client.ping();
      });
    }, 30000);
    pingInterval.unref();

    Logger.info('WebSocketGateway initialized on /ws');
  }

  private joinSessionRoom(sessionId: string, ws: ClientSocket) {
    if (!this.sessionRooms.has(sessionId)) {
      this.sessionRooms.set(sessionId, new Set());
    }
    this.sessionRooms.get(sessionId)!.add(ws);
  }

  private leaveSessionRoom(sessionId: string, ws: ClientSocket) {
    const room = this.sessionRooms.get(sessionId);
    if (room) {
      room.delete(ws);
      if (room.size === 0) {
        this.sessionRooms.delete(sessionId);
      }
    }
  }

  private handleClientMessage(ws: ClientSocket, data: { action?: string; sessionId?: string }) {
    if (data.action === 'join_session' && data.sessionId) {
      if (ws.sessionId) {
        this.leaveSessionRoom(ws.sessionId, ws);
      }
      ws.sessionId = data.sessionId;
      this.joinSessionRoom(data.sessionId, ws);
      ws.send(JSON.stringify({ event: 'session_joined', sessionId: data.sessionId }));
    }
  }

  public broadcastToSession(sessionId: string, event: string, payload: unknown) {
    const room = this.sessionRooms.get(sessionId);
    if (!room) return;

    const message = JSON.stringify({
      event,
      sessionId,
      data: payload,
      timestamp: new Date().toISOString()
    });

    for (const client of room) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    }
  }

  public broadcastToClass(classId: string, event: string, payload: unknown) {
    if (!this.wss) return;
    const message = JSON.stringify({
      event,
      classId,
      data: payload,
      timestamp: new Date().toISOString()
    });
    for (const client of this.wss.clients) {
      const c = client as ClientSocket;
      if (c.readyState === WebSocket.OPEN) {
        c.send(message);
      }
    }
  }

  public broadcastToFaculty(userId: string, payload: unknown) {
    if (!this.wss) return;
    const message = JSON.stringify({
      event: 'faculty_notification',
      data: payload,
      timestamp: new Date().toISOString()
    });
    for (const client of this.wss.clients) {
      const c = client as ClientSocket;
      if (c.readyState === WebSocket.OPEN && c.userId === userId) {
        c.send(message);
      }
    }
  }
}
