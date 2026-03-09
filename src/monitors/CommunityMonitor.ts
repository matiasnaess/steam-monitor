import { BaseMonitor } from './BaseMonitor.js';

const COMMUNITY_URL = 'https://steamcommunity.com/';
const TIMEOUT = 15_000;

export class CommunityMonitor extends BaseMonitor {
  constructor(interval: number) {
    super({ name: 'community', interval });
  }

  protected async check(): Promise<void> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT);

    try {
      const res = await fetch(COMMUNITY_URL, {
        method: 'HEAD',
        signal: controller.signal,
        redirect: 'follow',
      });

      if (res.ok || res.status === 302 || res.status === 301) {
        this.setStatus('online');
      } else if (res.status >= 500) {
        this.setStatus('offline');
      } else {
        this.setStatus('degraded');
      }
    } finally {
      clearTimeout(timeout);
    }
  }
}
