import { EventEmitter } from 'node:events';
import { config } from '../config.js';

const STEAM_DIRECTORY_URL =
  'https://api.steampowered.com/ISteamDirectory/GetCMListForConnect/v1/';
const TIMEOUT = 15_000;

export interface DiscoveredCm {
  address: string;
  datacenter: string;
}

/**
 * Discovers Steam Connection Manager servers by querying the Steam Directory API
 * across multiple cell IDs (geographic regions).
 */
export class CmDiscovery extends EventEmitter {
  private knownCms = new Map<string, DiscoveredCm>();
  private currentCellId = 0;
  private timer: ReturnType<typeof setInterval> | null = null;
  private scanning = false;

  get servers(): DiscoveredCm[] {
    return [...this.knownCms.values()];
  }

  get serverCount(): number {
    return this.knownCms.size;
  }

  /** Start periodic discovery */
  async start(): Promise<void> {
    // Initial scan of key cell IDs for quick startup
    await this.quickScan();
    // Continue full scan in background
    this.startFullScan();
    // Periodic re-discovery
    this.timer = setInterval(() => this.quickScan(), config.cmDiscoveryInterval);
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer);
  }

  /** Quick scan of cell ID 0 (default) to get a baseline CM list fast */
  private async quickScan(): Promise<void> {
    await this.fetchCellId(0);
    // Also fetch a few major regions
    const keyCells = [1, 2, 3, 4, 5, 10, 20, 30, 40, 47];
    await Promise.allSettled(keyCells.map((id) => this.fetchCellId(id)));
    this.emit('discovered', this.servers);
  }

  /** Full background scan through all cell IDs */
  private async startFullScan(): Promise<void> {
    if (this.scanning) return;
    this.scanning = true;

    for (let i = 0; i < config.cmMaxCellId; i++) {
      this.currentCellId = i;
      await this.fetchCellId(i);
      // Small delay between requests to avoid rate limiting
      await sleep(500);
    }

    this.scanning = false;
    this.emit('scanComplete', this.servers);
  }

  /** Fetch CM list for a specific cell ID */
  private async fetchCellId(cellId: number): Promise<void> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT);

    try {
      const params = new URLSearchParams({
        cmtype: 'websockets',
        cellid: cellId.toString(),
        maxcount: '1000',
      });

      // For cell 47 (Shanghai), also query the steamchina realm
      if (cellId === 47) {
        params.set('realm', 'steamchina');
      }

      const res = await fetch(`${STEAM_DIRECTORY_URL}?${params}`, {
        signal: controller.signal,
      });

      if (!res.ok) return;

      const data = (await res.json()) as {
        response?: {
          serverlist?: Array<{
            endpoint: string;
            dc: string;
            type: string;
          }>;
        };
      };

      const serverList = data?.response?.serverlist;
      if (!Array.isArray(serverList)) return;

      let newCount = 0;
      for (const server of serverList) {
        if (!server.endpoint || !server.dc) continue;
        const address = server.endpoint;
        if (!this.knownCms.has(address)) {
          newCount++;
        }
        this.knownCms.set(address, {
          address,
          datacenter: server.dc,
        });
      }

      if (newCount > 0) {
        this.emit('newServers', { cellId, count: newCount, total: this.knownCms.size });
      }
    } catch {
      // Non-fatal — some cell IDs may not return results
    } finally {
      clearTimeout(timeout);
    }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
