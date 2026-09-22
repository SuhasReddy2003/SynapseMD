import { nearestEvent } from "@/lib/clinical-engine";
import type { ClinicalEvent, ClinicalEventType } from "@/lib/types";

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
}

export const reasoningProvider: ReasoningProvider = new LocalReasoningProvider();
