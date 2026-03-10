"use client";

import type { FullStatus } from "../types";
import { StatusBadge } from "./StatusBadge";

interface ServiceCardsProps {
  services: FullStatus["services"];
}

const serviceInfo: Record<
  string,
  { label: string; description: string; icon: string }
> = {
  store: {
    label: "Steam Store",
    description: "Store & purchase services",
    icon: "M3 3h18v14H3V3zm2 2v10h14V5H5zm3 12h8v2H8v-2z",
  },
  community: {
    label: "Community",
    description: "Profiles, groups & forums",
    icon: "M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z",
  },
  webapi: {
    label: "Web API",
    description: "Developer API endpoints",
    icon: "M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z",
  },
  cms: {
    label: "Connection Managers",
    description: "Game client connections",
    icon: "M21 3H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H3V5h18v14zM5 15h14v2H5v-2zm0-4h14v2H5v-2zm0-4h14v2H5V7z",
  },
};

export function ServiceCards({ services }: ServiceCardsProps) {
  return (
    <section>
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-steam-text-dim">
        Core Services
      </h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Object.entries(services).map(([key, state]) => {
          const info = serviceInfo[key];
          return (
            <div
              key={key}
              className="rounded-lg border border-steam-border bg-steam-card p-4 transition-colors hover:bg-steam-card-hover"
            >
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <svg
                    viewBox="0 0 24 24"
                    className="h-5 w-5 text-steam-blue"
                    fill="currentColor"
                  >
                    <path d={info.icon} />
                  </svg>
                  <span className="font-medium text-white">{info.label}</span>
                </div>
                <StatusBadge status={state.status} />
              </div>
              <p className="mb-2 text-xs text-steam-text-dim">
                {info.description}
              </p>
              <div className="flex items-center justify-between text-xs">
                <span className="text-steam-text-dim">Response</span>
                <span className="font-mono text-steam-text">
                  {state.responseTime}ms
                </span>
              </div>
              {"availability" in state && (
                <div className="mt-1 flex items-center justify-between text-xs">
                  <span className="text-steam-text-dim">Availability</span>
                  <span className="font-mono text-steam-text">
                    {state.availability}%
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
