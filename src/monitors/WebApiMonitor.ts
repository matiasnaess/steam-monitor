import { BaseMonitor } from './BaseMonitor.js';
import { config } from '../config.js';

const WEBAPI_URL = 'https://api.steampowered.com/ISteamWebAPIUtil/GetSupportedAPIList/v1/';
const TIMEOUT = 15_000;

export class WebApiMonitor extends BaseMonitor {
  constructor(interval: number) {
    super({ name: 'webapi', interval });
  }

  protected async check(): Promise<void> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT);

    try {
      const url = `${WEBAPI_URL}?key=${config.steamApiKey}`;
      const res = await fetch(url, {
        signal: controller.signal,
      });

      if (res.ok) {
        const data = await res.json();
        // Verify response has expected structure
        if (data?.apilist?.interfaces) {
          this.setStatus('online');
        } else {
          this.setStatus('degraded');
        }
      } else if (res.status >= 500) {
        this.setStatus('offline');
      } else if (res.status === 403) {
        this.setStatus('degraded');
      } else {
        this.setStatus('offline');
      }
    } finally {
      clearTimeout(timeout);
    }
  }
}
