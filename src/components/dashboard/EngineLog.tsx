"use client";

import { useMemo } from "react";
import { usePatient } from "@/components/patient/PatientContext";
import { buildActivityFeed, type ActivityCategory } from "@/lib/activity-engine";
import { colors, severityColor } from "@/lib/design-tokens";
import { SeverityDot } from "@/components/ui/Severity";

const categoryLabel: Record<ActivityCategory, string> = {
  record: "record",
  signal: "signal",
  index: "index",
  gap: "context",
  hypothesis: "reasoning",
};

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
}

export function EngineLog() {
  const { tickIndex, dataset, isPlaying } = usePatient();
  const feed = useMemo(() => buildActivityFeed(tickIndex, dataset, 9), [tickIndex, dataset]);

  return (
    <div className="panel flex h-full flex-col">
      <div className="panel-header">
        <div>
          <p className="text-sm font-medium text-ink-primary">Engine log</p>
          <p className="text-[11px] text-ink-tertiary">What the reasoning engine noticed — rewinds when you scrub</p>
        </div>
        <span className="flex items-center gap-1.5 text-[11px] text-ink-tertiary">
          <SeverityDot level={isPlaying ? "normal" : "neutral"} pulse={isPlaying} />
          {isPlaying ? "listening" : "paused"}
        </span>
      </div>

      {feed.length === 0 ? (
        <div className="flex flex-1 items-center justify-center px-6 py-8 text-center text-sm text-ink-tertiary">
          Nothing has changed yet. Press play or drag the timeline scrubber.
        </div>
      ) : (
        <ul className="flex-1 overflow-hidden py-1.5 font-mono text-[12px]" aria-live="polite">
          {feed.map((entry) => {
            const color = entry.tone === "info" ? colors.synapse.DEFAULT : severityColor[entry.tone];
            return (
              <li
                key={entry.id}
                className="flex animate-log-in items-baseline gap-3 px-4 py-1.5"
              >
                <span className="tabular shrink-0 text-ink-faint">{formatTime(entry.timestamp)}</span>
                <span className="w-[4.6rem] shrink-0" style={{ color }}>
                  {categoryLabel[entry.category]}
                </span>
                <span className="min-w-0 leading-snug text-ink-secondary">{entry.text}</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
