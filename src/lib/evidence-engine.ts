import type { SeverityLevel } from "@/lib/design-tokens";
import { latestObservation, seriesUpTo, severityForVital } from "@/lib/clinical-engine";
import { patient, vitalDefinitions, vitalSeries } from "@/lib/mock-data";
import type { ClinicalEvent, Patient, VitalKind, VitalObservation } from "@/lib/types";

type SeriesMap = Record<VitalKind, VitalObservation[]>;

export type EvidenceNodeKind = "signal" | "event" | "observation" | "context";

export interface EvidenceNode {
  id: string;
  kind: EvidenceNodeKind;
  label: string;
  sublabel: string;
  severity: SeverityLevel;
  sourceText: string;
  highlight: string;
  /** When present, this node is backed by a real ClinicalEvent and can show a full reasoning trace. */
  linkedEvent?: ClinicalEvent;
}

export interface EvidenceEdge {
  id: string;
  source: string;
  target: string;
  label: string;
}

export interface EvidenceGraph {
  focusVital: VitalKind;
  nodes: EvidenceNode[];
  edges: EvidenceEdge[];
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

const severityRank: Record<SeverityLevel, number> = { critical: 2, warning: 1, normal: 0, neutral: 0 };

/** The vital currently furthest from normal — what the evidence graph centers on. */
export function worstVitalKind(tickIndex: number, series: SeriesMap = vitalSeries): VitalKind {
  const kinds: VitalKind[] = ["potassium", "map", "heartRate", "spo2", "temperature"];
  return kinds.reduce((worst, kind) => {
    const level = severityForVital(kind, latestObservation(kind, tickIndex, series).value);
    const worstLevel = severityForVital(worst, latestObservation(worst, tickIndex, series).value);
    return severityRank[level] > severityRank[worstLevel] ? kind : worst;
  }, kinds[0]!);
}

/**
 * Builds the evidence relationships behind the current worst signal — the
 * same "every claim traces to a record" requirement the reasoning drawer
 * satisfies for individual events, applied to a signal as a whole.
 */
export function buildEvidenceGraph(
  tickIndex: number,
  events: ClinicalEvent[],
  series: SeriesMap = vitalSeries,
  patientMeta: Patient = patient
): EvidenceGraph {
  const kind = worstVitalKind(tickIndex, series);
  const def = vitalDefinitions[kind];
  const revealed = seriesUpTo(kind, tickIndex, series);
  const current = revealed[revealed.length - 1]!;
  const baseline = revealed[0]!;
  const level = severityForVital(kind, current.value);

  const linkedSignalEvent = events.find((e) => e.type === "vital" && e.severity === "critical");
  const medicationEvent = events.find((e) => e.type === "medication");
  const noteEvent = events.find((e) => e.type === "note");

  const nodes: EvidenceNode[] = [
    {
      id: "signal",
      kind: "signal",
      label: `${def.label} ${current.value.toFixed(def.decimals)} ${def.unit}`,
      sublabel: level === "critical" ? "Critical signal" : level === "warning" ? "Warning signal" : "Signal",
      severity: level,
      sourceText:
        linkedSignalEvent?.sourceText ??
        `Monitor reading: ${def.label} ${current.value.toFixed(def.decimals)} ${def.unit} recorded at ${formatTime(current.timestamp)}.`,
      highlight: linkedSignalEvent?.highlight ?? `${current.value.toFixed(def.decimals)} ${def.unit}`,
      linkedEvent: linkedSignalEvent,
    },
    {
      id: "observation",
      kind: "observation",
      label: "Current observation",
      sublabel: formatTime(current.timestamp),
      severity: level,
      sourceText: `Monitor reading: ${def.label} ${current.value.toFixed(def.decimals)} ${def.unit} recorded at ${formatTime(current.timestamp)}.`,
      highlight: `${current.value.toFixed(def.decimals)} ${def.unit}`,
    },
    {
      id: "previous",
      kind: "observation",
      label: `Previous ${def.label.toLowerCase()}`,
      sublabel: formatTime(baseline.timestamp),
      severity: "neutral",
      sourceText: `Monitor reading: ${def.label} ${baseline.value.toFixed(def.decimals)} ${def.unit} recorded at ${formatTime(baseline.timestamp)}, prior to the current trend.`,
      highlight: `${baseline.value.toFixed(def.decimals)} ${def.unit}`,
    },
    {
      id: "encounter",
      kind: "context",
      label: "Encounter",
      sublabel: patientMeta.encounterLabel,
      severity: "neutral",
      sourceText: `Encounter record: ${patientMeta.name}, ${patientMeta.age}, ${patientMeta.encounterLabel}.`,
      highlight: patientMeta.encounterLabel,
    },
  ];

  if (medicationEvent) {
    nodes.push({
      id: "medication",
      kind: "event",
      label: medicationEvent.title,
      sublabel: formatTime(medicationEvent.timestamp),
      severity: medicationEvent.severity,
      sourceText: medicationEvent.sourceText,
      highlight: medicationEvent.highlight,
      linkedEvent: medicationEvent,
    });
  }

  if (noteEvent) {
    nodes.push({
      id: "note",
      kind: "event",
      label: noteEvent.title,
      sublabel: formatTime(noteEvent.timestamp),
      severity: noteEvent.severity,
      sourceText: noteEvent.sourceText,
      highlight: noteEvent.highlight,
      linkedEvent: noteEvent,
    });
  }

  const edgeLabel: Record<string, string> = {
    observation: "measured as",
    previous: "compared to",
    encounter: "occurs during",
    medication: "temporally follows",
    note: "documented alongside",
  };

  const edges: EvidenceEdge[] = nodes
    .filter((n) => n.id !== "signal")
    .map((n) => ({ id: `signal-${n.id}`, source: "signal", target: n.id, label: edgeLabel[n.id] ?? "relates to" }));

  return { focusVital: kind, nodes, edges };
}
