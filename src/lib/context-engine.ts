import type { SeverityLevel } from "@/lib/design-tokens";
import { latestObservation, seriesUpTo, severityForVital } from "@/lib/clinical-engine";
import { vitalDefinitions } from "@/lib/mock-data";
import type { ClinicalEvent, VitalKind, VitalObservation } from "@/lib/types";

type SeriesMap = Record<VitalKind, VitalObservation[]>;

export interface ContextGap {
  id: string;
  severity: SeverityLevel;
  title: string;
  description: string;
  /** What the record would need to contain for this gap to close. */
  missing: string[];
  /** Real records the gap is grounded in. */
  evidence: ClinicalEvent[];
  /** Observation-level source text, for gaps that come from a vital trend rather than an event. */
  observation?: { label: string; sourceText: string; highlight: string };
}

const ALL_KINDS: VitalKind[] = ["potassium", "spo2", "map", "heartRate", "temperature"];

const keywords: Record<VitalKind, string[]> = {
  potassium: ["potassium", "k+", "electrolyte"],
  spo2: ["spo2", "saturation", "oxygen", "o2", "abg"],
  map: ["map ", "blood pressure", "hypotension", "fluids", "pressure"],
  heartRate: ["heart rate", "tachycardia", "telemetry", "rhythm"],
  temperature: ["temperature", "fever", "febrile", "culture"],
};

const REASON_MARKER = /\b(per|for|due to|because|pending|after|given|to maintain|to reassess)\b/i;
const DRIFT_WINDOW = 6;

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
}

function mentions(event: ClinicalEvent, kind: VitalKind): boolean {
  const text = `${event.title} ${event.description} ${event.sourceText}`.toLowerCase();
  return keywords[kind].some((k) => text.includes(k));
}

/** Records a clinician actually produced — monitor auto-alerts don't count as a response. */
function isClinicianRecord(event: ClinicalEvent): boolean {
  return !(event.type === "vital" && event.severity === "critical");
}

const severityRank: Record<SeverityLevel, number> = { critical: 0, warning: 1, neutral: 2, normal: 3 };

/**
 * Finds what the record is *missing* rather than what it contains: abnormal
 * readings with no follow-up, silent drift toward a limit, critical alerts
 * nobody has responded to, and medication changes with no stated reason.
 * Pure and deterministic — same inputs, same gaps.
 */
