import 'dotenv/config';

function env(key: string, fallback?: string): string {
  const val = process.env[key] ?? fallback;
  if (val === undefined) throw new Error(`Missing required env var: ${key}`);
  return val;
}

function envInt(key: string, fallback: number): number {
  const val = process.env[key];
  return val ? parseInt(val, 10) : fallback;
}

export const config = {
  steamApiKey: env('STEAM_API_KEY'),

  port: envInt('PORT', 3300),
  host: env('HOST', '0.0.0.0'),

  /** How often to check Steam Store/Community/WebAPI (ms) */
  serviceCheckInterval: envInt('SERVICE_CHECK_INTERVAL', 30_000),
  /** How often to probe CM servers (ms) */
  cmCheckInterval: envInt('CM_CHECK_INTERVAL', 300_000),
  /** How often to re-discover CM servers from Steam Directory API (ms) */
  cmDiscoveryInterval: envInt('CM_DISCOVERY_INTERVAL', 600_000),
  /** Max cell ID to scan for CM discovery */
  cmMaxCellId: envInt('CM_MAX_CELL_ID', 220),
  /** How often to fetch player counts (ms) */
  playerCountInterval: envInt('PLAYER_COUNT_INTERVAL', 60_000),
  /** How often to check game server status (ms) */
  gameStatusInterval: envInt('GAME_STATUS_INTERVAL', 60_000),
  /** Hours of history to retain */
  historyRetentionHours: envInt('HISTORY_RETENTION_HOURS', 48),

  logLevel: env('LOG_LEVEL', 'info'),
} as const;
