import { latestObservation, nearestEvent, seriesUpTo, severityForVital } from "@/lib/clinical-engine";
import type { ClinicalEvent, ClinicalEventType, ClinicalHypothesis } from "@/lib/types";

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

/**
 * The abstraction the UI talks to. It should never know whether reasoning
 * comes from deterministic local logic or a future LLM/medical-model backend.
 */
export interface ReasoningProvider {
  explainEvent(event: ClinicalEvent, context: ClinicalEvent[]): ReasoningStep[];
  generateHypotheses(tickIndex: number, events: ClinicalEvent[]): ClinicalHypothesis[];
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

  generateHypotheses(tickIndex: number, events: ClinicalEvent[]): ClinicalHypothesis[] {
    const potassium = latestObservation("potassium", tickIndex);
    const baseline = seriesUpTo("potassium", tickIndex)[0]!;
    const level = severityForVital("potassium", potassium.value);
    const delta = Number((potassium.value - baseline.value).toFixed(1));

    const medEvent = events.find((e) => e.id === "evt-lisinopril-0400");
    const bmpEvent = events.find((e) => e.id === "evt-bmp-0100");
    const repeatDrawEvent = events.find((e) => e.id === "evt-potassium-flag-1000");

    const clamp = (n: number) => Math.round(Math.min(95, Math.max(4, n)));

    const medicationConfidence = clamp(medEvent ? 45 + delta * 65 : 12);
    const renalConfidence = clamp(35 - delta * 8);
    const measurementConfidence = clamp(repeatDrawEvent ? 6 : 30 - delta * 15);
    const recentEventConfidence = clamp(18 + delta * 12);

    const hypotheses: ClinicalHypothesis[] = [
      {
        id: "medication",
        title: "Medication-related signal",
        confidence: medicationConfidence,
        supportingEvidence: medEvent
          ? [
              `${medEvent.title} at ${formatTime(medEvent.timestamp)}, preceding the rise in potassium.`,
              `Potassium moved from ${baseline.value.toFixed(1)} to ${potassium.value.toFixed(1)} mmol/L after an ACE inhibitor was given — a recognized pharmacologic association.`,
            ]
          : [],
        contradictingEvidence: level === "normal" ? ["Potassium is currently within the normal range."] : [],
        missingInformation: [
          "No prior potassium response documented for this patient on ACE inhibitors.",
          "No renal-clearance trend available to confirm the mechanism.",
        ],
        temporalRelationships: medEvent
          ? [`${medEvent.title} at ${formatTime(medEvent.timestamp)}, before the current reading.`]
          : ["No medication event found in the visible window."],
      },
      {
        id: "renal",
        title: "Renal-function signal",
        confidence: renalConfidence,
        supportingEvidence: ["Patient is post-operative, a setting where transient renal changes can occur."],
        contradictingEvidence: bmpEvent
          ? [`${bmpEvent.title}: creatinine 1.1 mg/dL, stable from baseline.`]
          : [],
        missingInformation: [
          "No repeat creatinine drawn in this window to confirm a renal trend.",
          "No urine output record available.",
        ],
        temporalRelationships: bmpEvent
          ? [`${bmpEvent.title} at ${formatTime(bmpEvent.timestamp)}, before the potassium rise became apparent.`]
          : [],
      },
      {
        id: "measurement",
        title: "Measurement / sample issue",
        confidence: measurementConfidence,
        supportingEvidence: repeatDrawEvent
          ? []
          : ["Elevated reading has not yet been confirmed by a repeat draw in this window."],
        contradictingEvidence: repeatDrawEvent
          ? [`${repeatDrawEvent.title} was ordered specifically to confirm the trend, which argues against a one-off measurement error.`]
          : [],
        missingInformation: repeatDrawEvent ? [] : ["Repeat draw result not yet available in this window."],
        temporalRelationships: repeatDrawEvent
          ? [`${repeatDrawEvent.title} at ${formatTime(repeatDrawEvent.timestamp)}.`]
          : [],
      },
      {
        id: "recent-event",
        title: "Recent clinical event",
        confidence: recentEventConfidence,
        supportingEvidence: ["Day 2 post-CABG is a period commonly associated with fluid and electrolyte shifts."],
        contradictingEvidence: ["No documented bleeding, transfusion, or arrhythmia directly implicating this mechanism."],
        missingInformation: ["No fluid-balance or transfusion record available in this window."],
        temporalRelationships: ["Encounter began before the observed window; no single triggering event identified."],
      },
    ];

    return hypotheses.sort((a, b) => b.confidence - a.confidence);
  }
}

export const reasoningProvider: ReasoningProvider = new LocalReasoningProvider();
