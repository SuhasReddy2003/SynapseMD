"use client";

import { useMemo } from "react";
import { Gauge, Play } from "lucide-react";
import clsx from "clsx";
import { usePatient } from "@/components/patient/PatientContext";
import { colors } from "@/lib/design-tokens";

const SPEEDS = [1, 2, 4];

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function TimeScrubber() {
  const { tickIndex, maxTickIndex, isPlaying, setIsPlaying, speed, setSpeed, scrubTo, dataset, events } =
    usePatient();

  const currentTimestamp = dataset.vitalSeries.heartRate[tickIndex]!.timestamp;

  // Real clinical events, positioned along the track by their actual tick index —
  // not decoration, these are genuinely clickable jump-points into the record.
  const eventMarks = useMemo(() => {
    const heartRateSeries = dataset.vitalSeries.heartRate;
    return dataset.clinicalEvents
      .map((e) => ({
        event: e,
        index: heartRateSeries.findIndex((v) => v.timestamp === e.timestamp),
      }))
      .filter((m) => m.index >= 0);
  }, [dataset, events]);

  return (
    <div className="flex h-11 shrink-0 items-center gap-3 border-b border-base-400 bg-base-100 px-4">
      <button
        onClick={() => setIsPlaying(!isPlaying)}
        className={clsx(
          "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors duration-150 ease-product",
          isPlaying
            ? "border-signal-normal/40 bg-signal-normalDim text-signal-normal"
            : "border-base-400 bg-base-200 text-ink-tertiary hover:text-ink-secondary"
        )}
        aria-label={isPlaying ? "Pause live playback" : "Resume live playback"}
      >
        <span
          className={clsx(
            "h-1.5 w-1.5 rounded-full",
            isPlaying ? "animate-pulse-live bg-signal-normal" : "bg-ink-faint"
          )}
        />
        {isPlaying ? "Live" : "Paused"}
      </button>

      <div className="relative flex-1">
        <input
          type="range"
          min={0}
          max={maxTickIndex}
          step={1}
          value={tickIndex}
          onChange={(e) => scrubTo(Number(e.target.value))}
          style={{ accentColor: colors.synapse.DEFAULT }}
          className="w-full cursor-pointer"
          aria-label="Scrub through the patient's record"
        />
        <div className="pointer-events-none absolute inset-x-0 top-3.5 h-2">
          {eventMarks.map(({ event, index }) => (
            <span
              key={event.id}
              title={event.title}
              className={clsx(
                "absolute h-1.5 w-0.5 -translate-x-1/2 rounded-full",
                event.severity === "critical"
                  ? "bg-signal-critical"
                  : event.severity === "warning"
                    ? "bg-signal-warning"
                    : "bg-ink-faint"
              )}
              style={{ left: `${(index / maxTickIndex) * 100}%` }}
            />
          ))}
        </div>
      </div>

      <span className="tabular w-12 shrink-0 text-xs text-ink-tertiary">{formatTime(currentTimestamp)}</span>

      <button
        onClick={() => setSpeed(SPEEDS[(SPEEDS.indexOf(speed) + 1) % SPEEDS.length]!)}
        className="flex items-center gap-1 rounded-md border border-base-400 bg-base-200 px-2 py-1 text-xs text-ink-tertiary transition-colors duration-150 ease-product hover:text-ink-secondary"
        aria-label="Cycle playback speed"
      >
        <Gauge className="h-3 w-3" />
        {speed}×
      </button>

      {!isPlaying && (
        <button
          onClick={() => setIsPlaying(true)}
          className="flex items-center gap-1.5 rounded-md bg-ink-primary px-2.5 py-1 text-xs font-medium text-base-50 transition-colors duration-150 ease-product hover:bg-white"
        >
          <Play className="h-3 w-3" />
          Resume live
        </button>
      )}
    </div>
  );
}
