"use client";

import type { ServiceStatus } from "../types";

const statusConfig: Record<
  ServiceStatus,
  { bg: string; text: string; dot: string; label: string }
> = {
  online: {
    bg: "bg-steam-green/15",
    text: "text-steam-green",
    dot: "bg-steam-green",
    label: "Online",
  },
  degraded: {
    bg: "bg-steam-yellow/15",
    text: "text-steam-yellow",
    dot: "bg-steam-yellow",
    label: "Degraded",
  },
  offline: {
    bg: "bg-steam-red/15",
    text: "text-steam-red",
    dot: "bg-steam-red",
    label: "Offline",
  },
};

export function StatusBadge({ status }: { status: ServiceStatus }) {
  const config = statusConfig[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${config.bg} ${config.text}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}
