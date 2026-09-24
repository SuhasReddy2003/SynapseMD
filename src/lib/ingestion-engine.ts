import { POINT_COUNT } from "@/lib/mock-data";
import type { ClinicalEvent, ClinicalEventType, VitalKind, VitalObservation } from "@/lib/types";
import type { SeverityLevel } from "@/lib/design-tokens";

type SeriesMap = Record<VitalKind, VitalObservation[]>;

interface IngestionTemplate {
  type: ClinicalEventType;
  title: string;
  description: string;
  sourceText: string;
  highlight: string;
  severity: SeverityLevel;
}

// A small pool of plausible incoming documents. Cycled deterministically —
// never random — so repeated ingestion runs stay reproducible.
const ingestionTemplates: IngestionTemplate[] = [
  {
    type: "radiology",
    title: "Repeat chest X-ray reviewed",
    description: "Follow-up imaging shows no new findings.",
    sourceText:
      "Radiology addendum: Repeat portable CXR shows unchanged mild bibasilar atelectasis, no new consolidation or effusion.",
    highlight: "no new consolidation",
    severity: "neutral",
  },
  {
    type: "note",
    title: "Cardiology consult note",
    description: "Cardiology recommends continued telemetry monitoring.",
    sourceText:
      "Cardiology consult: Seen for post-op rhythm monitoring. Recommend continued telemetry and daily electrolyte panels through post-op day 4.",
    highlight: "continued telemetry",
    severity: "neutral",
  },
  {
    type: "medication",
    title: "Potassium correction held",
    description: "Pharmacy order placed pending repeat lab confirmation.",
    sourceText:
      "Pharmacy order: Potassium chloride 20 mEq IV placed on hold pending repeat level, given recent upward trend.",
    highlight: "placed on hold pending repeat level",
    severity: "warning",
  },
  {
    type: "lab",
    title: "Repeat potassium result",
    description: "Follow-up level drawn after the earlier flagged reading.",
    sourceText: "Lab result: Repeat potassium 5.4 mmol/L, downtrending from prior critical reading.",
    highlight: "downtrending from prior critical reading",
    severity: "warning",
  },
];

export const ingestionStageLabels = [
  "Parsing",
  "Entity extraction",
  "Terminology mapping",
  "Temporal linking",
  "Evidence graph update",
  "Success",
] as const;

function lastRecordedTimestamp(series: SeriesMap): number {
  return new Date(series.heartRate[POINT_COUNT - 1]!.timestamp).getTime();
}

/**
 * Builds the ClinicalEvent a simulated ingestion run produces. Deterministic:
 * the same sequence number always produces the same event and timestamp.
 */
export function buildIngestedEvent(sequenceNumber: number, patientId: string, series: SeriesMap): ClinicalEvent {
  const template = ingestionTemplates[sequenceNumber % ingestionTemplates.length]!;
  const timestamp = new Date(lastRecordedTimestamp(series) + (sequenceNumber + 1) * 15 * 60_000).toISOString();

  return {
    id: `ingested-${patientId}-${sequenceNumber}`,
    patientId,
    type: template.type,
    title: template.title,
    description: template.description,
    timestamp,
    severity: template.severity,
    sourceText: template.sourceText,
    highlight: template.highlight,
  };
}
