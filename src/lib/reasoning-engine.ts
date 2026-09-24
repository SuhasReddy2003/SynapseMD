import { latestObservation, nearestEvent, nearestEventOfType, seriesUpTo, severityForVital } from "@/lib/clinical-engine";
import { worstVitalKind } from "@/lib/evidence-engine";
import { patient, vitalDefinitions, vitalSeries } from "@/lib/mock-data";
import type {
  ClinicalEvent,
  ClinicalEventType,
  ClinicalHypothesis,
  Patient,
  SBARReport,
  SBARSection,
  VitalKind,
  VitalObservation,
} from "@/lib/types";

type SeriesMap = Record<VitalKind, VitalObservation[]>;

export interface ReasoningStep {
  id: string;
  label: string;
  detail: string;
}

export const eventTypeLabel: Record<ClinicalEventType, string> = {
  medication: "medication",
  lab: "laboratory",
  note: "nursing note",
  procedure: "procedure",
  radiology: "radiology",
  vital: "vital sign",
};

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

const clamp = (n: number) => Math.round(Math.min(95, Math.max(4, n)));

interface HypothesisContext {
  events: ClinicalEvent[];
  current: VitalObservation;
  baseline: VitalObservation;
  /** Positive means "moving toward abnormal" regardless of which direction that is for this vital. */ 
  directionalDelta: number;
}

// Potassium — Patient A's narrative: does the medication explain the rise?
function hypothesesForPotassium(ctx: HypothesisContext): ClinicalHypothesis[] {
  const { events, current, baseline, directionalDelta: delta } = ctx;
  const medEvent = nearestEventOfType("medication", current.timestamp, events);
  const labEvent = nearestEventOfType("lab", baseline.timestamp, events);
  const repeatLabExists = events.filter((e) => e.type === "lab").length >= 2;
  const level = severityForVital("potassium", current.value);

  return [
    {
      id: "medication",
      title: "Medication-related signal",
      confidence: clamp(medEvent ? 45 + delta * 65 : 12),
      supportingEvidence: medEvent
        ? [
            `${medEvent.title} at ${formatTime(medEvent.timestamp)}, preceding the rise in potassium.`,
            `Potassium moved from ${baseline.value.toFixed(1)} to ${current.value.toFixed(1)} mmol/L after ${medEvent.title.toLowerCase()} — a recognized pharmacologic association.`,
          ]
        : [],
      contradictingEvidence: level === "normal" ? ["Potassium is currently within the normal range."] : [],
      missingInformation: [
        "No prior potassium response documented for this patient on this medication class.",
        "No renal-clearance trend available to confirm the mechanism.",
      ],
      temporalRelationships: medEvent
        ? [`${medEvent.title} at ${formatTime(medEvent.timestamp)}, before the current reading.`]
        : ["No medication event found in the visible window."],
    },
    {
      id: "renal",
      title: "Renal-function signal",
      confidence: clamp(35 - delta * 8),
      supportingEvidence: ["Patient is post-operative, a setting where transient renal changes can occur."],
      contradictingEvidence: labEvent ? [`${labEvent.title}: no acute renal abnormality documented.`] : [],
      missingInformation: [
        "No repeat creatinine drawn in this window to confirm a renal trend.",
        "No urine output record available.",
      ],
      temporalRelationships: labEvent
        ? [`${labEvent.title} at ${formatTime(labEvent.timestamp)}, before the potassium rise became apparent.`]
        : [],
    },
    {
      id: "measurement",
      title: "Measurement / sample issue",
      confidence: clamp(repeatLabExists ? 6 : 30 - delta * 15),
      supportingEvidence: repeatLabExists
        ? []
        : ["Elevated reading has not yet been confirmed by a repeat draw in this window."],
      contradictingEvidence: repeatLabExists
        ? ["A repeat lab draw was ordered specifically to confirm the trend, which argues against a one-off measurement error."]
        : [],
      missingInformation: repeatLabExists ? [] : ["Repeat draw result not yet available in this window."],
      temporalRelationships: [],
    },
    {
      id: "recent-event",
      title: "Recent clinical event",
      confidence: clamp(18 + delta * 12),
      supportingEvidence: ["The post-operative period is commonly associated with fluid and electrolyte shifts."],
      contradictingEvidence: ["No documented bleeding, transfusion, or arrhythmia directly implicating this mechanism."],
      missingInformation: ["No fluid-balance or transfusion record available in this window."],
      temporalRelationships: ["Encounter began before the observed window; no single triggering event identified."],
    },
  ];
}

