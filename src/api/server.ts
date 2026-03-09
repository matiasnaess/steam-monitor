import Fastify from 'fastify';
import cors from '@fastify/cors';
import websocket from '@fastify/websocket';
import type { WebSocket } from 'ws';
import { config } from '../config.js';
import { registerRoutes } from './routes.js';
import type { MonitorManager } from '../services/MonitorManager.js';

export async function createServer(manager: MonitorManager) {
  const app = Fastify({
    logger: {
      level: config.logLevel,
      transport: {
        target: 'pino-pretty',
        options: { colorize: true },
      },
    },
  });

  // CORS — allow any origin for easy integration
  await app.register(cors, { origin: true });

  // WebSocket support
  await app.register(websocket);

  // REST routes
  registerRoutes(app, manager);

  // WebSocket endpoint for real-time updates
  const wsClients = new Set<WebSocket>();

  app.register(async (fastify) => {
    fastify.get('/ws', { websocket: true }, (socket, _req) => {
      wsClients.add(socket);

      // Send current status immediately on connect
      const status = manager.getFullStatus();
      socket.send(JSON.stringify({ type: 'status', data: status }));

      socket.on('close', () => {
        wsClients.delete(socket);
      });

      socket.on('error', () => {
        wsClients.delete(socket);
      });
    });
  });

  // Broadcast status updates to all connected WebSocket clients
  manager.on('statusUpdate', (status) => {
    if (wsClients.size === 0) return;
    const message = JSON.stringify({ type: 'status', data: status });
    for (const client of wsClients) {
      if (client.readyState === 1) {
        client.send(message);
      }
    }
  });

  manager.on('statusChange', (change) => {
    if (wsClients.size === 0) return;
    const message = JSON.stringify({ type: 'statusChange', data: change });
    for (const client of wsClients) {
      if (client.readyState === 1) {
        client.send(message);
      }
    }
  });

  return app;
}
