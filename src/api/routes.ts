import type { FastifyInstance } from 'fastify';
import type { MonitorManager } from '../services/MonitorManager.js';

export function registerRoutes(app: FastifyInstance, manager: MonitorManager): void {
  // Full status snapshot
  app.get('/api/v1/status', async (_req, reply) => {
    reply.header('Cache-Control', 'no-store');
    return manager.getFullStatus();
  });

  // Just service statuses
  app.get('/api/v1/status/services', async () => {
    const full = manager.getFullStatus();
    return full.services;
  });

  // CM details by datacenter
  app.get('/api/v1/status/cms', async () => {
    return manager.cmMonitor.getStatus();
  });

  // Individual CM server list
  app.get('/api/v1/status/cms/servers', async () => {
    return manager.cmMonitor.getAllServers();
  });

  // Player counts
  app.get('/api/v1/status/players', async () => {
    return manager.players.counts;
  });

  // Game status
  app.get('/api/v1/status/games', async () => {
    return manager.games.gameStatus;
  });

  // History for charts
  app.get<{ Params: { metric: string } }>('/api/v1/history/:metric', async (req) => {
    const { metric } = req.params;
    const points = manager.statusStore.getHistory(metric);
    return { metric, points };
  });

  // Available history metrics
  app.get('/api/v1/history', async () => {
    return { metrics: manager.statusStore.getMetrics() };
  });

  // Health check
  app.get('/api/v1/health', async () => {
    return {
      status: 'ok',
      uptime: Date.now() - manager.getFullStatus().time + manager.getFullStatus().uptime,
      monitors: {
        store: manager.store.status,
        community: manager.community.status,
        webapi: manager.webapi.status,
        players: manager.players.status,
        games: manager.games.status,
      },
    };
  });
}
