"use client";

interface HeaderProps {
  connected: boolean;
  uptime: number | null;
  error: string | null;
}

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export function Header({ connected, uptime, error }: HeaderProps) {
  return (
    <header className="border-b border-steam-border bg-steam-dark">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          <svg
            viewBox="0 0 24 24"
            className="h-8 w-8 text-steam-blue"
            fill="currentColor"
          >
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
          </svg>
          <div>
            <h1 className="text-xl font-bold text-white">Steam Monitor</h1>
            <p className="text-xs text-steam-text-dim">
              Real-time infrastructure status
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {uptime !== null && (
            <span className="hidden text-xs text-steam-text-dim sm:block">
              Service uptime: {formatUptime(uptime)}
            </span>
          )}

          {error ? (
            <span className="flex items-center gap-1.5 text-xs text-steam-red">
              <span className="h-2 w-2 rounded-full bg-steam-red" />
              Disconnected
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-xs text-steam-green">
              <span className="h-2 w-2 rounded-full bg-steam-green animate-pulse-dot" />
              {connected ? "Live" : "Connecting..."}
            </span>
          )}
        </div>
      </div>
    </header>
  );
}
