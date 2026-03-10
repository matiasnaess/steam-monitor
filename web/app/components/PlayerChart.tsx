"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { HistoryPoint } from "../types";

interface PlayerChartProps {
  history: Record<string, HistoryPoint[]>;
}

const PLAYER_METRICS = [
  { key: "players_cs2", label: "CS2", color: "#e5a100" },
  { key: "players_dota2", label: "Dota 2", color: "#c23c2a" },
  { key: "players_tf2", label: "TF2", color: "#cf6a32" },
  { key: "players_deadlock", label: "Deadlock", color: "#8b5cf6" },
];

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return n.toString();
}

export function PlayerChart({ history }: PlayerChartProps) {
  // Merge all player history series into a single timeline
  const available = PLAYER_METRICS.filter((m) => history[m.key]?.length > 0);

  if (available.length === 0) {
    return (
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-steam-text-dim">
          Player History (48h)
        </h2>
        <div className="flex h-48 items-center justify-center rounded-lg border border-steam-border bg-steam-card text-sm text-steam-text-dim">
          No history data available yet
        </div>
      </section>
    );
  }

  // Build merged data points keyed by time
  const timeMap = new Map<number, Record<string, number>>();
  for (const metric of available) {
    for (const point of history[metric.key]) {
      const existing = timeMap.get(point.time) || {};
      existing[metric.key] = point.value;
      timeMap.set(point.time, existing);
    }
  }

  const data = Array.from(timeMap.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([time, values]) => ({ time, ...values }));

  return (
    <section>
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-steam-text-dim">
        Player History (48h)
      </h2>
      <div className="rounded-lg border border-steam-border bg-steam-card p-4">
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={data}>
            <XAxis
              dataKey="time"
              tickFormatter={formatTime}
              stroke="#8f98a0"
              fontSize={10}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tickFormatter={formatNumber}
              stroke="#8f98a0"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              width={45}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#16202d",
                border: "1px solid #2a3f5f",
                borderRadius: 8,
                fontSize: 12,
              }}
              labelFormatter={(v) =>
                new Date(v as number).toLocaleString([], {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })
              }
              formatter={(value) => [Number(value).toLocaleString()]}
            />
            <Legend
              wrapperStyle={{ fontSize: 11, color: "#8f98a0" }}
            />
            {available.map((metric) => (
              <Line
                key={metric.key}
                type="monotone"
                dataKey={metric.key}
                name={metric.label}
                stroke={metric.color}
                strokeWidth={2}
                dot={false}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
