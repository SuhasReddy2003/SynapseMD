"use client";

import { useState } from "react";
import { usePatient } from "@/components/patient/PatientContext";
import { useCommandState } from "@/components/dashboard/CommandContext";
import { X } from "lucide-react";
import { eventTypeDisplayLabel, eventTypeIcon } from "@/components/dashboard/eventMeta";
import { ReasoningDrawer, type DrawerContent } from "@/components/dashboard/ReasoningDrawer";
import { SeverityDot } from "@/components/ui/Severity";
import { reasoningProvider } from "@/lib/reasoning-engine";
import type { ClinicalEvent } from "@/lib/types";

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function toDrawerContent(event: ClinicalEvent, context: ClinicalEvent[]): DrawerContent {
  return {
    id: event.id,
    icon: eventTypeIcon[event.type],
    title: event.title,
    typeLabel: eventTypeDisplayLabel[event.type],
    timeLabel: formatTime(event.timestamp),
    severity: event.severity,
    description: event.description,
    sourceText: event.sourceText,
    highlight: event.highlight,
    steps: reasoningProvider.explainEvent(event, context),
  };
}

export function Timeline() {
  const { events } = usePatient();
  const { timelineFilter, setTimelineFilter } = useCommandState();
  const [selected, setSelected] = useState<DrawerContent | null>(null);

  // Most recent first — a shift nurse cares about what just happened.
  const filtered = timelineFilter ? events.filter((e) => e.type === timelineFilter) : events;
  const ordered = [...filtered].reverse();

  return (
    <div className="panel flex h-full flex-col">
      <div className="panel-header shrink-0">
        <div>
          <p className="text-sm font-medium text-ink-primary">Clinical timeline</p>
          <p className="text-[11px] text-ink-tertiary">
            {ordered.length} of {events.length} events{timelineFilter ? ` · filtered to ${eventTypeDisplayLabel[timelineFilter].toLowerCase()}` : ""}
          </p>
        </div>
        {timelineFilter && (
          <button
            onClick={() => setTimelineFilter(null)}
            className="flex items-center gap-1.5 rounded-full border border-base-400 bg-base-200 px-2.5 py-1 text-xs text-ink-tertiary transition-colors duration-150 ease-product hover:border-base-500 hover:text-ink-primary"
          >
            {eventTypeDisplayLabel[timelineFilter]}
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      {ordered.length === 0 ? (
        <div className="flex flex-1 items-center justify-center text-sm text-ink-tertiary">
          No events of this type recorded yet.
        </div>
      ) : (
        <ol className="flex-1 divide-y divide-base-400 overflow-auto">
        {ordered.map((event) => {
          const Icon = eventTypeIcon[event.type];
          return (
            <li key={event.id}>
              <button
                onClick={() => setSelected(toDrawerContent(event, events))}
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
      )}

      <ReasoningDrawer content={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
