import type { SeverityLevel } from "@/lib/design-tokens";

export interface Patient {
  id: string;
  name: string;
  age: number;
  encounterLabel: string;
}

export type VitalKind =
  | "heartRate"
  | "spo2"
  | "map"
  | "temperature"
  | "potassium";

export interface VitalDefinition {
  kind: VitalKind;
  label: string;
  unit: string;
  /** [low, high] — inside this band a reading is "normal". */
  normalRange: [number, number];
  /** Beyond this band a reading becomes "critical" rather than "warning". */
  criticalBeyond: [number, number];
  decimals: number;
}

export interface VitalObservation {
  id: string;
  patientId: string;
  kind: VitalKind;
  value: number;
  timestamp: string; // ISO 8601
}

export type ClinicalEventType =
  | "medication"
  | "lab"
  | "note"
  | "procedure"
  | "radiology"
  | "vital";

export interface ClinicalEvent {
  id: string;
  patientId: string;
  type: ClinicalEventType;
  title: string;
  description: string;
  timestamp: string; // ISO 8601
  severity: SeverityLevel;
  /** Raw synthetic source text this event was extracted from — shown in the reasoning drawer. */
  sourceText: string;
  /** Substring of sourceText to visually highlight as the relevant phrase. */
  highlight: string;
}

export interface SynapseIndexComponent {
  label: string;
  score: number; // 0-100
  level: SeverityLevel;
}

export interface SynapseIndexResult {
  score: number; // 0-100
  level: SeverityLevel;
  components: SynapseIndexComponent[];
}
