"use client";

import type { CmStatus } from "../types";
import { DATACENTER_NAMES } from "../types";
import { StatusBadge } from "./StatusBadge";

interface CmSectionProps {
  cms: CmStatus;
}

export function CmSection({ cms }: CmSectionProps) {
  const datacenters = Object.entries(cms.byDatacenter).sort((a, b) =>
    a[0].localeCompare(b[0])
  );

  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-steam-text-dim">
          Connection Managers
        </h2>
        <div className="flex items-center gap-4 text-xs text-steam-text-dim">
          <span>
            {cms.online}/{cms.total} servers online
          </span>
          <span className="font-mono font-medium text-steam-blue">
            {cms.availability}% available
          </span>
        </div>
      </div>

      {/* Availability bar */}
      <div className="mb-4 h-2 overflow-hidden rounded-full bg-steam-border">
        <div
          className="h-full rounded-full bg-steam-green transition-all duration-500"
          style={{ width: `${cms.availability}%` }}
        />
      </div>

      {/* Datacenter grid */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {datacenters.map(([code, dc]) => {
          // Strip trailing digits to find the base code for display name lookup
          const baseCode = code.replace(/\d+$/, "");
          const name = DATACENTER_NAMES[baseCode] || code;

          return (
            <div
              key={code}
              className="rounded-md border border-steam-border bg-steam-card p-2.5 transition-colors hover:bg-steam-card-hover"
            >
              <div className="mb-1 flex items-center justify-between">
                <span className="text-xs font-medium text-white truncate" title={name}>
                  {name}
                </span>
                <StatusBadge status={dc.status} />
              </div>
              <div className="flex items-center justify-between text-[10px] text-steam-text-dim">
                <span className="font-mono uppercase">{code}</span>
                <span>
                  {dc.online}/{dc.total}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
