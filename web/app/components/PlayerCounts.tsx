"use client";

import type { PlayerCounts as PlayerCountsType } from "../types";

interface PlayerCountsProps {
  players: PlayerCountsType;
}

const gameInfo: Record<string, { label: string; color: string }> = {
  cs2: { label: "Counter-Strike 2", color: "#e5a100" },
  dota2: { label: "Dota 2", color: "#c23c2a" },
  tf2: { label: "Team Fortress 2", color: "#cf6a32" },
  deadlock: { label: "Deadlock", color: "#8b5cf6" },
};

function formatNumber(n: number | null): string {
  if (n === null) return "N/A";
  return n.toLocaleString();
}

export function PlayerCounts({ players }: PlayerCountsProps) {
  const entries = Object.entries(players) as [string, number | null][];

  return (
    <section>
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-steam-text-dim">
        Player Counts
      </h2>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {entries.map(([key, count]) => {
          const info = gameInfo[key];
          return (
            <div
              key={key}
              className="rounded-lg border border-steam-border bg-steam-card p-4 transition-colors hover:bg-steam-card-hover"
            >
              <div className="mb-1 flex items-center gap-2">
                <div
                  className="h-3 w-3 rounded-sm"
                  style={{ backgroundColor: info.color }}
                />
                <span className="text-xs text-steam-text-dim">
                  {info.label}
                </span>
              </div>
              <p className="text-2xl font-bold text-white font-mono">
                {formatNumber(count)}
              </p>
              <p className="mt-1 text-[10px] text-steam-text-dim">
                {count !== null ? "currently playing" : "unavailable"}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
