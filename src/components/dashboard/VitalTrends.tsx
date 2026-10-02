"use client";

import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { TrendingUpDown } from "lucide-react";
import clsx from "clsx";
import { usePatient } from "@/components/patient/PatientContext";
import { nearestEvent, seriesUpTo } from "@/lib/clinical-engine";
import { worstVitalKind } from "@/lib/evidence-engine";
import { colors } from "@/lib/design-tokens";
import { vitalDefinitions, STEP_MINUTES } from "@/lib/mock-data";
import type { ClinicalEvent, VitalKind } from "@/lib/types";

const PROJECTION_TAIL_POINTS = 6;
const PROJECTION_STEPS = 6;

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function paddedDomain(values: number[]): [number, number] {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const pad = Math.max((max - min) * 0.2, 1);
  return [Math.floor(min - pad), Math.ceil(max + pad)];
}

/** Ordinary least-squares slope/intercept over the tail of a series — used only for the labeled synthetic projection. */
function linearRegression(values: number[]): { slope: number; intercept: number } {
  const n = values.length;
  const meanX = (n - 1) / 2;
  const meanY = values.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let den = 0;
  values.forEach((y, x) => {
    num += (x - meanX) * (y - meanY);
    den += (x - meanX) ** 2;
  });
  const slope = den === 0 ? 0 : num / den;
  return { slope, intercept: meanY - slope * meanX };
}

interface ChartPoint {
  timestamp: string;
  time: string;
  primary?: number;
  secondary?: number;
  projected?: number;
}

