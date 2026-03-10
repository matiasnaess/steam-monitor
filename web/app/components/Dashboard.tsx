"use client";

import { useSteamStatus } from "../hooks/useSteamStatus";
import { Header } from "./Header";
import { ServiceCards } from "./ServiceCards";
import { CmSection } from "./CmSection";
import { PlayerCounts } from "./PlayerCounts";
import { GameStatus } from "./GameStatus";
import { PlayerChart } from "./PlayerChart";

export function Dashboard() {
  const { status, connected, error, history } = useSteamStatus();

  return (
    <div className="min-h-screen">
      <Header
        connected={connected}
        uptime={status ? Math.round(status.uptime / 1000) : null}
        error={error}
      />

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        {!status && !error && (
          <div className="flex h-64 items-center justify-center">
            <div className="text-center">
              <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-steam-blue border-t-transparent" />
              <p className="text-sm text-steam-text-dim">
                Connecting to Steam Monitor...
              </p>
            </div>
          </div>
        )}

        {error && !status && (
          <div className="flex h-64 items-center justify-center">
            <div className="text-center">
              <p className="mb-2 text-lg text-steam-red">Connection Error</p>
              <p className="text-sm text-steam-text-dim">{error}</p>
              <p className="mt-2 text-xs text-steam-text-dim">
                Make sure the Steam Monitor service is running on port 3300
              </p>
            </div>
          </div>
        )}

        {status && (
          <div className="space-y-6">
            {/* Last updated */}
            <div className="text-right text-xs text-steam-text-dim">
              Last updated:{" "}
              {new Date(status.time).toLocaleTimeString()}
            </div>

            <ServiceCards services={status.services} />
            <PlayerCounts players={status.players} />
            <PlayerChart history={history} />
            <GameStatus games={status.games} />
            <CmSection cms={status.cms} />
          </div>
        )}
      </main>

      <footer className="border-t border-steam-border py-4 text-center text-xs text-steam-text-dim">
        Steam Monitor Dashboard &mdash; Data refreshes in real-time via WebSocket
      </footer>
    </div>
  );
}
