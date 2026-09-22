"use client";

import { usePatient } from "@/components/patient/PatientContext";
import { latestObservation, severityForVital } from "@/lib/clinical-engine";
import { vitalDefinitions } from "@/lib/mock-data";
import { SeverityDot } from "@/components/ui/Severity";
import type { VitalKind } from "@/lib/types";

const displayOrder: VitalKind[] = ["heartRate", "spo2", "map", "temperature", "potassium"];

export function PatientHeader() {
  const { tickIndex } = usePatient();

  return (
    <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-base-400 bg-base-400 sm:grid-cols-5">
      {displayOrder.map((kind) => {
        const def = vitalDefinitions[kind];
        const observation = latestObservation(kind, tickIndex);
        const level = severityForVital(kind, observation.value);

        return (
          <div key={kind} className="bg-base-200 px-4 py-3.5">
            <div className="flex items-center gap-1.5 text-[11px] text-ink-tertiary">
              <SeverityDot level={level} pulse={level !== "normal"} />
              {def.label}
            </div>
            <p className="tabular mt-1.5 text-2xl text-ink-primary">
              {observation.value.toFixed(def.decimals)}
              <span className="ml-1 text-xs text-ink-tertiary">{def.unit}</span>
            </p>
          </div>
        );
      })}
    </div>
  );
}
