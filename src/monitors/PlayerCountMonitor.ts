import { BaseMonitor } from './BaseMonitor.js';
import { config } from '../config.js';
import { GAME_APP_IDS, type PlayerCounts } from '../types.js';

const PLAYER_COUNT_URL =
  'https://api.steampowered.com/ISteamUserStats/GetNumberOfCurrentPlayers/v1/';
const TIMEOUT = 15_000;

export class PlayerCountMonitor extends BaseMonitor {
  private _counts: PlayerCounts = {
    cs2: null,
    dota2: null,
    tf2: null,
    deadlock: null,
  };

  constructor(interval: number) {
    super({ name: 'players', interval });
  }

  get counts(): PlayerCounts {
    return { ...this._counts };
  }

  protected async check(): Promise<void> {
    const results = await Promise.allSettled(
      Object.entries(GAME_APP_IDS).map(async ([game, appId]) => {
        const count = await this.fetchPlayerCount(appId);
        return { game, count };
      })
    );

    let anySuccess = false;
    for (const result of results) {
      if (result.status === 'fulfilled') {
        const { game, count } = result.value;
        (this._counts as unknown as Record<string, number | null>)[game] = count;
        if (count !== null) anySuccess = true;
      }
    }

    this.setStatus(anySuccess ? 'online' : 'offline');
  }

  private async fetchPlayerCount(appId: number): Promise<number | null> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT);

    try {
      const params = new URLSearchParams({
        appid: appId.toString(),
        key: config.steamApiKey,
      });

      const res = await fetch(`${PLAYER_COUNT_URL}?${params}`, {
        signal: controller.signal,
      });

      if (!res.ok) return null;

      const data = (await res.json()) as {
        response?: { player_count?: number; result?: number };
      };

      if (data?.response?.result === 1 && typeof data.response.player_count === 'number') {
        return data.response.player_count;
      }
      return null;
    } catch {
      return null;
    } finally {
      clearTimeout(timeout);
    }
  }
}
