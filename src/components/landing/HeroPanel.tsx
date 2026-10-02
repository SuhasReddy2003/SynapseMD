"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";
import { SeverityDot } from "@/components/ui/Severity";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { EkgWaveform } from "@/components/landing/EkgWaveform";
import { latestObservation, nearestEvent, seriesUpTo, severityForVital } from "@/lib/clinical-engine";
import { patientDatasets, vitalDefinitions, POINT_COUNT } from "@/lib/mock-data";
import { reasoningProvider } from "@/lib/reasoning-engine";
import type { VitalKind } from "@/lib/types";

const displayOrder: VitalKind[] = ["heartRate", "spo2", "map", "temperature", "potassium"];
const START_TICK = 8;
const TICK_INTERVAL_MS = 2800;

export function HeroPanel() {
  const [patientIndex, setPatientIndex] = useState(0);
  const [tickIndex, setTickIndex] = useState(START_TICK);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const dataset = patientDatasets[patientIndex]!;

  function onMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: py * -6, y: px * 8 });
  }

  function onMouseLeave() {
    setTilt({ x: 0, y: 0 });
  }

  // Switching the preview patient restarts its telemetry at the same relative point.
  useEffect(() => {
    setTickIndex(START_TICK);
  }, [patientIndex]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTickIndex((prev) => (prev + 1 >= POINT_COUNT ? START_TICK : prev + 1));
    }, TICK_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  const potassiumSeries = seriesUpTo("potassium", tickIndex, dataset.vitalSeries);
  const trace = potassiumSeries.map((o) => o.value);
  const traceMin = Math.min(...trace);
  const traceMax = Math.max(...trace);
  const traceSpan = Math.max(traceMax - traceMin, 0.001);

  const latestPotassium = latestObservation("potassium", tickIndex, dataset.vitalSeries);
  const firstPotassium = potassiumSeries[0]!;
  const delta = Number((latestPotassium.value - firstPotassium.value).toFixed(1));
  const event = nearestEvent(latestPotassium.timestamp, dataset.clinicalEvents);
  const reasoningSteps = event ? reasoningProvider.explainEvent(event, dataset.clinicalEvents) : [];
  const reasoningStep = reasoningSteps.length
    ? reasoningSteps[tickIndex % reasoningSteps.length]!
    : null;
  const levels = displayOrder.map((k) => severityForVital(k, latestObservation(k, tickIndex, dataset.vitalSeries).value));
  const worstLevel = levels.includes("critical") ? "critical" : levels.includes("warning") ? "warning" : "normal";

  return (
    <div
      className="relative w-full max-w-lg [perspective:1200px]"
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
    >
      <div className="mb-2.5 flex items-center justify-between">
        <p className="text-[11px] text-ink-faint">Live preview — try another patient</p>
        <div className="flex gap-1.5">
          {patientDatasets.map((d, i) => (
            <button
              key={d.patient.id}
              onClick={() => setPatientIndex(i)}
              className={clsx(
                "rounded-full border px-2.5 py-1 text-xs transition-colors duration-150 ease-product",
                i === patientIndex
                  ? "border-base-500 bg-base-300 text-ink-primary"
                  : "border-base-400 text-ink-tertiary hover:text-ink-secondary"
              )}
            >
              {d.patient.name.split(" ")[0]}
            </button>
          ))}
        </div>
      </div>

      <div
        aria-hidden="true"
        className="absolute -inset-8 -z-10 rounded-[2rem] bg-synapse/10 blur-3xl"
      />

      <div
        className="panel relative overflow-hidden transition-transform duration-300 ease-out will-change-transform"
        style={{ transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)` }}
      >
        <div className="panel-header">
          <div>
            <p className="text-sm font-medium text-ink-primary">{dataset.patient.name}</p>
            <p className="text-xs text-ink-tertiary">
              {dataset.patient.age} · {dataset.patient.encounterLabel}
            </p>
          </div>
          <span className="flex items-center gap-1.5 text-xs text-ink-tertiary">
            <SeverityDot level={worstLevel} pulse={worstLevel !== "normal"} />
            Live synthetic telemetry
          </span>
        </div>

        <div
          className={clsx(
            "h-14 border-b border-base-400 bg-base-100/60 transition-colors duration-700 ease-product",
            worstLevel === "critical"
              ? "text-signal-critical"
              : worstLevel === "warning"
                ? "text-signal-warning"
                : "text-signal-normal"
          )}
        >
          <EkgWaveform className="relative h-full overflow-hidden opacity-70" />
        </div>

        <div className="grid grid-cols-2 gap-px bg-base-400 sm:grid-cols-5">
          {displayOrder.map((kind) => {
            const def = vitalDefinitions[kind];
            const obs = latestObservation(kind, tickIndex, dataset.vitalSeries);
            const level = severityForVital(kind, obs.value);
            return (
              <div key={kind} className="bg-base-200 px-3.5 py-3">
                <div className="flex items-center gap-1.5 text-[11px] text-ink-tertiary">
                  <SeverityDot level={level} pulse={level !== "normal"} />
                  {def.label}
                </div>
                <p className="tabular mt-1 text-lg text-ink-primary transition-all duration-500 ease-product sm:text-xl">
                  <AnimatedNumber value={obs.value} decimals={def.decimals} />
                  <span className="ml-1 text-xs text-ink-tertiary">{def.unit}</span>
                </p>
              </div>
            );
          })}
        </div>

        <div className="border-t border-base-400 px-4 py-2.5">
          <div className="flex items-center gap-2 text-[11px] text-synapse-bright">
            <span className="tabular shrink-0 rounded border border-synapse/30 bg-synapse-dim px-1.5 py-0.5">
              reasoning
            </span>
            {reasoningStep && (
              <span key={reasoningStep.id} className="animate-fade-in truncate text-ink-secondary">
                {reasoningStep.detail}
              </span>
            )}
          </div>
        </div>

        <div className="border-t border-base-400 px-4 py-3">
          <div className="flex items-center justify-between text-[11px] text-ink-tertiary">
            <span>Potassium trend · this window</span>
            <span className="tabular text-signal-critical">
              {delta >= 0 ? "+" : ""}
              {delta}
            </span>
          </div>
          <svg viewBox="0 0 240 48" className="mt-2 h-12 w-full" preserveAspectRatio="none">
            <polyline
              points={trace
                .map((v, i) => {
                  const x = (i / Math.max(trace.length - 1, 1)) * 240;
                  const y = 44 - ((v - traceMin) / traceSpan) * 40;
                  return `${x},${y}`;
                })
                .join(" ")}
              fill="none"
              stroke="#F0475C"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="transition-all duration-500 ease-product"
            />
            <circle
              cx={240}
              cy={44 - ((trace[trace.length - 1]! - traceMin) / traceSpan) * 40}
              r="3"
              fill="#F0475C"
            />
          </svg>
        </div>

        {event && (
          <div className="flex items-center justify-between border-t border-base-400 bg-base-100/60 px-4 py-2.5 text-[11px] text-ink-tertiary">
            <span>
              {new Date(event.timestamp).toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
              })}{" "}
              · {event.title}
            </span>
            <span className="text-synapse-bright">Reasoning trace</span>
          </div>
        )}
      </div>
    </div>
  );
}