function CustomTooltip({
  active,
  payload,
  events,
  primaryKind,
  secondaryKind,
}: {
  active?: boolean;
  payload?: { dataKey: string; value: number }[];
  events: ClinicalEvent[];
  primaryKind: VitalKind;
  secondaryKind: VitalKind;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const point = payload[0] as unknown as { payload: ChartPoint };
  const timestamp = point.payload.timestamp;
  const event = nearestEvent(timestamp, events);
  const rows = payload.filter((entry) => entry.dataKey === "primary" || entry.dataKey === "secondary");
  const isProjected = payload.some((entry) => entry.dataKey === "projected") && rows.length === 0;

  return (
    <div className="panel min-w-[220px] px-3 py-2.5 shadow-floating">
      <p className="text-xs text-ink-tertiary">
        {formatTime(timestamp)}
        {isProjected && " · synthetic projection"}
      </p>
      <div className="mt-1.5 space-y-1">
        {isProjected
          ? payload
              .filter((e) => e.dataKey === "projected")
              .map((entry) => (
                <div key="projected" className="flex items-center justify-between gap-4 text-sm">
                  <span className="text-ink-secondary">{vitalDefinitions[primaryKind].label} (projected)</span>
                  <span className="tabular text-ink-primary">
                    {entry.value.toFixed(vitalDefinitions[primaryKind].decimals)} {vitalDefinitions[primaryKind].unit}
                  </span>
                </div>
              ))
          : rows.map((entry) => {
              const kind = entry.dataKey === "primary" ? primaryKind : secondaryKind;
              const def = vitalDefinitions[kind];
              return (
                <div key={entry.dataKey} className="flex items-center justify-between gap-4 text-sm">
                  <span className="text-ink-secondary">{def.label}</span>
                  <span className="tabular text-ink-primary">
                    {entry.value.toFixed(def.decimals)} {def.unit}
                  </span>
                </div>
              );
            })}
      </div>
      {event && !isProjected && (
        <div className="mt-2 border-t border-base-400 pt-2">
          <p className="text-[11px] text-ink-tertiary">Nearest event</p>
          <p className="text-xs text-ink-primary">{event.title}</p>
        </div>
      )}
    </div>
  );
}

export function VitalTrends() {
  const { tickIndex, maxTickIndex, events, dataset } = usePatient();
  const [showProjection, setShowProjection] = useState(false);

  const primaryKind = worstVitalKind(tickIndex, dataset.vitalSeries);
  const secondaryKind: VitalKind = primaryKind === "map" ? "potassium" : "map";
  const primaryDef = vitalDefinitions[primaryKind];
  const secondaryDef = vitalDefinitions[secondaryKind];

  const primarySeries = seriesUpTo(primaryKind, tickIndex, dataset.vitalSeries);
  const secondarySeries = seriesUpTo(secondaryKind, tickIndex, dataset.vitalSeries);

  const data: ChartPoint[] = primarySeries.map((obs, i) => ({
    timestamp: obs.timestamp,
    time: formatTime(obs.timestamp),
    primary: obs.value,
    secondary: secondarySeries[i]!.value,
  }));

  const canProject = tickIndex < maxTickIndex;

  if (showProjection && canProject) {
    const tailValues = primarySeries.slice(-PROJECTION_TAIL_POINTS).map((o) => o.value);
    const { slope, intercept } = linearRegression(tailValues);
    const stepsAhead = Math.min(PROJECTION_STEPS, maxTickIndex - tickIndex);
    const lastReal = data[data.length - 1]!;
    lastReal.projected = lastReal.primary;

    const lastTimestampMs = new Date(lastReal.timestamp).getTime();
    for (let step = 1; step <= stepsAhead; step++) {
      const x = tailValues.length - 1 + step;
      const timestamp = new Date(lastTimestampMs + step * STEP_MINUTES * 60_000).toISOString();
      data.push({
        timestamp,
        time: formatTime(timestamp),
        projected: intercept + slope * x,
      });
    }
  }

  const primaryDomain = useMemo(() => {
    const values = primarySeries.map((o) => o.value);
    if (showProjection && canProject) {
      for (const point of data) if (point.projected !== undefined) values.push(point.projected);
    }
    return paddedDomain(values);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [primarySeries, showProjection, canProject]);
  const secondaryDomain = useMemo(() => paddedDomain(secondarySeries.map((o) => o.value)), [secondarySeries]);

  const medicationEvent = events.find((e) => e.type === "medication");
  const nowTimestamp = formatTime(primarySeries[primarySeries.length - 1]!.timestamp);

  return (
    <div className="panel flex h-full flex-col">
      <div className="panel-header">
        <div>
          <p className="text-sm font-medium text-ink-primary">
            {primaryDef.label} &amp; {secondaryDef.label}
          </p>
          <p className="text-[11px] text-ink-tertiary">
            {showProjection && canProject
              ? "Dashed line is a synthetic linear projection, not a clinical forecast"
              : "Hover a point for the nearest recorded event"}
          </p>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-ink-tertiary">
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: colors.signal.critical }} />
            {primaryDef.label}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: colors.synapse.DEFAULT }} />
            {secondaryDef.label}
          </span>
          {canProject && (
            <button
              onClick={() => setShowProjection((v) => !v)}
              className={clsx(
                "flex items-center gap-1.5 rounded-full border px-2 py-0.5 transition-colors duration-150 ease-product",
                showProjection
                  ? "border-synapse bg-synapse-dim text-synapse-bright"
                  : "border-base-400 text-ink-tertiary hover:text-ink-secondary"
              )}
            >
              <TrendingUpDown className="h-3 w-3" />
              Projection
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 px-2 py-3">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
            <CartesianGrid stroke={colors.base[400]} vertical={false} />
            <XAxis
              dataKey="time"
              stroke={colors.ink.faint}
              tick={{ fill: colors.ink.tertiary, fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: colors.base[400] }}
              minTickGap={24}
            />
            <YAxis
              yAxisId="primary"
              domain={primaryDomain}
              tick={{ fill: colors.ink.tertiary, fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={32}
            />
            <YAxis
              yAxisId="secondary"
              orientation="right"
              domain={secondaryDomain}
              tick={{ fill: colors.ink.tertiary, fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={32}
            />
            <Tooltip content={<CustomTooltip events={events} primaryKind={primaryKind} secondaryKind={secondaryKind} />} />
            {medicationEvent && (
              <ReferenceLine
                yAxisId="primary"
                x={formatTime(medicationEvent.timestamp)}
                stroke={colors.signal.warning}
                strokeDasharray="3 3"
                strokeOpacity={0.6}
              />
            )}
            {showProjection && canProject && (
              <ReferenceLine
                yAxisId="primary"
                x={nowTimestamp}
                stroke={colors.ink.tertiary}
                strokeDasharray="2 4"
                strokeOpacity={0.5}
                label={{ value: "now", position: "insideTopRight", fill: colors.ink.tertiary, fontSize: 10 }}
              />
            )}
            <Line
              yAxisId="primary"
              type="monotone"
              dataKey="primary"
              stroke={colors.signal.critical}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
              isAnimationActive={false}
            />
            <Line
              yAxisId="secondary"
              type="monotone"
              dataKey="secondary"
              stroke={colors.synapse.DEFAULT}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
              isAnimationActive={false}
            />
            {showProjection && canProject && (
              <Line
                yAxisId="primary"
                type="monotone"
                dataKey="projected"
                stroke={colors.ink.secondary}
                strokeWidth={2}
                strokeDasharray="5 4"
                dot={false}
                activeDot={{ r: 4 }}
                isAnimationActive={false}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
