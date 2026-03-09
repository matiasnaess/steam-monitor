import { BaseMonitor } from './BaseMonitor.js';
import { config } from '../config.js';
import type { Cs2GameStatus, GameStatus, ServiceState, ServiceStatus } from '../types.js';

const CS2_STATUS_URL =
  'https://api.steampowered.com/ICSGOServers_730/GetGameServersStatus/v1/';
const DOTA2_URL =
  'https://api.steampowered.com/IDOTA2Match_570/GetTopLiveGame/v1/';
const TF2_URL =
  'https://api.steampowered.com/ISteamUserStats/GetNumberOfCurrentPlayers/v1/?appid=440';
const TIMEOUT = 15_000;

export class GameMonitor extends BaseMonitor {
  private _cs2: Cs2GameStatus | null = null;
  private _dota2: ServiceState | null = null;
  private _tf2: ServiceState | null = null;

  constructor(interval: number) {
    super({ name: 'games', interval });
  }

  get gameStatus(): GameStatus {
    return {
      cs2: this._cs2 ? { ...this._cs2 } : null,
      dota2: this._dota2 ? { ...this._dota2 } : null,
      tf2: this._tf2 ? { ...this._tf2 } : null,
    };
  }

  protected async check(): Promise<void> {
    await Promise.allSettled([
      this.checkCs2(),
      this.checkDota2(),
      this.checkTf2(),
    ]);

    // Aggregate status
    const statuses = [
      this._cs2 ? this.cs2AggregateStatus() : null,
      this._dota2?.status,
      this._tf2?.status,
    ].filter(Boolean) as ServiceStatus[];

    if (statuses.length === 0) {
      this.setStatus('offline');
    } else if (statuses.every((s) => s === 'online')) {
      this.setStatus('online');
    } else if (statuses.every((s) => s === 'offline')) {
      this.setStatus('offline');
    } else {
      this.setStatus('degraded');
    }
  }

  private cs2AggregateStatus(): ServiceStatus {
    if (!this._cs2) return 'offline';
    const vals = [this._cs2.matchmaking, this._cs2.sessions, this._cs2.inventories, this._cs2.scheduler];
    if (vals.every((v) => v === 'online')) return 'online';
    if (vals.every((v) => v === 'offline')) return 'offline';
    return 'degraded';
  }

  /** Fetch CS2 game server status via Valve's dedicated endpoint */
  private async checkCs2(): Promise<void> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT);

    try {
      const res = await fetch(`${CS2_STATUS_URL}?key=${config.steamApiKey}`, {
        signal: controller.signal,
      });

      if (!res.ok) {
        this._cs2 = {
          matchmaking: 'offline',
          sessions: 'offline',
          inventories: 'offline',
          scheduler: 'offline',
          onlineServers: null,
          onlinePlayers: null,
        };
        return;
      }

      const data = (await res.json()) as {
        result?: {
          matchmaking?: {
            scheduler?: string;
            online_servers?: number;
            online_players?: number;
            searching_players?: number;
          };
          services?: {
            SessionsLogon?: string;
            SteamCommunity?: string;
          };
          datacenters?: Record<string, unknown>;
        };
      };

      const result = data?.result;
      if (!result) {
        this._cs2 = {
          matchmaking: 'offline',
          sessions: 'offline',
          inventories: 'offline',
          scheduler: 'offline',
          onlineServers: null,
          onlinePlayers: null,
        };
        return;
      }

      this._cs2 = {
        matchmaking: mapValveStatus(result.matchmaking?.scheduler),
        sessions: mapValveStatus(result.services?.SessionsLogon),
        inventories: mapValveStatus(result.services?.SteamCommunity),
        scheduler: mapValveStatus(result.matchmaking?.scheduler),
        onlineServers: result.matchmaking?.online_servers ?? null,
        onlinePlayers: result.matchmaking?.online_players ?? null,
      };
    } catch {
      this._cs2 = {
        matchmaking: 'offline',
        sessions: 'offline',
        inventories: 'offline',
        scheduler: 'offline',
        onlineServers: null,
        onlinePlayers: null,
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  /** Check Dota 2 API responsiveness */
  private async checkDota2(): Promise<void> {
    const start = Date.now();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT);

    try {
      const params = new URLSearchParams({
        partner: '0',
        key: config.steamApiKey,
      });
      const res = await fetch(`${DOTA2_URL}?${params}`, {
        signal: controller.signal,
      });

      const elapsed = Date.now() - start;
      if (res.ok) {
        this._dota2 = { status: 'online', responseTime: elapsed, lastCheck: Date.now() };
      } else if (res.status >= 500) {
        this._dota2 = { status: 'offline', responseTime: elapsed, lastCheck: Date.now() };
      } else {
        this._dota2 = { status: 'degraded', responseTime: elapsed, lastCheck: Date.now() };
      }
    } catch {
      this._dota2 = { status: 'offline', responseTime: Date.now() - start, lastCheck: Date.now() };
    } finally {
      clearTimeout(timeout);
    }
  }

  /** Check TF2 API responsiveness */
  private async checkTf2(): Promise<void> {
    const start = Date.now();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT);

    try {
      const res = await fetch(`${TF2_URL}&key=${config.steamApiKey}`, {
        signal: controller.signal,
      });

      const elapsed = Date.now() - start;
      if (res.ok) {
        this._tf2 = { status: 'online', responseTime: elapsed, lastCheck: Date.now() };
      } else if (res.status >= 500) {
        this._tf2 = { status: 'offline', responseTime: elapsed, lastCheck: Date.now() };
      } else {
        this._tf2 = { status: 'degraded', responseTime: elapsed, lastCheck: Date.now() };
      }
    } catch {
      this._tf2 = { status: 'offline', responseTime: Date.now() - start, lastCheck: Date.now() };
    } finally {
      clearTimeout(timeout);
    }
  }
}

/** Map Valve's status strings to our status type */
function mapValveStatus(status?: string): ServiceStatus {
  if (!status) return 'offline';
  const lower = status.toLowerCase();
  if (lower === 'normal' || lower === 'full' || lower === 'high' || lower === 'idle') return 'online';
  if (lower === 'delayed' || lower === 'surge') return 'degraded';
  return 'offline';
}
