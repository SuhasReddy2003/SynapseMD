import type { SeverityLevel } from "@/lib/design-tokens";
import { computeSynapseIndex, eventsUpTo, latestObservation, severityForVital } from "@/lib/clinical-engine";
import { findMissingContext } from "@/lib/context-engine";
import { vitalDefinitions } from "@/lib/mock-data";
import { reasoningProvider } from "@/lib/reasoning-engine";
import type { PatientDataset, VitalKind } from "@/lib/types";

export type ActivityCategory = "record" | "signal" | "index" | "gap" | "hypothesis";

export interface ActivityEntry {
  id: string;
  tick: number;
  timestamp: string;
  category: ActivityCategory;
  tone: SeverityLevel | "info";
  text: string;
}

const KINDS: VitalKind[] = ["heartRate", "spo2", "map", "temperature", "potassium"];
const INDEX_STEP = 3;

interface Snapshot {
  levels: Record<VitalKind, SeverityLevel>;
  score: number;
  eventIds: Set<string>;
  gaps: Map<string, { title: string; severity: SeverityLevel }>;
  topHypothesis: string;
}

function snapshot(tick: number, d: PatientDataset): Snapshot {
  const events = eventsUpTo(tick, d.clinicalEvents, d.vitalSeries);
  return {
    levels: Object.fromEntries(
      KINDS.map((k) => [k, severityForVital(k, latestObservation(k, tick, d.vitalSeries).value)])
    ) as Record<VitalKind, SeverityLevel>,
    score: computeSynapseIndex(tick, events, d.vitalSeries).score,
    eventIds: new Set(events.map((e) => e.id)),
    gaps: new Map(
      findMissingContext(tick, events, d.vitalSeries).map((g) => [g.id, { title: g.title, severity: g.severity }])
    ),
    topHypothesis: reasoningProvider.generateHypotheses(tick, events, d.vitalSeries)[0]?.title ?? "",
  };
}

/**
 * What did the engine notice, tick by tick? Every entry is derived by diffing
 * two consecutive states of the record — so the feed is a pure function of
 * time: scrub backwards and it rewinds, scrub forwards and it replays.
 */
export function buildActivityFeed(tickIndex: number, d: PatientDataset, limit = 12): ActivityEntry[] {
  const entries: ActivityEntry[] = [];
  let prev = snapshot(0, d);

  for (let t = 1; t <= tickIndex; t++) {
    const now = snapshot(t, d);
    const timestamp = d.vitalSeries.heartRate[t]!.timestamp;
    const push = (category: ActivityCategory, tone: ActivityEntry["tone"], text: string, key: string) =>
      entries.push({ id: `${t}-${category}-${key}`, tick: t, timestamp, category, tone, text });

    for (const event of eventsUpTo(t, d.clinicalEvents, d.vitalSeries)) {
      if (!prev.eventIds.has(event.id)) push("record", "info", `Record added: ${event.title}`, event.id);
    }

    for (const kind of KINDS) {
      if (prev.levels[kind] !== now.levels[kind]) {
        const def = vitalDefinitions[kind];
        const value = latestObservation(kind, t, d.vitalSeries).value.toFixed(def.decimals);
        push("signal", now.levels[kind], `${def.label} moved ${prev.levels[kind]} → ${now.levels[kind]} (${value} ${def.unit})`, kind);
      }
    }

    if (Math.abs(now.score - prev.score) >= INDEX_STEP) {
      push("index", "info", `Synapse index ${prev.score} → ${now.score}`, "score");
    }

    for (const [id, gap] of now.gaps) {
      if (!prev.gaps.has(id)) push("gap", gap.severity, `Gap opened: ${gap.title}`, id);
    }
    for (const [id, gap] of prev.gaps) {
      if (!now.gaps.has(id)) push("gap", "normal", `Gap closed: ${gap.title}`, id);
    }

    if (now.topHypothesis !== prev.topHypothesis && now.topHypothesis) {
      push("hypothesis", "info", `Leading hypothesis is now “${now.topHypothesis}”`, "top");
    }

    prev = now;
  }

  return entries.reverse().slice(0, limit);
}
