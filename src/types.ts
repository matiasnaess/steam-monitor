export type ServiceStatus = 'online' | 'degraded' | 'offline';

export interface ServiceState {
  status: ServiceStatus;
  responseTime: number;
  lastCheck: number;
  error?: string;
}

export interface CmServer {
  address: string;
  datacenter: string;
  status: ServiceStatus;
  lastCheck: number;
  responseTime: number;
}

export interface DatacenterStatus {
  total: number;
  online: number;
  offline: number;
  status: ServiceStatus;
}

export interface CmStatus {
  total: number;
  online: number;
  offline: number;
  availability: number;
  byDatacenter: Record<string, DatacenterStatus>;
  lastDiscovery: number;
}

export interface PlayerCounts {
  cs2: number | null;
  dota2: number | null;
  tf2: number | null;
  deadlock: number | null;
}

export interface Cs2GameStatus {
  matchmaking: ServiceStatus;
  sessions: ServiceStatus;
  inventories: ServiceStatus;
  scheduler: ServiceStatus;
  onlineServers: number | null;
  onlinePlayers: number | null;
}

export interface GameStatus {
  cs2: Cs2GameStatus | null;
  dota2: ServiceState | null;
  tf2: ServiceState | null;
}

export interface FullStatus {
  time: number;
  uptime: number;
  services: {
    store: ServiceState;
    community: ServiceState;
    webapi: ServiceState;
    cms: ServiceState & { availability: number };
  };
  cms: CmStatus;
  players: PlayerCounts;
  games: GameStatus;
}

export interface HistoryPoint {
  time: number;
  value: number;
}

export interface MonitorEvent {
  type: 'service' | 'cms' | 'players' | 'games';
  data: unknown;
}

export const DATACENTER_NAMES: Record<string, string> = {
  ams: 'Amsterdam',
  atl: 'Atlanta',
  bom: 'Mumbai',
  can: 'Guangdong',
  ctu: 'Chengdu',
  dfw: 'Dallas',
  dxb: 'Dubai',
  eze: 'Buenos Aires',
  fra: 'Frankfurt',
  gru: 'São Paulo',
  hel: 'Helsinki',
  hkg: 'Hong Kong',
  iad: 'Sterling',
  jnb: 'Johannesburg',
  lax: 'Los Angeles',
  lhr: 'London',
  lim: 'Lima',
  maa: 'Chennai',
  mad: 'Madrid',
  ord: 'Chicago',
  par: 'Paris',
  pek: 'Beijing',
  scl: 'Santiago',
  sea: 'Seattle',
  seo: 'Seoul',
  sgp: 'Singapore',
  sha: 'Shanghai',
  sto: 'Stockholm',
  syd: 'Sydney',
  tyo: 'Tokyo',
  vie: 'Vienna',
  waw: 'Warsaw',
};

export const GAME_APP_IDS = {
  cs2: 730,
  dota2: 570,
  tf2: 440,
  deadlock: 1422450,
} as const;
