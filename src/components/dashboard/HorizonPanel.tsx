"use client";

import { useMemo } from "react";
import { ArrowDownRight, ArrowUpRight, Hourglass } from "lucide-react";
import { usePatient } from "@/components/patient/PatientContext";
import { buildHorizon, formatEta } from "@/lib/forecast-engine";
import { severityColor } from "@/lib/design-tokens";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { SeverityDot } from "@/components/ui/Severity";

const MAX_ROWS = 4;

export function HorizonPanel() {
  const { tickIndex, dataset } = usePatient();
  const items = useMemo(() => buildHorizon(tickIndex, dataset.vitalSeries).slice(0, MAX_ROWS), [tickIndex, dataset]);

  return (
    <div className="panel flex h-full flex-col">
      <div className="panel-header">
        <div>
          <p className="text-sm font-medium text-ink-primary">Horizon</p>
          <p className="text-[11px] text-ink-tertiary">
            Where each vital is heading at its current rate — naive extrapolation, not a clinical forecast
          </p>
        </div>
        <Hourglass className="h-4 w-4 text-ink-faint" strokeWidth={1.5} />
      </div>

      {items.length === 0 ? (
        <div className="flex flex-1 items-center justify-center px-6 py-8 text-center text-sm text-ink-tertiary">
          No vital is on a steady trajectory toward a limit right now.
        </div>
      ) : (
        <ul className="divide-y divide-base-400">
          {items.map((item) => {
            const worsening = item.direction === "worsening";
            const span = item.threshold - item.windowStart;
            const progress = span === 0 ? 0 : Math.min(Math.max((item.current - item.windowStart) / span, 0), 1);
            const Arrow = item.slopePerHour >= 0 ? ArrowUpRight : ArrowDownRight;
            const targetColor = severityColor[item.target];
            return (
              <li key={item.kind} className="px-4 py-3.5">
                <div className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-2 text-sm text-ink-primary">
                    <SeverityDot level={item.target} pulse={worsening && item.target === "critical"} />
                    {item.label}
                    <Arrow className="h-3.5 w-3.5 text-ink-tertiary" strokeWidth={1.75} />
                  </span>
                  <span className="tabular text-xs text-ink-tertiary">
                    {worsening ? "reaches" : "returns to"} {item.target === "normal" ? "normal" : item.target} at{" "}
                    <span className="text-ink-secondary">
                      {item.threshold} {item.unit}
                    </span>
                  </span>
                </div>
                <div className="mt-2.5 flex items-center gap-3">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-base-300">
                    <div
                      className="h-full rounded-full transition-[width] duration-[1200ms] ease-product"
                      style={{ width: `${Math.max(progress * 100, 4)}%`, background: targetColor }}
                    />
                  </div>
                  <span className="tabular w-24 text-right text-sm text-ink-primary">
                    ≈ {item.minutesAway < 60 ? (
                      <>
                        <AnimatedNumber value={item.minutesAway} /> min
                      </>
                    ) : (
                      formatEta(item.minutesAway)
                    )}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
