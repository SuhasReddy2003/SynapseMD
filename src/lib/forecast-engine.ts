import type { SeverityLevel } from "@/lib/design-tokens";
import { severityForVital } from "@/lib/clinical-engine";
import { STEP_MINUTES, vitalDefinitions } from "@/lib/mock-data";
import type { VitalKind, VitalObservation } from "@/lib/types";

type SeriesMap = Record<VitalKind, VitalObservation[]>;

export const HORIZON_WINDOW = 6;
const MIN_R2 = 0.6;
const MAX_STEPS_AHEAD = 16; // eight hours

export interface Trend {
  slope: number; // per reading
  intercept: number;
  /** How well a straight line explains the window, 0-1. Low means noise, not a trend. */
  r2: number;
}

/** Ordinary least squares over an evenly-spaced window. */
export function linearTrend(values: number[]): Trend {
  const n = values.length;
  const meanX = (n - 1) / 2;
  const meanY = values.reduce((a, b) => a + b, 0) / n;
  let sxy = 0;
  let sxx = 0;
  let syy = 0;
  values.forEach((y, x) => {
    sxy += (x - meanX) * (y - meanY);
    sxx += (x - meanX) ** 2;
    syy += (y - meanY) ** 2;
  });
  const slope = sxx === 0 ? 0 : sxy / sxx;
  const r2 = sxx === 0 || syy === 0 ? 0 : (sxy * sxy) / (sxx * syy);
  return { slope, intercept: meanY - slope * meanX, r2 };
}

export interface HorizonItem {
  kind: VitalKind;
  label: string;
  unit: string;
  decimals: number;
  current: number;
  /** Value at the start of the trend window — anchors the progress bar. */
  windowStart: number;
  slopePerHour: number;
  r2: number;
  direction: "worsening" | "recovering";
  /** The band this vital is heading for. */
  target: SeverityLevel;
  threshold: number;
  minutesAway: number;
}

/**
 * Where is each vital heading, and when does it get there? A deliberately
 * naive extrapolation of the last few readings: it only speaks when the
 * trend is steady (high R²) and the crossing is within twelve hours. It is a
 * demonstration of temporal reasoning, not a clinical forecast.
 */
export function buildHorizon(tickIndex: number, series: SeriesMap): HorizonItem[] {
  if (tickIndex < HORIZON_WINDOW - 1) return [];
  const items: HorizonItem[] = [];

  for (const kind of Object.keys(vitalDefinitions) as VitalKind[]) {
    const def = vitalDefinitions[kind];
    const window = series[kind].slice(tickIndex - HORIZON_WINDOW + 1, tickIndex + 1);
    const values = window.map((o) => o.value);
    const { slope, r2 } = linearTrend(values);
    const current = values[values.length - 1]!;
    if (r2 < MIN_R2 || Math.abs(slope) < 10 ** -(def.decimals + 1)) continue;

    const [normalLow, normalHigh] = def.normalRange;
    const [criticalLow, criticalHigh] = def.criticalBeyond;
    const rising = slope > 0;
    const level = severityForVital(kind, current);

    let threshold: number | undefined;
    let target: SeverityLevel | undefined;
    let direction: HorizonItem["direction"] = "worsening";

    if (level === "normal") {
      threshold = rising ? normalHigh : normalLow;
      target = "warning";
    } else if (current > normalHigh) {
      if (rising) {
        threshold = criticalHigh;
        target = "critical";
      } else {
        threshold = normalHigh;
        target = "normal";
        direction = "recovering";
      }
    } else if (current < normalLow) {
      if (!rising) {
        threshold = criticalLow;
        target = "critical";
      } else {
        threshold = normalLow;
        target = "normal";
        direction = "recovering";
      }
    }
    if (threshold === undefined || target === undefined || (level === "critical" && direction === "worsening")) continue;

    const stepsAway = (threshold - current) / slope;
    if (!(stepsAway > 0) || stepsAway > MAX_STEPS_AHEAD) continue;

    items.push({
      kind,
      label: def.label,
      unit: def.unit,
      decimals: def.decimals,
      current,
      windowStart: values[0]!,
      slopePerHour: slope * (60 / STEP_MINUTES),
      r2,
      direction,
      target,
      threshold,
      minutesAway: Math.round(stepsAway * STEP_MINUTES),
    });
  }

  return items.sort((a, b) => a.minutesAway - b.minutesAway);
}

export function formatEta(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
}
