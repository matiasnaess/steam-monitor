"use client";

import type { GameStatus as GameStatusType, ServiceStatus } from "../types";
import { StatusBadge } from "./StatusBadge";

interface GameStatusProps {
  games: GameStatusType;
}

function formatNumber(n: number | null): string {
  if (n === null) return "N/A";
  return n.toLocaleString();
}

export function GameStatus({ games }: GameStatusProps) {
  return (
    <section>
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-steam-text-dim">
        Game Servers
      </h2>
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        {/* CS2 - detailed */}
        {games.cs2 && (
          <div className="rounded-lg border border-steam-border bg-steam-card p-4 lg:col-span-1">
            <div className="mb-3 flex items-center gap-2">
              <div className="h-3 w-3 rounded-sm bg-[#e5a100]" />
              <span className="font-medium text-white">Counter-Strike 2</span>
            </div>
            <div className="space-y-2">
              {(
                ["matchmaking", "sessions", "inventories", "scheduler"] as const
              ).map((service) => (
                <div
                  key={service}
                  className="flex items-center justify-between"
                >
                  <span className="text-xs capitalize text-steam-text-dim">
                    {service}
                  </span>
                  <StatusBadge status={games.cs2![service] as ServiceStatus} />
                </div>
              ))}
              <div className="mt-3 border-t border-steam-border pt-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-steam-text-dim">Online servers</span>
                  <span className="font-mono text-white">
                    {formatNumber(games.cs2.onlineServers)}
                  </span>
                </div>
                <div className="mt-1 flex items-center justify-between text-xs">
                  <span className="text-steam-text-dim">Online players</span>
                  <span className="font-mono text-white">
                    {formatNumber(games.cs2.onlinePlayers)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Dota 2 */}
        {games.dota2 && (
          <div className="rounded-lg border border-steam-border bg-steam-card p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-sm bg-[#c23c2a]" />
                <span className="font-medium text-white">Dota 2</span>
              </div>
              <StatusBadge status={games.dota2.status} />
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-steam-text-dim">Response time</span>
              <span className="font-mono text-steam-text">
                {games.dota2.responseTime}ms
              </span>
            </div>
          </div>
        )}

        {/* TF2 */}
        {games.tf2 && (
          <div className="rounded-lg border border-steam-border bg-steam-card p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-sm bg-[#cf6a32]" />
                <span className="font-medium text-white">
                  Team Fortress 2
                </span>
              </div>
              <StatusBadge status={games.tf2.status} />
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-steam-text-dim">Response time</span>
              <span className="font-mono text-steam-text">
                {games.tf2.responseTime}ms
              </span>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
