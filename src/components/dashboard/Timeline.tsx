"use client";

import { useState } from "react";
import { usePatient } from "@/components/patient/PatientContext";
import { eventTypeDisplayLabel, eventTypeIcon } from "@/components/dashboard/eventMeta";
import { ReasoningDrawer } from "@/components/dashboard/ReasoningDrawer";
import { SeverityDot } from "@/components/ui/Severity";
import type { ClinicalEvent } from "@/lib/types";

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function Timeline() {
  const { events } = usePatient();
  const [selected, setSelected] = useState<ClinicalEvent | null>(null);

  // Most recent first — a shift nurse cares about what just happened.
  const ordered = [...events].reverse();

  return (
    <div className="panel flex h-full flex-col">
      <div className="panel-header shrink-0">
        <div>
          <p className="text-sm font-medium text-ink-primary">Clinical timeline</p>
          <p className="text-[11px] text-ink-tertiary">{events.length} events recorded so far</p>
        </div>
      </div>

      <ol className="flex-1 divide-y divide-base-400 overflow-auto">
        {ordered.map((event) => {
          const Icon = eventTypeIcon[event.type];
          return (
            <li key={event.id}>
              <button
                onClick={() => setSelected(event)}
                className="flex w-full items-start gap-3 px-4 py-3.5 text-left transition-colors duration-150 ease-product hover:bg-base-200"
              >
                <span className="tabular mt-0.5 w-12 shrink-0 text-xs text-ink-tertiary">
                  {formatTime(event.timestamp)}
                </span>
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-base-400 bg-base-200">
                  <Icon className="h-3.5 w-3.5 text-ink-secondary" strokeWidth={1.75} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="text-sm text-ink-primary">{event.title}</span>
                    <SeverityDot level={event.severity} pulse={event.severity === "critical"} />
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-ink-tertiary">
                    {eventTypeDisplayLabel[event.type]} · {event.description}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      <ReasoningDrawer event={selected} context={events} onClose={() => setSelected(null)} />
    </div>
  );
}
