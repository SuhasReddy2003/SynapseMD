import type {
  ClinicalEvent,
  Patient,
  PatientDataset,
  VitalDefinition,
  VitalKind,
  VitalObservation,
} from "@/lib/types";

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

// Shared telemetry window for every patient: Day-of-admission, 00:00 -> 12:00,
// sampled every 30 minutes. Sharing the window keeps the time selectors and
// tick-based "as revealed so far" mechanics identical across patients.
const WINDOW_START = new Date("2026-01-15T00:00:00Z").getTime();
export const STEP_MINUTES = 30;
export const POINT_COUNT = 25; // inclusive of both endpoints

export function timestampFor(index: number): string {
  return new Date(WINDOW_START + index * STEP_MINUTES * 60_000).toISOString();
}

function round(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function buildSeries(
  patientId: string,
  kind: VitalKind,
  valueFn: (index: number) => number
): VitalObservation[] {
  const def = vitalDefinitions[kind];
  return Array.from({ length: POINT_COUNT }, (_, index) => ({
    id: `${patientId}-${kind}-${index}`,
    patientId,
    kind,
    value: round(valueFn(index), def.decimals),
    timestamp: timestampFor(index),
  }));
}

function buildAllSeries(
  patientId: string,
  valueFns: Record<VitalKind, (index: number) => number>
): Record<VitalKind, VitalObservation[]> {
  return {
    heartRate: buildSeries(patientId, "heartRate", valueFns.heartRate),
    spo2: buildSeries(patientId, "spo2", valueFns.spo2),
    map: buildSeries(patientId, "map", valueFns.map),
    temperature: buildSeries(patientId, "temperature", valueFns.temperature),
    potassium: buildSeries(patientId, "potassium", valueFns.potassium),
  };
}

// ---------------------------------------------------------------------------
// Patient A — Arthur Pendelton — post-operative cardiac recovery.
// Narrative: potassium rises after ACE-inhibitor initiation.
// ---------------------------------------------------------------------------

const pendeltonPatient: Patient = {
  id: "arthur-pendelton",
  name: "Arthur Pendelton",
  age: 68,
  encounterLabel: "Post-CABG · Day 2",
};

const MEDICATION_INDEX = 8; // 04:00 — Lisinopril administered

const pendeltonSeries = buildAllSeries(pendeltonPatient.id, {
  heartRate: (i) => 82 + 3 * Math.sin(i / 3),
  spo2: (i) => 97 + Math.sin(i / 5) * 0.8,
  map: (i) => 82 - 8 * (i / (POINT_COUNT - 1)) + Math.sin(i / 2) * 0.6,
  temperature: (i) => 37.2 + 0.15 * Math.sin(i / 4),
  potassium: (i) =>
    i <= MEDICATION_INDEX
      ? 4.9 + 0.05 * Math.sin(i / 2)
      : 4.9 + 0.7 * ((i - MEDICATION_INDEX) / (POINT_COUNT - 1 - MEDICATION_INDEX)),
});

const pendeltonEvents: ClinicalEvent[] = [
  {
    id: "evt-closure-0000",
    patientId: pendeltonPatient.id,
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
    patientId: pendeltonPatient.id,
    type: "lab",
    title: "Basic metabolic panel drawn",
    description: "Routine post-operative panel, sample sent to lab.",
    timestamp: timestampFor(2),
    severity: "neutral",
    sourceText: "Lab: BMP collected 01:00. Potassium pending, creatinine 1.1 mg/dL, stable from baseline.",
    highlight: "Potassium pending",
  },
  {
    id: "evt-cxr-0200",
    patientId: pendeltonPatient.id,
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
    patientId: pendeltonPatient.id,
    type: "medication",
    title: "Lisinopril 10 mg administered",
    description: "ACE inhibitor given per post-CABG titration protocol.",
    timestamp: timestampFor(MEDICATION_INDEX),
    severity: "warning",
    sourceText: "MAR: Lisinopril 10 mg PO administered per post-CABG titration protocol at 04:00.",
    highlight: "Lisinopril 10 mg PO administered",
  },
  {
    id: "evt-hr-trend-0500",
    patientId: pendeltonPatient.id,
    type: "vital",
    title: "Heart rate trend stable",
    description: "Telemetry review found no arrhythmia over the prior two hours.",
    timestamp: timestampFor(10),
    severity: "normal",
    sourceText: "Telemetry: HR trending 78-86 bpm over past 2 hours, no arrhythmia detected.",
    highlight: "no arrhythmia detected",
  },
  {
    id: "evt-note-0600",
    patientId: pendeltonPatient.id,
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
    patientId: pendeltonPatient.id,
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
    patientId: pendeltonPatient.id,
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
    patientId: pendeltonPatient.id,
    type: "vital",
    title: "Potassium level flagged critical",
    description: "Monitor auto-flagged the current reading for clinician review.",
    timestamp: timestampFor(24),
    severity: "critical",
    sourceText: "Monitor alert: potassium reading 5.6 mmol/L exceeds critical threshold; auto-flagged for clinician review.",
    highlight: "exceeds critical threshold",
  },
];

// ---------------------------------------------------------------------------
// Patient B — Renata Osei — respiratory deterioration.
// Narrative: community-acquired pneumonia, progressive desaturation.
// ---------------------------------------------------------------------------

const oseiPatient: Patient = {
  id: "renata-osei",
  name: "Renata Osei",
  age: 58,
  encounterLabel: "Pneumonia · Hospital Day 3",
};

const oseiSeries = buildAllSeries(oseiPatient.id, {
  heartRate: (i) => 86 + 18 * (i / (POINT_COUNT - 1)) + 2 * Math.sin(i / 3),
  spo2: (i) => 96 - 7 * (i / (POINT_COUNT - 1)) + 0.5 * Math.sin(i / 4),
  map: (i) => 80 + 2 * Math.sin(i / 5),
  temperature: (i) => 37.0 + 1.6 * (i / (POINT_COUNT - 1)) + 0.1 * Math.sin(i / 3),
  potassium: (i) => 4.1 + 0.05 * Math.sin(i / 3),
});

const oseiEvents: ClinicalEvent[] = [
  {
    id: "evt-osei-admission-0000",
    patientId: oseiPatient.id,
    type: "procedure",
    title: "Admission respiratory assessment",
    description: "Baseline respiratory exam documented on admission.",
    timestamp: timestampFor(0),
    severity: "neutral",
    sourceText: "Admission note: crackles noted at bilateral bases, mild increased work of breathing.",
    highlight: "increased work of breathing",
  },
  {
    id: "evt-osei-cultures-0100",
    patientId: oseiPatient.id,
    type: "lab",
    title: "Blood cultures drawn",
    description: "Cultures sent prior to first antibiotic dose.",
    timestamp: timestampFor(2),
    severity: "neutral",
    sourceText: "Lab: Blood cultures x2 sent prior to antibiotic administration.",
    highlight: "prior to antibiotic administration",
  },
  {
    id: "evt-osei-cxr-0200",
    patientId: oseiPatient.id,
    type: "radiology",
    title: "Chest X-ray reviewed",
    description: "Imaging consistent with community-acquired pneumonia.",
    timestamp: timestampFor(4),
    severity: "warning",
    sourceText: "Radiology: Chest X-ray shows right lower lobe consolidation consistent with pneumonia.",
    highlight: "right lower lobe consolidation",
  },
  {
    id: "evt-osei-ceftriaxone-0400",
    patientId: oseiPatient.id,
    type: "medication",
    title: "Ceftriaxone 1 g IV administered",
    description: "First dose given per community-acquired pneumonia protocol.",
    timestamp: timestampFor(MEDICATION_INDEX),
    severity: "warning",
    sourceText: "MAR: Ceftriaxone 1 g IV administered per community-acquired pneumonia protocol.",
    highlight: "Ceftriaxone 1 g IV administered",
  },
  {
    id: "evt-osei-o2-0500",
    patientId: oseiPatient.id,
    type: "procedure",
    title: "Supplemental oxygen increased",
    description: "Nasal cannula flow increased to maintain saturation.",
    timestamp: timestampFor(10),
    severity: "warning",
    sourceText: "Respiratory therapy: Oxygen increased from 2L to 4L nasal cannula to maintain saturation.",
    highlight: "Oxygen increased from 2L to 4L",
  },
  {
    id: "evt-osei-note-0600",
    patientId: oseiPatient.id,
    type: "note",
    title: "Nursing assessment",
    description: "Increased work of breathing noted on reassessment.",
    timestamp: timestampFor(12),
    severity: "warning",
    sourceText:
      "Nursing note 06:00: Increased work of breathing noted, using accessory muscles, encouraged incentive spirometry.",
    highlight: "Increased work of breathing",
  },
  {
    id: "evt-osei-repeat-cxr-1000",
    patientId: oseiPatient.id,
    type: "radiology",
    title: "Repeat chest X-ray reviewed",
    description: "Follow-up imaging shows progression from the prior study.",
    timestamp: timestampFor(20),
    severity: "warning",
    sourceText: "Radiology: Repeat chest X-ray shows worsening bilateral infiltrates compared to prior study.",
    highlight: "worsening bilateral infiltrates",
  },
  {
    id: "evt-osei-abg-1100",
    patientId: oseiPatient.id,
    type: "procedure",
    title: "Arterial blood gas drawn",
    description: "Drawn to directly assess oxygenation and ventilation.",
    timestamp: timestampFor(22),
    severity: "neutral",
    sourceText: "Respiratory therapy: ABG drawn to assess oxygenation status.",
    highlight: "assess oxygenation status",
  },
  {
    id: "evt-osei-desat-1200",
    patientId: oseiPatient.id,
    type: "vital",
    title: "SpO2 desaturation flagged",
    description: "Monitor auto-flagged the current reading for clinician review.",
    timestamp: timestampFor(24),
    severity: "critical",
    sourceText: "Monitor alert: SpO2 89% on 4L nasal cannula, below critical threshold; auto-flagged for clinician review.",
    highlight: "below critical threshold",
  },
];

// ---------------------------------------------------------------------------
// Patient C — Miguel Torres — metabolic / laboratory instability.
// Narrative: post-operative ileus with a resolving hypotensive, hypokalemic dip.
// ---------------------------------------------------------------------------

const torresPatient: Patient = {
  id: "miguel-torres",
  name: "Miguel Torres",
  age: 74,
  encounterLabel: "Post-op Ileus · Electrolyte Instability",
};

const torresSeries = buildAllSeries(torresPatient.id, {
  heartRate: (i) => 80 + 4 * Math.sin(i / 2.5),
  spo2: (i) => 97 + 0.5 * Math.sin(i / 4),
  map: (i) => 80 - 16 * Math.sin((i / (POINT_COUNT - 1)) * Math.PI),
  temperature: (i) => 37.1 + 0.1 * Math.sin(i / 4),
  potassium: (i) => 4.0 - 0.8 * Math.sin(i / 4),
});

const torresEvents: ClinicalEvent[] = [
  {
    id: "evt-torres-postop-0000",
    patientId: torresPatient.id,
    type: "procedure",
    title: "Post-op assessment reviewed",
    description: "Abdominal exam and NG tube placement documented.",
    timestamp: timestampFor(0),
    severity: "neutral",
    sourceText:
      "Post-operative note: abdomen distended, bowel sounds hypoactive, NG tube placed to low intermittent suction.",
    highlight: "NG tube placed to low intermittent suction",
  },
  {
    id: "evt-torres-lytes-0200",
    patientId: torresPatient.id,
    type: "lab",
    title: "Electrolyte panel drawn",
    description: "Baseline panel sent, results pending.",
    timestamp: timestampFor(4),
    severity: "neutral",
    sourceText: "Lab: Basic electrolyte panel collected, results pending.",
    highlight: "results pending",
  },
  {
    id: "evt-torres-fluids-0400",
    patientId: torresPatient.id,
    type: "medication",
    title: "IV fluids increased",
    description: "Maintenance rate increased for presumed third-spacing losses.",
    timestamp: timestampFor(MEDICATION_INDEX),
    severity: "warning",
    sourceText: "MAR: Maintenance IV fluids increased to 150 mL/hr for presumed third-spacing losses.",
    highlight: "increased to 150 mL/hr",
  },
  {
    id: "evt-torres-hypokalemia-0500",
    patientId: torresPatient.id,
    type: "lab",
    title: "Repeat electrolyte panel — hypokalemia noted",
    description: "Follow-up panel shows mild hypokalemia; repletion ordered.",
    timestamp: timestampFor(10),
    severity: "warning",
    sourceText: "Lab result: Potassium 3.3 mmol/L, mild hypokalemia; repletion ordered.",
    highlight: "mild hypokalemia",
  },
  {
    id: "evt-torres-hypotension-0600",
    patientId: torresPatient.id,
    type: "vital",
    title: "MAP trending downward, hypotension flagged",
    description: "Monitor auto-flagged the current reading for clinician review.",
    timestamp: timestampFor(12),
    severity: "critical",
    sourceText: "Monitor alert: MAP 64 mmHg, below critical threshold; auto-flagged for clinician review.",
    highlight: "below critical threshold",
  },
  {
    id: "evt-torres-kcl-0800",
    patientId: torresPatient.id,
    type: "medication",
    title: "Potassium chloride 20 mEq IV administered",
    description: "Repletion given in response to the hypokalemic result.",
    timestamp: timestampFor(16),
    severity: "warning",
    sourceText: "MAR: Potassium chloride 20 mEq IV administered for electrolyte repletion.",
    highlight: "Potassium chloride 20 mEq IV administered",
  },
  {
    id: "evt-torres-note-1000",
    patientId: torresPatient.id,
    type: "note",
    title: "Nursing assessment",
    description: "Hemodynamics and bowel function trending toward baseline.",
    timestamp: timestampFor(20),
    severity: "neutral",
    sourceText: "Nursing note: Abdominal distension improved, bowel sounds present in all quadrants, blood pressure stabilizing.",
    highlight: "blood pressure stabilizing",
  },
  {
    id: "evt-torres-repeat-lytes-1200",
    patientId: torresPatient.id,
    type: "lab",
    title: "Repeat electrolyte panel drawn",
    description: "Follow-up panel sent to confirm repletion response.",
    timestamp: timestampFor(24),
    severity: "neutral",
    sourceText: "Lab: Repeat electrolyte panel collected to reassess repletion response.",
    highlight: "reassess repletion response",
  },
];

// ---------------------------------------------------------------------------

export const patientDatasets: PatientDataset[] = [
  { patient: pendeltonPatient, vitalSeries: pendeltonSeries, clinicalEvents: pendeltonEvents },
  { patient: oseiPatient, vitalSeries: oseiSeries, clinicalEvents: oseiEvents },
  { patient: torresPatient, vitalSeries: torresSeries, clinicalEvents: torresEvents },
];

export function datasetForPatientId(patientId: string): PatientDataset {
  return patientDatasets.find((d) => d.patient.id === patientId) ?? patientDatasets[0]!;
}

// Backward-compatible defaults — the landing page's illustrative preview and
// any engine function called without an explicit dataset use Patient A.
export const patient = patientDatasets[0]!.patient;
export const vitalSeries = patientDatasets[0]!.vitalSeries;
export const clinicalEvents = patientDatasets[0]!.clinicalEvents;
