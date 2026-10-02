"use client";

import { useMemo } from "react";
import clsx from "clsx";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { usePatient } from "@/components/patient/PatientContext";
import { useCommandState } from "@/components/dashboard/CommandContext";
import { computeSynapseIndex, eventsUpTo, latestObservation, severityForVital } from "@/lib/clinical-engine";
import { findMissingContext } from "@/lib/context-engine";
import { worstVitalKind } from "@/lib/evidence-engine";
import { patientDatasets, vitalDefinitions } from "@/lib/mock-data";
import { colors, severityColor } from "@/lib/design-tokens";
import { SeverityDot } from "@/components/ui/Severity";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { useFlipReorder } from "@/components/dashboard/useFlipReorder";

const TREND_COLORS = [colors.synapse.DEFAULT, colors.signal.warning, colors.signal.normal];

function IndexSparkline({ values, color }: { values: number[]; color: string }) {
  if (values.length < 2) return <div className="h-8 w-28" />;
  const points = values.map((v, i) => `${(i / (values.length - 1)) * 100},${30 - (v / 100) * 28}`).join(" ");
  return (
    <svg viewBox="0 0 100 32" preserveAspectRatio="none" className="h-8 w-28">
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function WardBoard() {
  const { tickIndex, selectedPatientId, setSelectedPatientId } = usePatient();
  const { setActiveSection } = useCommandState();

  // Every patient, computed at the same moment in time — the ward as one pure function of the scrubber.
  const rows = useMemo(() => {
    return patientDatasets
      .map((d) => {
        const events = eventsUpTo(tickIndex, d.clinicalEvents, d.vitalSeries);
        const index = computeSynapseIndex(tickIndex, events, d.vitalSeries);
        const history = Array.from({ length: tickIndex + 1 }, (_, t) =>
          computeSynapseIndex(t, eventsUpTo(t, d.clinicalEvents, d.vitalSeries), d.vitalSeries).score
        );
        const kind = worstVitalKind(tickIndex, d.vitalSeries);
        const obs = latestObservation(kind, tickIndex, d.vitalSeries);
        const gaps = findMissingContext(tickIndex, events, d.vitalSeries);
        return { d, index, history, kind, obs, level: severityForVital(kind, obs.value), gaps };
      })
      .sort((a, b) => a.index.score - b.index.score);
  }, [tickIndex]);

  // Ranks reshuffle as the scrubber moves — animate rows to their new slot instead of snapping.
  const { registerRef } = useFlipReorder(rows.map((r) => r.d.patient.id));

  const trendData = useMemo(() => {
    return Array.from({ length: tickIndex + 1 }, (_, t) => {
      const point: Record<string, number | string> = { tick: t };
      for (const d of patientDatasets) {
        point[d.patient.name.split(" ")[0]!] = computeSynapseIndex(
          t,
          eventsUpTo(t, d.clinicalEvents, d.vitalSeries),
          d.vitalSeries
        ).score;
      }
      return point;
    });
  }, [tickIndex]);

  return (
    <div className="flex h-full flex-col gap-5 lg:flex-row">
      <div className="panel flex flex-1 flex-col lg:max-w-2xl">
        <div className="panel-header shrink-0">
          <div>
            <p className="text-sm font-medium text-ink-primary">Ward board</p>
            <p className="text-[11px] text-ink-tertiary">
              All synthetic patients at the same moment, lowest Synapse index first
            </p>
          </div>
        </div>

        <ol className="flex-1 divide-y divide-base-400 overflow-auto">
          {rows.map(({ d, index, history, kind, obs, level, gaps }, rank) => {
            const def = vitalDefinitions[kind];
            const isSelected = d.patient.id === selectedPatientId;
            return (
              <li key={d.patient.id} ref={registerRef(d.patient.id)} className="animate-card-rise" style={{ animationDelay: `${rank * 60}ms` }}>
                <button
                  onClick={() => {
                    setSelectedPatientId(d.patient.id);
                    setActiveSection("overview");
                  }}
                  className={clsx(
                    "flex w-full flex-wrap items-center gap-x-6 gap-y-3 px-4 py-4 text-left transition-colors duration-150 ease-product hover:bg-base-200",
                    isSelected && "bg-base-100/60"
                  )}
                >
                  <span className="tabular w-5 text-xs text-ink-faint">{rank + 1}</span>
                  <span className="min-w-[10rem] flex-1">
                    <span className="flex items-center gap-2 text-sm text-ink-primary">
                      {d.patient.name}
                      {isSelected && <span className="rounded-full border border-base-400 px-1.5 text-[10px] text-ink-tertiary">open</span>}
                    </span>
                    <span className="block text-xs text-ink-tertiary">
                      {d.patient.age} · {d.patient.encounterLabel}
                    </span>
                  </span>

                  <span className="flex items-baseline gap-1">
                    <span className="tabular text-2xl" style={{ color: severityColor[index.level] }}>
                      <AnimatedNumber value={index.score} duration={800} />
                    </span>
                    <span className="text-[11px] text-ink-tertiary">index</span>
                  </span>

                  <IndexSparkline values={history} color={severityColor[index.level]} />

                  <span className="flex min-w-[9rem] items-center gap-1.5 text-xs text-ink-secondary">
                    <SeverityDot level={level} pulse={level === "critical"} />
                    {def.label} <AnimatedNumber value={obs.value} decimals={def.decimals} /> {def.unit}
                  </span>

                  <span className="tabular w-20 text-right text-xs text-ink-tertiary">
                    {gaps.length} open {gaps.length === 1 ? "gap" : "gaps"}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </div>

      <div className="panel flex flex-1 flex-col">
        <div className="panel-header shrink-0">
          <div>
            <p className="text-sm font-medium text-ink-primary">Ward trend</p>
            <p className="text-[11px] text-ink-tertiary">Every patient&apos;s Synapse index over the revealed record</p>
          </div>
        </div>
        <div className="flex-1 px-2 py-3">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
              <CartesianGrid stroke={colors.base[400]} vertical={false} />
              <XAxis dataKey="tick" hide />
              <YAxis
                domain={[0, 100]}
                tick={{ fill: colors.ink.tertiary, fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                width={28}
              />
              <Tooltip
                contentStyle={{
                  background: colors.base[200],
                  border: `1px solid ${colors.base[400]}`,
                  borderRadius: 8,
                  fontSize: 12,
                }}
                labelFormatter={() => ""}
              />
              {patientDatasets.map((d, i) => (
                <Line
                  key={d.patient.id}
                  type="monotone"
                  dataKey={d.patient.name.split(" ")[0]}
                  stroke={TREND_COLORS[i % TREND_COLORS.length]}
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
