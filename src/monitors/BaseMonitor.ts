import { EventEmitter } from 'node:events';
import type { ServiceStatus } from '../types.js';

export interface MonitorOptions {
  name: string;
  interval: number;
}

/**
 * Abstract base class for all monitors.
 * Handles interval scheduling, error handling, and status change events.
 */
export abstract class BaseMonitor extends EventEmitter {
  readonly name: string;
  protected interval: number;
  protected timer: ReturnType<typeof setInterval> | null = null;
  protected _status: ServiceStatus = 'offline';
  protected _lastCheck = 0;
  protected _responseTime = 0;
  protected _error?: string;
  protected running = false;

  constructor(opts: MonitorOptions) {
    super();
    this.name = opts.name;
    this.interval = opts.interval;
  }

  get status(): ServiceStatus {
    return this._status;
  }
  get lastCheck(): number {
    return this._lastCheck;
  }
  get responseTime(): number {
    return this._responseTime;
  }
  get error(): string | undefined {
    return this._error;
  }

  /** Start periodic checking */
  start(): void {
    if (this.running) return;
    this.running = true;
    // Run first check immediately
    this.tick();
    this.timer = setInterval(() => this.tick(), this.interval);
  }

  /** Stop periodic checking */
  stop(): void {
    this.running = false;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  /** Execute a single check cycle */
  private async tick(): Promise<void> {
    const start = Date.now();
    try {
      await this.check();
      this._responseTime = Date.now() - start;
      this._lastCheck = Date.now();
      this._error = undefined;
    } catch (err) {
      this._responseTime = Date.now() - start;
      this._lastCheck = Date.now();
      this._error = err instanceof Error ? err.message : String(err);
      this.setStatus('offline');
    }
  }

  /** Set status and emit event on change */
  protected setStatus(status: ServiceStatus): void {
    const prev = this._status;
    this._status = status;
    if (prev !== status) {
      this.emit('statusChange', {
        monitor: this.name,
        from: prev,
        to: status,
        time: Date.now(),
      });
    }
    this.emit('update', this.getState());
  }

  /** Get current state snapshot */
  getState() {
    return {
      status: this._status,
      responseTime: this._responseTime,
      lastCheck: this._lastCheck,
      error: this._error,
    };
  }

  /** Subclasses implement their specific check logic */
  protected abstract check(): Promise<void>;
}