// SpO2 — Patient B's narrative: infectious process vs. mechanical vs. device issue.
function hypothesesForSpo2(ctx: HypothesisContext): ClinicalHypothesis[] {
  const { events, current, directionalDelta: delta } = ctx;
  const radiologyEvent = nearestEventOfType("radiology", current.timestamp, events);
  const noteEvent = nearestEventOfType("note", current.timestamp, events);
  const confirmingStudyExists = events.filter((e) => e.type === "procedure").length >= 2;

  return [
    {
      id: "infectious",
      title: "Infectious / inflammatory process",
      confidence: clamp(radiologyEvent ? 50 + delta * 60 : 20),
      supportingEvidence: radiologyEvent
        ? [
            `${radiologyEvent.title} at ${formatTime(radiologyEvent.timestamp)} shows findings consistent with an infectious process.`,
            `SpO2 has trended downward alongside imaging changes — a pattern consistent with worsening pneumonia.`,
          ]
        : [],
      contradictingEvidence: [],
      missingInformation: ["No repeat culture result available to confirm organism and response to therapy."],
      temporalRelationships: radiologyEvent
        ? [`${radiologyEvent.title} at ${formatTime(radiologyEvent.timestamp)}, preceding the current reading.`]
        : [],
    },
    {
      id: "mechanical",
      title: "Airway / secretion burden",
      confidence: clamp(noteEvent ? 30 + delta * 30 : 18),
      supportingEvidence: noteEvent ? [`${noteEvent.title}: ${noteEvent.description}`] : [],
      contradictingEvidence: [],
      missingInformation: ["No spirometry or suction-frequency record available in this window."],
      temporalRelationships: noteEvent ? [`${noteEvent.title} at ${formatTime(noteEvent.timestamp)}.`] : [],
    },
    {
      id: "device",
      title: "Device or sensor issue",
      confidence: clamp(confirmingStudyExists ? 6 : 25 - delta * 10),
      supportingEvidence: confirmingStudyExists ? [] : ["Single desaturation reading not yet cross-checked against an arterial sample."],
      contradictingEvidence: confirmingStudyExists
        ? ["An arterial blood gas was drawn to directly verify oxygenation, which argues against a sensor artifact."]
        : [],
      missingInformation: confirmingStudyExists ? [] : ["Arterial blood gas result not yet available in this window."],
      temporalRelationships: [],
    },
    {
      id: "recent-event",
      title: "Recent clinical event",
      confidence: clamp(15 + delta * 15),
      supportingEvidence: ["Hospital day 3 of a pneumonia admission is a period where clinical status can still evolve."],
      contradictingEvidence: [],
      missingInformation: ["No fluid-balance record available in this window."],
      temporalRelationships: ["Encounter began before the observed window; no single triggering event identified."],
    },
  ];
}

// MAP — Patient C's narrative: volume status vs. medication vs. cardiac cause.
function hypothesesForMap(ctx: HypothesisContext): ClinicalHypothesis[] {
  const { events, current, directionalDelta: delta } = ctx;
  const fluidEvent = nearestEventOfType("medication", current.timestamp, events);
  const labEvent = nearestEventOfType("lab", current.timestamp, events);
  const repeatLabExists = events.filter((e) => e.type === "lab").length >= 2;

  return [
    {
      id: "volume",
      title: "Volume / fluid status",
      confidence: clamp(fluidEvent ? 48 + delta * 55 : 20),
      supportingEvidence: fluidEvent
        ? [`${fluidEvent.title} at ${formatTime(fluidEvent.timestamp)} — consistent with ongoing third-spacing losses.`]
        : [],
      contradictingEvidence: [],
      missingInformation: ["No central venous pressure or formal fluid-balance total available in this window."],
      temporalRelationships: fluidEvent
        ? [`${fluidEvent.title} at ${formatTime(fluidEvent.timestamp)}, before the current reading.`]
        : [],
    },
    {
      id: "electrolyte",
      title: "Electrolyte-mediated signal",
      confidence: clamp(labEvent ? 38 + delta * 30 : 18),
      supportingEvidence: labEvent ? [`${labEvent.title}: ${labEvent.description}`] : [],
      contradictingEvidence: [],
      missingInformation: ["No repeat electrolyte result confirmed after the most recent repletion."],
      temporalRelationships: labEvent ? [`${labEvent.title} at ${formatTime(labEvent.timestamp)}.`] : [],
    },
    {
      id: "measurement",
      title: "Measurement issue",
      confidence: clamp(repeatLabExists ? 6 : 22 - delta * 10),
      supportingEvidence: repeatLabExists ? [] : ["Reading has not yet been cross-checked against a repeat study."],
      contradictingEvidence: repeatLabExists
        ? ["Repeat lab work was drawn specifically to reassess this trend, which argues against a one-off artifact."]
        : [],
      missingInformation: repeatLabExists ? [] : ["Repeat confirmation not yet available in this window."],
      temporalRelationships: [],
    },
    {
      id: "recent-event",
      title: "Recent clinical event",
      confidence: clamp(16 + delta * 12),
      supportingEvidence: ["The post-operative period is commonly associated with hemodynamic shifts."],
      contradictingEvidence: [],
      missingInformation: ["No formal hemodynamic monitoring trend available in this window."],
      temporalRelationships: ["Encounter began before the observed window; no single triggering event identified."],
    },
  ];
}

