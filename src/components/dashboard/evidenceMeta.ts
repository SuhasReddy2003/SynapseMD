import { AlertTriangle, Activity, Building2, type LucideIcon } from "lucide-react";
import { eventTypeIcon } from "@/components/dashboard/eventMeta";
import type { EvidenceNode, EvidenceNodeKind } from "@/lib/evidence-engine";

export function evidenceNodeIcon(node: EvidenceNode): LucideIcon {
  if (node.linkedEvent) return eventTypeIcon[node.linkedEvent.type];
  switch (node.kind) {
    case "signal":
      return AlertTriangle;
    case "observation":
      return Activity;
    case "context":
      return Building2;
    default:
      return Activity;
  }
}

export const evidenceKindLabel: Record<EvidenceNodeKind, string> = {
  signal: "Clinical signal",
  event: "Clinical event",
  observation: "Observation",
  context: "Context",
};