export function findMissingContext(tickIndex: number, events: ClinicalEvent[], series: SeriesMap): ContextGap[] {
  const gaps: ContextGap[] = [];

  for (const kind of ALL_KINDS) {
    const def = vitalDefinitions[kind];
    const visible = seriesUpTo(kind, tickIndex, series);
    const current = latestObservation(kind, tickIndex, series);
    const level = severityForVital(kind, current.value);

    if (level !== "normal") {
      // When did this vital last leave the normal band and stay out?
      let crossing = visible.length - 1;
      while (crossing > 0 && severityForVital(kind, visible[crossing - 1]!.value) !== "normal") crossing--;
      const crossedAt = visible[crossing]!;
      const followUps = events.filter(
        (e) => isClinicianRecord(e) && e.timestamp >= crossedAt.timestamp && mentions(e, kind)
      );
      if (followUps.length === 0) {
        gaps.push({
          id: `no-follow-up-${kind}`,
          severity: level === "critical" ? "critical" : "warning",
          title: `${def.label} outside normal range with no related follow-up`,
          description: `${def.label} has been outside its normal band since ${formatTime(crossedAt.timestamp)} (${crossedAt.value.toFixed(def.decimals)} → ${current.value.toFixed(def.decimals)} ${def.unit}). No lab, note, order or procedure since then refers to it.`,
          missing: [
            `A record after ${formatTime(crossedAt.timestamp)} that references ${def.label.toLowerCase()}`,
            "A documented clinician assessment or plan for this reading",
          ],
          evidence: [],
          observation: {
            label: `${def.label} observation`,
            sourceText: `Monitor readings: ${def.label} ${crossedAt.value.toFixed(def.decimals)} ${def.unit} at ${formatTime(crossedAt.timestamp)}, now ${current.value.toFixed(def.decimals)} ${def.unit}.`,
            highlight: `${current.value.toFixed(def.decimals)} ${def.unit}`,
          },
        });
      }
    } else if (visible.length > DRIFT_WINDOW) {
      // Silent drift: still "normal", but heading for a limit with nothing on record acknowledging it.
      const start = visible[visible.length - 1 - DRIFT_WINDOW]!;
      const delta = current.value - start.value;
      const [low, high] = def.normalRange;
      const band = high - low;
      const headroom = delta > 0 ? high - current.value : current.value - low;
      const window = visible.slice(-1 - DRIFT_WINDOW);
      const steps = window.slice(1).map((o, i) => o.value - window[i]!.value);
      const direction = Math.sign(delta);
      // Sensor wobble isn't a trend: no step may run against the direction, and most must run with it.
      const isSteady =
        steps.every((s) => s * direction >= 0) && steps.filter((s) => s * direction > 0).length >= 3;
      const acknowledged = events.some(
        (e) => isClinicianRecord(e) && e.timestamp >= start.timestamp && mentions(e, kind)
      );
      if (isSteady && Math.abs(delta) >= 0.12 * band && headroom <= 0.5 * band && !acknowledged) {
        gaps.push({
          id: `silent-drift-${kind}`,
          severity: "warning",
          title: `${def.label} drifting toward its limit, unacknowledged`,
          description: `${def.label} moved ${delta > 0 ? "+" : ""}${delta.toFixed(def.decimals)} ${def.unit} over the last ${DRIFT_WINDOW} readings and is still in range, but nothing in the record mentions the trend.`,
          missing: [`Any note, lab or order acknowledging the ${def.label.toLowerCase()} trend`],
          evidence: [],
          observation: {
            label: `${def.label} trend`,
            sourceText: `Monitor readings: ${def.label} ${start.value.toFixed(def.decimals)} ${def.unit} at ${formatTime(start.timestamp)}, now ${current.value.toFixed(def.decimals)} ${def.unit}.`,
            highlight: `${current.value.toFixed(def.decimals)} ${def.unit}`,
          },
        });
      }
    }
  }

  // Critical monitor alerts with no clinician record after them.
  for (const alert of events.filter((e) => e.type === "vital" && e.severity === "critical")) {
    const responded = events.some((e) => e.timestamp > alert.timestamp && isClinicianRecord(e));
    if (!responded) {
      gaps.push({
        id: `no-response-${alert.id}`,
        severity: "critical",
        title: "Critical alert with no documented response",
        description: `"${alert.title}" at ${formatTime(alert.timestamp)} has no clinician-authored record after it yet.`,
        missing: ["A note, order, lab or procedure after the alert", "Who reviewed it, and what was decided"],
        evidence: [alert],
      });
    }
  }

  // Medication events that never say why.
  for (const med of events.filter((e) => e.type === "medication")) {
    if (REASON_MARKER.test(med.sourceText)) continue;
    const drug = med.title.split(" ")[0]!.toLowerCase();
    const explained = events.some(
      (e) =>
        e.id !== med.id &&
        e.type !== "vital" &&
        Math.abs(new Date(e.timestamp).getTime() - new Date(med.timestamp).getTime()) <= 60 * 60_000 &&
        `${e.title} ${e.sourceText}`.toLowerCase().includes(drug)
    );
    if (!explained) {
      gaps.push({
        id: `no-reason-${med.id}`,
        severity: "warning",
        title: "Medication change without a documented reason",
        description: `"${med.title}" at ${formatTime(med.timestamp)} has no stated indication in the available records.`,
        missing: ["An order note or nearby record giving the reason for this change"],
        evidence: [med],
      });
    }
  }

  return gaps.sort((a, b) => severityRank[a.severity] - severityRank[b.severity]);
}