// Fallback for a vital kind without a hand-authored narrative (heartRate, temperature).
function hypothesesGeneric(def: { label: string }, ctx: HypothesisContext): ClinicalHypothesis[] {
  const { events, current, directionalDelta: delta } = ctx;
  const medEvent = nearestEventOfType("medication", current.timestamp, events);

  return [
    {
      id: "medication",
      title: "Medication-related signal",
      confidence: clamp(medEvent ? 40 + delta * 50 : 15),
      supportingEvidence: medEvent ? [`${medEvent.title} at ${formatTime(medEvent.timestamp)}.`] : [],
      contradictingEvidence: [],
      missingInformation: [`No prior ${def.label.toLowerCase()} response documented for this patient.`],
      temporalRelationships: medEvent ? [`${medEvent.title} at ${formatTime(medEvent.timestamp)}.`] : [],
    },
    {
      id: "infectious",
      title: "Infectious / inflammatory process",
      confidence: clamp(20 + delta * 30),
      supportingEvidence: [],
      contradictingEvidence: [],
      missingInformation: ["No culture or inflammatory marker result available in this window."],
      temporalRelationships: [],
    },
    {
      id: "measurement",
      title: "Measurement issue",
      confidence: clamp(20 - delta * 10),
      supportingEvidence: [],
      contradictingEvidence: [],
      missingInformation: ["Repeat confirmation not yet available in this window."],
      temporalRelationships: [],
    },
    {
      id: "recent-event",
      title: "Recent clinical event",
      confidence: clamp(15 + delta * 10),
      supportingEvidence: ["This encounter is a period where clinical status can still evolve."],
      contradictingEvidence: [],
      missingInformation: ["No additional context available in this window."],
      temporalRelationships: [],
    },
  ];
}

/** For a given worst vital kind, "toward abnormal" is up for some vitals and down for others. */
const worsensUpward: Record<VitalKind, boolean> = {
  potassium: true,
  heartRate: true,
  temperature: true,
  spo2: false,
  map: false,
};

/**
 * The abstraction the UI talks to. It should never know whether reasoning
 * comes from deterministic local logic or a future LLM/medical-model backend.
 */
export interface ReasoningProvider {
  explainEvent(event: ClinicalEvent, context: ClinicalEvent[]): ReasoningStep[];
  generateHypotheses(tickIndex: number, events: ClinicalEvent[], series?: SeriesMap): ClinicalHypothesis[];
  generateSBAR(tickIndex: number, events: ClinicalEvent[], series?: SeriesMap, patientMeta?: Patient): SBARReport;
}

class LocalReasoningProvider implements ReasoningProvider {
  explainEvent(event: ClinicalEvent, context: ClinicalEvent[]): ReasoningStep[] {
    const related = nearestEvent(
      event.timestamp,
      context.filter((e) => e.id !== event.id)
    );
    const deltaMinutes = related
      ? Math.round(
          Math.abs(new Date(related.timestamp).getTime() - new Date(event.timestamp).getTime()) / 60_000
        )
      : null;

    const hasSignal = event.severity === "warning" || event.severity === "critical";

    return [
      {
        id: "entity",
        label: "Entity identified",
        detail: `"${event.title}" parsed as a ${eventTypeLabel[event.type]} entity from the synthetic record.`,
      },
      {
        id: "temporal",
        label: "Temporal relationship detected",
        detail: related
          ? `Falls ${deltaMinutes} minute${deltaMinutes === 1 ? "" : "s"} from "${related.title}" (${formatTime(related.timestamp)}).`
          : "No adjacent event found in the visible window.",
      },
      {
        id: "related",
        label: "Related event retrieved",
        detail: related
          ? `Retrieved the record for "${related.title}" to establish surrounding context.`
          : "No related record available to retrieve yet.",
      },
      {
        id: "signal",
        label: "Potential signal identified",
        detail: hasSignal
          ? `Potential ${event.severity} signal associated with this entity — temporal association only, not a causal claim.`
          : "No signal threshold crossed for this entity.",
      },
      {
        id: "consistency",
        label: "Evidence consistency checked",
        detail:
          "Cross-checked against surrounding observations in the synthetic record; no record-level inconsistency found.",
      },
      {
        id: "review",
        label: "Human review recommended",
        detail:
          "This is a record-level pattern, not a diagnosis. Clinical staff should confirm before treating it as significant.",
      },
    ];
  }

