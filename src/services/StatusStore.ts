import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import type { HistoryPoint } from '../types.js';

const HISTORY_FILE = 'history.json';
const SAVE_INTERVAL = 60_000; // persist to disk every 60s

interface HistoryData {
  [metric: string]: HistoryPoint[];
}

/**
 * In-memory time-series store with periodic JSON file persistence.
 * Stores historical data points for charting (CM availability, player counts, etc.)
 */
export class StatusStore {
  private history: HistoryData = {};
  private retentionMs: number;
  private saveTimer: ReturnType<typeof setInterval> | null = null;
  private dirty = false;

  constructor(retentionHours: number) {
    this.retentionMs = retentionHours * 60 * 60 * 1000;
    this.load();
    this.saveTimer = setInterval(() => this.save(), SAVE_INTERVAL);
  }

  /** Add a data point for a metric */
  record(metric: string, value: number): void {
    if (!this.history[metric]) this.history[metric] = [];
    this.history[metric].push({ time: Date.now(), value });
    this.dirty = true;
  }

  /** Get history for a metric within the retention window */
  getHistory(metric: string): HistoryPoint[] {
    const cutoff = Date.now() - this.retentionMs;
    const points = this.history[metric] ?? [];
    return points.filter((p) => p.time >= cutoff);
  }

  /** Get all available metric names */
  getMetrics(): string[] {
    return Object.keys(this.history);
  }

  /** Prune old data beyond retention window */
  prune(): void {
    const cutoff = Date.now() - this.retentionMs;
    for (const metric of Object.keys(this.history)) {
      this.history[metric] = this.history[metric].filter((p) => p.time >= cutoff);
      if (this.history[metric].length === 0) delete this.history[metric];
    }
    this.dirty = true;
  }

  /** Persist to disk */
  save(): void {
    if (!this.dirty) return;
    try {
      this.prune();
      writeFileSync(HISTORY_FILE, JSON.stringify(this.history));
      this.dirty = false;
    } catch {
      // non-fatal — data is still in memory
    }
  }

  /** Load from disk on startup */
  private load(): void {
    try {
      if (existsSync(HISTORY_FILE)) {
        const raw = readFileSync(HISTORY_FILE, 'utf-8');
        this.history = JSON.parse(raw);
        this.prune();
      }
    } catch {
      this.history = {};
    }
  }

  /** Cleanup on shutdown */
  destroy(): void {
    if (this.saveTimer) clearInterval(this.saveTimer);
    this.save();
  }
}
