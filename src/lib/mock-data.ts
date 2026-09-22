import type {
  ClinicalEvent,
  Patient,
  VitalDefinition,
  VitalKind,
  VitalObservation,
} from "@/lib/types";

export const patient: Patient = {
  id: "arthur-pendelton",
  name: "Arthur Pendelton",
  age: 68,
  encounterLabel: "Post-CABG · Day 2",
};

export const vitalDefinitions: Record<VitalKind, VitalDefinition> = {
  heartRate: {
    kind: "heartRate",
    label: "Heart rate",
    unit: "bpm",
    normalRange: [60, 100],
    criticalBeyond: [45, 130],
    decimals: 0,
  },
  spo2: {
    kind: "spo2",
    label: "SpO2",
    unit: "%",
    normalRange: [95, 100],
    criticalBeyond: [90, 100],
    decimals: 0,
  },
  map: {
    kind: "map",
    label: "MAP",
    unit: "mmHg",
    normalRange: [75, 100],
    criticalBeyond: [65, 110],
    decimals: 0,
  },
  temperature: {
    kind: "temperature",
    label: "Temperature",
    unit: "°C",
    normalRange: [36.5, 38.0],
    criticalBeyond: [35.5, 39.5],
    decimals: 1,
  },
  potassium: {
    kind: "potassium",
    label: "Potassium",
    unit: "mmol/L",
    normalRange: [3.5, 5.0],
    criticalBeyond: [3.2, 5.4],
    decimals: 1,
  },
};

// Telemetry window: Day 2, 00:00 -> 12:00, sampled every 30 minutes.
const WINDOW_START = new Date("2026-01-15T00:00:00Z").getTime();
export const STEP_MINUTES = 30;
export const POINT_COUNT = 25; // inclusive of both endpoints
const MEDICATION_INDEX = 8; // 04:00 — Lisinopril administered

function timestampFor(index: number): string {
  return new Date(WINDOW_START + index * STEP_MINUTES * 60_000).toISOString();
}

function round(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function valueFor(kind: VitalKind, index: number): number {
  switch (kind) {
    case "heartRate":
      return 82 + 3 * Math.sin(index / 3);
    case "spo2":
      return 97 + Math.sin(index / 5) * 0.8;
    case "map":
      return 82 - 8 * (index / (POINT_COUNT - 1)) + Math.sin(index / 2) * 0.6;
    case "temperature":
      return 37.2 + 0.15 * Math.sin(index / 4);
    case "potassium":
      return index <= MEDICATION_INDEX
        ? 4.9 + 0.05 * Math.sin(index / 2)
        : 4.9 + 0.7 * ((index - MEDICATION_INDEX) / (POINT_COUNT - 1 - MEDICATION_INDEX));
  }
}

function buildSeries(kind: VitalKind): VitalObservation[] {
  const def = vitalDefinitions[kind];
  return Array.from({ length: POINT_COUNT }, (_, index) => ({
    id: `${kind}-${index}`,
    patientId: patient.id,
    kind,
    value: round(valueFor(kind, index), def.decimals),
    timestamp: timestampFor(index),
  }));
}

export const vitalSeries: Record<VitalKind, VitalObservation[]> = {
  heartRate: buildSeries("heartRate"),
  spo2: buildSeries("spo2"),
  map: buildSeries("map"),
  temperature: buildSeries("temperature"),
  potassium: buildSeries("potassium"),
};

export const clinicalEvents: ClinicalEvent[] = [
  {
    id: "evt-closure-0000",
    patientId: patient.id,
    type: "procedure",
    title: "CABG closure note reviewed",
    description: "Post-operative closure documentation reviewed on transfer to floor.",
    timestamp: timestampFor(0),
    severity: "neutral",
    sourceText:
      "Post-operative note: sternotomy closure intact, chest tubes patent, output 30 mL/hr serosanguinous.",
    highlight: "chest tubes patent",
  },
  {
    id: "evt-bmp-0100",
    patientId: patient.id,
    type: "lab",
    title: "Basic metabolic panel drawn",
    description: "Routine post-operative panel, sample sent to lab.",
    timestamp: timestampFor(2),
    severity: "neutral",
    sourceText:
      "Lab: BMP collected 01:00. Potassium pending, creatinine 1.1 mg/dL, stable from baseline.",
    highlight: "Potassium pending",
  },
  {
    id: "evt-cxr-0200",
    patientId: patient.id,
    type: "radiology",
    title: "Portable chest X-ray reviewed",
    description: "Routine post-operative imaging, no acute findings.",
    timestamp: timestampFor(4),
    severity: "neutral",
    sourceText:
      "Radiology: Portable CXR shows no pneumothorax, sternal wires in expected position, mild atelectasis at bases.",
    highlight: "no pneumothorax",
  },
  {
    id: "evt-lisinopril-0400",
    patientId: patient.id,
    type: "medication",
    title: "Lisinopril 10 mg administered",
    description: "ACE inhibitor given per post-CABG titration protocol.",
    timestamp: timestampFor(MEDICATION_INDEX),
    severity: "warning",
    sourceText:
      "MAR: Lisinopril 10 mg PO administered per post-CABG titration protocol at 04:00.",
    highlight: "Lisinopril 10 mg PO administered",
  },
  {
    id: "evt-hr-trend-0500",
    patientId: patient.id,
    type: "vital",
    title: "Heart rate trend stable",
    description: "Telemetry review found no arrhythmia over the prior two hours.",
    timestamp: timestampFor(10),
    severity: "normal",
    sourceText:
      "Telemetry: HR trending 78-86 bpm over past 2 hours, no arrhythmia detected.",
    highlight: "no arrhythmia detected",
  },
  {
    id: "evt-note-0600",
    patientId: patient.id,
    type: "note",
    title: "Nursing assessment",
    description: "Patient alert, oriented, incision sites clean and dry.",
    timestamp: timestampFor(12),
    severity: "neutral",
    sourceText:
      "Nursing note 06:00: Patient alert and oriented x3, incision sites clean/dry/intact, ambulated to chair with assist.",
    highlight: "clean/dry/intact",
  },
  {
    id: "evt-potassium-flag-1000",
    patientId: patient.id,
    type: "lab",
    title: "Potassium re-check ordered",
    description: "Follow-up level ordered after rising trend noted on monitor.",
    timestamp: timestampFor(20),
    severity: "warning",
    sourceText:
      "Lab order: STAT potassium re-check placed after telemetry flagged an upward trend on monitor review.",
    highlight: "upward trend",
  },
  {
    id: "evt-lead-reposition-1100",
    patientId: patient.id,
    type: "procedure",
    title: "Telemetry lead repositioned",
    description: "Lead adjusted after brief signal dropout; waveform confirmed adequate.",
    timestamp: timestampFor(22),
    severity: "neutral",
    sourceText:
      "Nursing procedure note: telemetry leads repositioned after signal dropout, waveform quality confirmed adequate afterward.",
    highlight: "waveform quality confirmed adequate",
  },
  {
    id: "evt-potassium-critical-1200",
    patientId: patient.id,
    type: "vital",
    title: "Potassium level flagged critical",
    description: "Monitor auto-flagged the current reading for clinician review.",
    timestamp: timestampFor(24),
    severity: "critical",
    sourceText:
      "Monitor alert: potassium reading 5.6 mmol/L exceeds critical threshold; auto-flagged for clinician review.",
    highlight: "exceeds critical threshold",
  },
];