  generateHypotheses(tickIndex: number, events: ClinicalEvent[], series: SeriesMap = vitalSeries): ClinicalHypothesis[] {
    const kind = worstVitalKind(tickIndex, series);
    const def = vitalDefinitions[kind];
    const current = latestObservation(kind, tickIndex, series);
    const baseline = seriesUpTo(kind, tickIndex, series)[0]!;
    const rawDelta = Number((current.value - baseline.value).toFixed(2));
    const directionalDelta = worsensUpward[kind] ? rawDelta : -rawDelta;

    const ctx: HypothesisContext = { events, current, baseline, directionalDelta };

    const hypotheses =
      kind === "potassium"
        ? hypothesesForPotassium(ctx)
        : kind === "spo2"
          ? hypothesesForSpo2(ctx)
          : kind === "map"
            ? hypothesesForMap(ctx)
            : hypothesesGeneric(def, ctx);

    return hypotheses.sort((a, b) => b.confidence - a.confidence);
  }

  generateSBAR(
    tickIndex: number,
    events: ClinicalEvent[],
    series: SeriesMap = vitalSeries,
    patientMeta: Patient = patient
  ): SBARReport {
    const kind = worstVitalKind(tickIndex, series);
    const def = vitalDefinitions[kind];
    const current = latestObservation(kind, tickIndex, series);
    const level = severityForVital(kind, current.value);
    const unresolvedCount = (["heartRate", "spo2", "map", "temperature", "potassium"] as const).filter(
      (k) => severityForVital(k, latestObservation(k, tickIndex, series).value) !== "normal"
    ).length;

    const earliestEvent = [...events].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    )[0];
    const medEvent = nearestEventOfType("medication", current.timestamp, events);
    const labEvent = nearestEventOfType("lab", current.timestamp, events);
    const topHypothesis = this.generateHypotheses(tickIndex, events, series)[0]!;

    const levelPhrase = level === "critical" ? "a critical" : level === "warning" ? "a warning-level" : "a stable";

    const backgroundParts = [
      `${patientMeta.encounterLabel}.`,
      earliestEvent ? `${earliestEvent.description}` : "",
      medEvent ? `${medEvent.title} at ${formatTime(medEvent.timestamp)}.` : "",
      labEvent && labEvent.id !== medEvent?.id ? `${labEvent.title} at ${formatTime(labEvent.timestamp)}.` : "",
    ].filter(Boolean);

    const sections: SBARSection[] = [
      {
        id: "situation",
        label: "Situation",
        content: `${patientMeta.name}, ${patientMeta.age}, ${patientMeta.encounterLabel}. Currently in ${levelPhrase} state with ${unresolvedCount} unresolved signal${unresolvedCount === 1 ? "" : "s"}; most notable is ${def.label.toLowerCase()} at ${current.value.toFixed(def.decimals)} ${def.unit}.`,
        evidenceEvents: [],
      },
      {
        id: "background",
        label: "Background",
        content: backgroundParts.join(" "),
        evidenceEvents: [earliestEvent, medEvent, labEvent].filter((e): e is ClinicalEvent => !!e),
      },
      {
        id: "assessment",
        label: "Assessment",
        content: `${def.label} trend is most consistent with a ${topHypothesis.title.toLowerCase()} (${topHypothesis.confidence}% synthetic confidence), though alternative explanations have not been excluded. This is a record-level pattern generated for demonstration purposes, not a diagnosis.`,
        evidenceEvents: medEvent ? [medEvent] : [],
      },
      {
        id: "recommendation",
        label: "Recommendation",
        content: `Continue ${def.label.toLowerCase()} monitoring and reassess after the next recorded value. Escalate to clinical staff to confirm this synthetic analysis before acting on it.`,
        evidenceEvents: [],
      },
    ];

    return {
      generatedAtTimestamp: current.timestamp,
      sections,
    };
  }
}

export const reasoningProvider: ReasoningProvider = new LocalReasoningProvider();
