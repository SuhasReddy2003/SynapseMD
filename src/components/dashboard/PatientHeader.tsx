"use client";

import { useEffect } from "react";
import clsx from "clsx";
import { usePatient } from "@/components/patient/PatientContext";
import { useCommandState } from "@/components/dashboard/CommandContext";
import { latestObservation, seriesUpTo, severityForVital } from "@/lib/clinical-engine";
import { vitalDefinitions } from "@/lib/mock-data";
import { SeverityDot } from "@/components/ui/Severity";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { severityColor } from "@/lib/design-tokens";
import type { VitalKind } from "@/lib/types";

function Sparkline({ values, color }: { values: number[]; color: string }) {
  if (values.length < 2) return <div className="mt-1.5 h-6" />;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = Math.max(max - min, 0.001);
  const points = values
    .map((v, i) => `${(i / (values.length - 1)) * 100},${22 - ((v - min) / span) * 20}`)
    .join(" ");

  return (
    <svg viewBox="0 0 100 24" preserveAspectRatio="none" className="mt-1.5 h-6 w-full">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="transition-all duration-500 ease-product"
      />
    </svg>
  );
}

const displayOrder: VitalKind[] = ["heartRate", "spo2", "map", "temperature", "potassium"];
const FOCUS_DURATION_MS = 3000;

export function PatientHeader() {
  const { tickIndex, dataset } = usePatient();
  const { signalsOnly, focusVital, setFocusVital } = useCommandState();

  // A command-driven focus is a momentary spotlight, not a sticky setting.
  useEffect(() => {
    if (!focusVital) return;
    const t = setTimeout(() => setFocusVital(null), FOCUS_DURATION_MS);
    return () => clearTimeout(t);
  }, [focusVital, setFocusVital]);

  const visible = signalsOnly
    ? displayOrder.filter(
        (kind) => severityForVital(kind, latestObservation(kind, tickIndex, dataset.vitalSeries).value) !== "normal"
      )
    : displayOrder;

  const gridColsClass: Record<number, string> = {
    1: "sm:grid-cols-1",
    2: "sm:grid-cols-2",
    3: "sm:grid-cols-3",
    4: "sm:grid-cols-4",
    5: "sm:grid-cols-5",
  };

  if (signalsOnly && visible.length === 0) {
    return (
      <div className="panel flex items-center gap-2 px-4 py-3.5 text-sm text-ink-tertiary">
        <SeverityDot level="normal" />
        No unresolved signals right now — every vital is within its normal range.
      </div>
    );
  }

  return (
    <div
      className={clsx(
        "grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-base-400 bg-base-400",
        gridColsClass[visible.length] ?? "sm:grid-cols-5"
      )}
    >
      {visible.map((kind) => {
        const def = vitalDefinitions[kind];
        const observation = latestObservation(kind, tickIndex, dataset.vitalSeries);
        const level = severityForVital(kind, observation.value);
        const isFocused = focusVital === kind;

        return (
          <div
            key={kind}
            className={clsx(
              "bg-base-200 px-4 py-3.5 transition-shadow duration-500 ease-product",
              isFocused && "ring-1 ring-inset ring-synapse"
            )}
          >
            <div className="flex items-center gap-1.5 text-[11px] text-ink-tertiary">
              <SeverityDot level={level} pulse={level !== "normal"} />
              {def.label}
            </div>
            <p className="tabular mt-1.5 text-2xl text-ink-primary">
              <AnimatedNumber value={observation.value} decimals={def.decimals} />
              <span className="ml-1 text-xs text-ink-tertiary">{def.unit}</span>
            </p>
            <Sparkline
              values={seriesUpTo(kind, tickIndex, dataset.vitalSeries).map((o) => o.value)}
              color={severityColor[level]}
            />
          </div>
        );
      })}
    </div>
  );
}
