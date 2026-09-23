import type { SeverityLevel } from "@/lib/design-tokens";
import { clinicalEvents, vitalDefinitions, vitalSeries } from "@/lib/mock-data";
import type {
  ClinicalDeltaResult,
  ClinicalEvent,
  MedicationDeltaEntry,
  SynapseIndexResult,
  VitalDeltaEntry,
  VitalKind,
  VitalObservation,
} from "@/lib/types";

/** Severity of a single reading, from the vital's defined normal/critical bands. */
export function severityForVital(kind: VitalKind, value: number): SeverityLevel {
  const def = vitalDefinitions[kind];
  const [normalLow, normalHigh] = def.normalRange;
  const [criticalLow, criticalHigh] = def.criticalBeyond;
  if (value >= normalLow && value <= normalHigh) return "normal";
  if (value >= criticalLow && value <= criticalHigh) return "warning";
  return "critical";
}

/**
 * The series visible "as of" a given tick index — this is what makes telemetry
 * feel live: as the tick advances, more of the deterministic series is revealed.
 */
export function seriesUpTo(kind: VitalKind, tickIndex: number): VitalObservation[] {
  return vitalSeries[kind].slice(0, tickIndex + 1);
}

export function latestObservation(kind: VitalKind, tickIndex: number): VitalObservation {
  const series = seriesUpTo(kind, tickIndex);
  return series[series.length - 1]!;
}

export function eventsUpTo(tickIndex: number): ClinicalEvent[] {
  const cutoff = vitalSeries.heartRate[tickIndex]?.timestamp;
  if (!cutoff) return clinicalEvents;
  return clinicalEvents.filter((e) => e.timestamp <= cutoff);
}

/** The clinical event whose timestamp is closest to the given one. */
export function nearestEvent(
  timestamp: string,
  events: ClinicalEvent[] = clinicalEvents
): ClinicalEvent | undefined {
  if (events.length === 0) return undefined;
  const target = new Date(timestamp).getTime();
  return events.reduce((closest, current) => {
    const closestDiff = Math.abs(new Date(closest.timestamp).getTime() - target);
    const currentDiff = Math.abs(new Date(current.timestamp).getTime() - target);
    return currentDiff < closestDiff ? current : closest;
  }, events[0]!);
}

function componentScore(kind: VitalKind, tickIndex: number): number {
  const value = latestObservation(kind, tickIndex).value;
  const def = vitalDefinitions[kind];
  const [normalLow, normalHigh] = def.normalRange;
  const [criticalLow, criticalHigh] = def.criticalBeyond;

  if (value >= normalLow && value <= normalHigh) return 100;

  const bandLow = value < normalLow ? criticalLow : normalHigh;
  const bandHigh = value < normalLow ? normalLow : criticalHigh;
  const span = Math.max(bandHigh - bandLow, 0.0001);
  const position = value < normalLow ? value - bandLow : bandHigh - value;
  const fraction = Math.min(Math.max(position / span, 0), 1);

  const isCritical = value < criticalLow || value > criticalHigh;
  return isCritical ? Math.round(15 * fraction) : Math.round(40 + 60 * fraction);
}

function levelForScore(score: number): SeverityLevel {
  if (score >= 80) return "normal";
  if (score >= 40) return "warning";
  return "critical";
}

const ALL_VITAL_KINDS: VitalKind[] = ["heartRate", "spo2", "map", "temperature", "potassium"];

/** How many of the patient's current vitals are outside the normal band, and how bad the worst one is. */
export function unresolvedSignals(tickIndex: number): { count: number; worst: SeverityLevel } {
  const levels = ALL_VITAL_KINDS.map((kind) => {
    const obs = latestObservation(kind, tickIndex);
    return severityForVital(kind, obs.value);
  });
  const count = levels.filter((l) => l !== "normal").length;
  const worst: SeverityLevel = levels.includes("critical")
    ? "critical"
    : levels.includes("warning")
      ? "warning"
      : "normal";
  return { count, worst };
}

/**
 * Synapse State Index — a synthetic, non-clinically-validated composite of
 * current vital stability. Not a diagnostic score.
 */
export function computeSynapseIndex(tickIndex: number): SynapseIndexResult {
  const hemodynamics = Math.round(
    (componentScore("heartRate", tickIndex) + componentScore("map", tickIndex)) / 2
  );
  const oxygenation = componentScore("spo2", tickIndex);
  const laboratoryStability = componentScore("potassium", tickIndex);
  const recentEvents = eventsUpTo(tickIndex).some((e) => e.severity === "warning" || e.severity === "critical")
    ? 65
    : 95;

  const score = Math.round(
    hemodynamics * 0.35 + oxygenation * 0.25 + laboratoryStability * 0.3 + recentEvents * 0.1
  );

  return {
    score,
    level: levelForScore(score),
    components: [
      { label: "Hemodynamics", score: hemodynamics, level: levelForScore(hemodynamics) },
      { label: "Oxygenation", score: oxygenation, level: levelForScore(oxygenation) },
      { label: "Laboratory stability", score: laboratoryStability, level: levelForScore(laboratoryStability) },
      { label: "Recent events", score: recentEvents, level: levelForScore(recentEvents) },
    ],
  };
}

const ALL_VITAL_KINDS_DELTA: VitalKind[] = ["heartRate", "spo2", "map", "temperature", "potassium"];

/**
 * Compares two points in the patient's revealed record — "What Changed".
 * Both indices must be <= the current tick; the earlier one is always treated as "from".
 */
export function buildClinicalDelta(indexA: number, indexB: number): ClinicalDeltaResult {
  const [fromIndex, toIndex] = indexA <= indexB ? [indexA, indexB] : [indexB, indexA];
  const fromTimestamp = vitalSeries.heartRate[fromIndex]!.timestamp;
  const toTimestamp = vitalSeries.heartRate[toIndex]!.timestamp;

  const vitals: VitalDeltaEntry[] = ALL_VITAL_KINDS_DELTA.map((kind) => {
    const def = vitalDefinitions[kind];
    const from = latestObservation(kind, fromIndex);
    const to = latestObservation(kind, toIndex);
    return {
      kind,
      label: def.label,
      unit: def.unit,
      decimals: def.decimals,
      fromValue: from.value,
      toValue: to.value,
      fromSeverity: severityForVital(kind, from.value),
      toSeverity: severityForVital(kind, to.value),
      changed: Math.abs(to.value - from.value) > 0.001,
    };
  });

  const medications: MedicationDeltaEntry[] = clinicalEvents
    .filter((e) => e.type === "medication")
    .map((e) => ({
      eventId: e.id,
      label: e.title,
      fromPresent: e.timestamp <= fromTimestamp,
      toPresent: e.timestamp <= toTimestamp,
    }));

  return {
    fromTimestamp,
    toTimestamp,
    vitals,
    medications,
    eventCountFrom: eventsUpTo(fromIndex).length,
    eventCountTo: eventsUpTo(toIndex).length,
  };
}
