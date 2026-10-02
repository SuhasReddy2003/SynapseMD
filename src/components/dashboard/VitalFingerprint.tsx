"use client";

import { useState } from "react";
import { Users } from "lucide-react";
import clsx from "clsx";
import { Legend, PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer } from "recharts";
import { usePatient } from "@/components/patient/PatientContext";
import { componentScore } from "@/lib/clinical-engine";
import { patientDatasets, vitalDefinitions } from "@/lib/mock-data";
import { colors } from "@/lib/design-tokens";
import type { VitalKind } from "@/lib/types";

const KINDS: VitalKind[] = ["heartRate", "spo2", "map", "temperature", "potassium"];
const COMPARE_COLORS = [colors.compare.a, colors.compare.b];

function firstName(name: string): string {
  return name.split(" ")[0]!;
}

export function VitalFingerprint() {
  const { tickIndex, dataset, selectedPatientId } = usePatient();
  const [compareAll, setCompareAll] = useState(false);

  const others = compareAll ? patientDatasets.filter((d) => d.patient.id !== selectedPatientId) : [];

  const data = KINDS.map((kind) => {
    const row: Record<string, number | string> = {
      vital: vitalDefinitions[kind].label,
      now: componentScore(kind, tickIndex, dataset.vitalSeries),
      start: componentScore(kind, 0, dataset.vitalSeries),
    };
    for (const other of others) {
      row[other.patient.id] = componentScore(kind, tickIndex, other.vitalSeries);
    }
    return row;
  });

  return (
    <div className="panel flex flex-col">
      <div className="panel-header">
        <div>
          <p className="text-sm font-medium text-ink-primary">Vital fingerprint</p>
          <p className="text-[11px] text-ink-tertiary">
            {compareAll
              ? "Every synthetic patient at this same moment in their record"
              : "A full pentagon means every vital is in range; dashes show the start of the record"}
          </p>
        </div>
        <button
          onClick={() => setCompareAll((v) => !v)}
          className={clsx(
            "flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors duration-150 ease-product",
            compareAll
              ? "border-base-500 bg-base-300 text-ink-primary"
              : "border-base-400 text-ink-tertiary hover:text-ink-secondary"
          )}
        >
          <Users className="h-3 w-3" strokeWidth={1.75} />
          Compare all
        </button>
      </div>

      <div className="h-56 px-2 py-2" role="img" aria-label="Radar chart of vital stability, current patient versus others">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data} outerRadius="66%">
            <PolarGrid stroke={colors.base[400]} />
            <PolarAngleAxis dataKey="vital" tick={{ fill: colors.ink.tertiary, fontSize: 11 }} />
            <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />

            {compareAll ? (
              others.map((other, i) => (
                <Radar
                  key={other.patient.id}
                  dataKey={other.patient.id}
                  name={firstName(other.patient.name)}
                  stroke={COMPARE_COLORS[i % COMPARE_COLORS.length]}
                  strokeWidth={1.5}
                  strokeDasharray="4 3"
                  fill="none"
                  isAnimationActive={false}
                />
              ))
            ) : (
              <Radar dataKey="start" stroke={colors.ink.faint} strokeDasharray="4 3" fill="none" isAnimationActive={false} />
            )}

            <Radar
              dataKey="now"
              name={firstName(dataset.patient.name)}
              stroke={colors.synapse.DEFAULT}
              strokeWidth={2}
              fill={colors.synapse.DEFAULT}
              fillOpacity={0.22}
              animationDuration={700}
            />

            {compareAll && (
              <Legend
                wrapperStyle={{ fontSize: 11 }}
                formatter={(value: string) => <span style={{ color: colors.ink.tertiary }}>{value}</span>}
              />
            )}
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
