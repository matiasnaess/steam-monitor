import { EventEmitter } from 'node:events';
import { config } from '../config.js';
import { StoreMonitor } from '../monitors/StoreMonitor.js';
import { CommunityMonitor } from '../monitors/CommunityMonitor.js';
import { WebApiMonitor } from '../monitors/WebApiMonitor.js';
import { CmMonitor } from '../monitors/CmMonitor.js';
import { PlayerCountMonitor } from '../monitors/PlayerCountMonitor.js';
import { GameMonitor } from '../monitors/GameMonitor.js';
import { CmDiscovery } from './CmDiscovery.js';
import { StatusStore } from './StatusStore.js';
import type { FullStatus, ServiceStatus } from '../types.js';

/**
 * Orchestrates all monitors, aggregates status, records history,
 * and emits updates for WebSocket consumers.
 */
export class MonitorManager extends EventEmitter {
  readonly store: StoreMonitor;
  readonly community: CommunityMonitor;
  readonly webapi: WebApiMonitor;
  readonly cmMonitor: CmMonitor;
  readonly players: PlayerCountMonitor;
  readonly games: GameMonitor;
  readonly cmDiscovery: CmDiscovery;
  readonly statusStore: StatusStore;

  private startTime = Date.now();
  private historyTimer: ReturnType<typeof setInterval> | null = null;

  constructor() {
    super();

    this.statusStore = new StatusStore(config.historyRetentionHours);

    // Initialize monitors
    this.store = new StoreMonitor(config.serviceCheckInterval);
    this.community = new CommunityMonitor(config.serviceCheckInterval);
    this.webapi = new WebApiMonitor(config.serviceCheckInterval);
    this.cmMonitor = new CmMonitor(config.cmCheckInterval);
    this.players = new PlayerCountMonitor(config.playerCountInterval);
    this.games = new GameMonitor(config.gameStatusInterval);
    this.cmDiscovery = new CmDiscovery();

    this.wireEvents();
  }

  /** Start all monitors */
  async start(): Promise<void> {
    this.startTime = Date.now();

    // Start CM discovery first, then monitors
    this.cmDiscovery.on('discovered', (servers) => {
      this.cmMonitor.updateServers(servers);
    });

    this.cmDiscovery.on('newServers', (info) => {
      this.emit('log', `CM Discovery: +${info.count} new servers (cell ${info.cellId}, total: ${info.total})`);
    });

    await this.cmDiscovery.start();

    // Start all monitors with staggered delays to avoid thundering herd
    this.store.start();
    await sleep(1000);
    this.community.start();
    await sleep(1000);
    this.webapi.start();
    await sleep(1000);
    this.players.start();
    await sleep(1000);
    this.games.start();
    await sleep(2000);
    this.cmMonitor.start();

    // Record history every 60 seconds
    this.historyTimer = setInterval(() => this.recordHistory(), 60_000);
  }

  /** Stop all monitors */
  stop(): void {
    this.store.stop();
    this.community.stop();
    this.webapi.stop();
    this.cmMonitor.stop();
    this.players.stop();
    this.games.stop();
    this.cmDiscovery.stop();
    this.statusStore.destroy();
    if (this.historyTimer) clearInterval(this.historyTimer);
  }

  /** Get full aggregated status snapshot */
  getFullStatus(): FullStatus {
    const cmStatus = this.cmMonitor.getStatus();

    const cmsServiceStatus: ServiceStatus =
      cmStatus.availability >= 90
        ? 'online'
        : cmStatus.availability >= 50
          ? 'degraded'
          : 'offline';

    return {
      time: Date.now(),
      uptime: Date.now() - this.startTime,
      services: {
        store: this.store.getState(),
        community: this.community.getState(),
        webapi: this.webapi.getState(),
        cms: {
          ...this.cmMonitor.getStatus(),
          status: cmsServiceStatus,
          responseTime: 0,
          lastCheck: Date.now(),
          availability: cmStatus.availability,
        },
      },
      cms: cmStatus,
      players: this.players.counts,
      games: this.games.gameStatus,
    };
  }

  /** Wire up event listeners to broadcast changes */
  private wireEvents(): void {
    const monitors = [this.store, this.community, this.webapi, this.players, this.games];

    for (const monitor of monitors) {
      monitor.on('update', () => {
        this.emit('statusUpdate', this.getFullStatus());
      });

      monitor.on('statusChange', (change) => {
        this.emit('log', `${change.monitor}: ${change.from} → ${change.to}`);
        this.emit('statusChange', change);
      });
    }

    this.cmMonitor.on('update', () => {
      this.emit('statusUpdate', this.getFullStatus());
    });
  }

  /** Record current values to history for charts */
  private recordHistory(): void {
    const cmStatus = this.cmMonitor.getStatus();
    this.statusStore.record('cm_availability', cmStatus.availability);

    const counts = this.players.counts;
    if (counts.cs2 !== null) this.statusStore.record('players_cs2', counts.cs2);
    if (counts.dota2 !== null) this.statusStore.record('players_dota2', counts.dota2);
    if (counts.tf2 !== null) this.statusStore.record('players_tf2', counts.tf2);
    if (counts.deadlock !== null) this.statusStore.record('players_deadlock', counts.deadlock);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
