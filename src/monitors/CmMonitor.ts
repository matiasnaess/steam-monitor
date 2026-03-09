import { EventEmitter } from 'node:events';
import WebSocket from 'ws';
import type { CmServer, CmStatus, DatacenterStatus, ServiceStatus } from '../types.js';
import type { DiscoveredCm } from '../services/CmDiscovery.js';

const WS_TIMEOUT = 10_000;
const BATCH_SIZE = 30; // check this many CMs concurrently
const BATCH_DELAY = 200; // ms between batches

/**
 * Monitors Steam Connection Manager servers by testing WebSocket connectivity.
 * Groups results by datacenter and computes aggregate availability.
 */
export class CmMonitor extends EventEmitter {
  private servers: Map<string, CmServer> = new Map();
  private timer: ReturnType<typeof setInterval> | null = null;
  private interval: number;
  private checking = false;

  constructor(interval: number) {
    super();
    this.interval = interval;
  }

  /** Update the list of servers to monitor */
  updateServers(discovered: DiscoveredCm[]): void {
    for (const cm of discovered) {
      if (!this.servers.has(cm.address)) {
        this.servers.set(cm.address, {
          address: cm.address,
          datacenter: cm.datacenter,
          status: 'offline',
          lastCheck: 0,
          responseTime: 0,
        });
      }
    }
  }

  /** Start periodic CM health checks */
  start(): void {
    this.checkAll();
    this.timer = setInterval(() => this.checkAll(), this.interval);
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer);
  }

  /** Check all CM servers in batches */
  private async checkAll(): Promise<void> {
    if (this.checking || this.servers.size === 0) return;
    this.checking = true;

    const addresses = [...this.servers.keys()];
    for (let i = 0; i < addresses.length; i += BATCH_SIZE) {
      const batch = addresses.slice(i, i + BATCH_SIZE);
      await Promise.allSettled(batch.map((addr) => this.checkServer(addr)));
      if (i + BATCH_SIZE < addresses.length) {
        await sleep(BATCH_DELAY);
      }
    }

    this.checking = false;
    this.emit('update', this.getStatus());
  }

  /** Test WebSocket connectivity to a single CM */
  private async checkServer(address: string): Promise<void> {
    const server = this.servers.get(address);
    if (!server) return;

    const start = Date.now();
    const wsUrl = `wss://${address}/cmsocket/`;

    return new Promise<void>((resolve) => {
      const ws = new WebSocket(wsUrl, {
        handshakeTimeout: WS_TIMEOUT,
        headers: {
          'User-Agent': 'Valve/Steam HTTP Client 1.0',
        },
      });

      const timeout = setTimeout(() => {
        ws.terminate();
        server.status = 'offline';
        server.responseTime = Date.now() - start;
        server.lastCheck = Date.now();
        resolve();
      }, WS_TIMEOUT);

      ws.on('open', () => {
        clearTimeout(timeout);
        server.status = 'online';
        server.responseTime = Date.now() - start;
        server.lastCheck = Date.now();
        ws.close();
        resolve();
      });

      ws.on('error', () => {
        clearTimeout(timeout);
        server.status = 'offline';
        server.responseTime = Date.now() - start;
        server.lastCheck = Date.now();
        ws.terminate();
        resolve();
      });
    });
  }

  /** Compute aggregate status */
  getStatus(): CmStatus {
    const byDc = new Map<string, { total: number; online: number }>();
    let total = 0;
    let online = 0;

    for (const server of this.servers.values()) {
      total++;
      if (server.status === 'online') online++;

      const dc = server.datacenter;
      if (!byDc.has(dc)) byDc.set(dc, { total: 0, online: 0 });
      const dcStats = byDc.get(dc)!;
      dcStats.total++;
      if (server.status === 'online') dcStats.online++;
    }

    const byDatacenter: Record<string, DatacenterStatus> = {};
    for (const [dc, stats] of byDc) {
      const dcStatus: ServiceStatus =
        stats.online === stats.total
          ? 'online'
          : stats.online === 0
            ? 'offline'
            : 'degraded';
      byDatacenter[dc] = {
        total: stats.total,
        online: stats.online,
        offline: stats.total - stats.online,
        status: dcStatus,
      };
    }

    return {
      total,
      online,
      offline: total - online,
      availability: total > 0 ? Math.round((online / total) * 1000) / 10 : 0,
      byDatacenter,
      lastDiscovery: Date.now(),
    };
  }

  /** Get all individual server statuses */
  getAllServers(): CmServer[] {
    return [...this.servers.values()];
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
