"use client";

import { usePatient } from "@/components/patient/PatientContext";
import { severityColor } from "@/lib/design-tokens";
import clsx from "clsx";

const RADIUS = 46;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function StabilityIndex() {
  const { synapseIndex } = usePatient();
  const offset = CIRCUMFERENCE * (1 - synapseIndex.score / 100);
  const color = severityColor[synapseIndex.level];

  return (
    <div className="panel flex h-full flex-col">
      <div className="panel-header">
        <div>
          <p className="text-sm font-medium text-ink-primary">Synapse State Index</p>
          <p className="text-[11px] text-ink-tertiary">Synthetic demonstration index — not a validated clinical score</p>
        </div>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-6 sm:flex-row sm:items-stretch">
        <div className="relative flex h-40 w-40 shrink-0 items-center justify-center">
          <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
            <circle
              cx="50"
              cy="50"
              r={RADIUS}
              fill="none"
              stroke="#1F2733"
              strokeWidth="7"
            />
            <circle
              cx="50"
              cy="50"
              r={RADIUS}
              fill="none"
              stroke={color}
              strokeWidth="7"
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={offset}
              className="transition-[stroke-dashoffset,stroke] duration-[1400ms] ease-product"
            />
          </svg>
          <div className="absolute flex flex-col items-center">
            <span className="tabular text-3xl text-ink-primary">{synapseIndex.score}</span>
            <span className="text-[11px] text-ink-tertiary">of 100</span>
          </div>
        </div>

        <div className="flex flex-1 flex-col justify-center gap-3">
          {synapseIndex.components.map((c) => (
            <div key={c.label}>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="text-ink-secondary">{c.label}</span>
                <span className="tabular text-ink-tertiary">{c.score}</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-base-300">
                <div
                  className={clsx(
                    "h-full rounded-full transition-all duration-[1200ms] ease-product",
                    {
                      "bg-signal-normal": c.level === "normal",
                      "bg-signal-warning": c.level === "warning",
                      "bg-signal-critical": c.level === "critical",
                    }
                  )}
                  style={{ width: `${c.score}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
