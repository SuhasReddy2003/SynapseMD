import type { SectionId } from "@/lib/navigation";
import type { ClinicalEventType, VitalKind } from "@/lib/types";

export interface CommandActions {
  setActiveSection: (id: SectionId) => void;
  setTimelineFilter: (type: ClinicalEventType | null) => void;
  setSignalsOnly: (value: boolean) => void;
  setFocusVital: (kind: VitalKind | null) => void;
  bumpSbarAutoGenerate: () => void;
}

export interface Command {
  id: string;
  label: string;
  hint: string;
  keywords: string[];
  run: (actions: CommandActions) => void;
}

export const commands: Command[] = [
  {
    id: "show-potassium",
    label: "Show potassium",
    hint: "Overview · focuses the potassium reading",
    keywords: ["potassium", "show potassium", "k+"],
    run: (a) => {
      a.setActiveSection("overview");
      a.setSignalsOnly(false);
      a.setFocusVital("potassium");
    },
  },
  {
    id: "show-map",
    label: "Show MAP",
    hint: "Overview · focuses mean arterial pressure",
    keywords: ["map", "show map", "mean arterial pressure"],
    run: (a) => {
      a.setActiveSection("overview");
      a.setSignalsOnly(false);
      a.setFocusVital("map");
    },
  },
  {
    id: "show-unresolved-signals",
    label: "Show unresolved signals",
    hint: "Overview · filters to vitals outside normal range",
    keywords: ["unresolved", "signals", "unresolved signals", "abnormal"],
    run: (a) => {
      a.setActiveSection("overview");
      a.setFocusVital(null);
      a.setSignalsOnly(true);
    },
  },
  {
    id: "show-lab-results",
    label: "Show lab results",
    hint: "Timeline · filtered to laboratory events",
    keywords: ["lab", "labs", "lab results", "laboratory"],
    run: (a) => {
      a.setActiveSection("timeline");
      a.setTimelineFilter("lab");
    },
  },
  {
    id: "show-medication-events",
    label: "Show medication events",
    hint: "Timeline · filtered to medication events",
    keywords: ["medication", "medications", "meds", "medication events"],
    run: (a) => {
      a.setActiveSection("timeline");
      a.setTimelineFilter("medication");
    },
  },
  {
    id: "show-reasoning",
    label: "Show reasoning",
    hint: "Timeline · click any event to open its reasoning trace",
    keywords: ["reasoning", "show reasoning", "trace", "explain"],
    run: (a) => {
      a.setActiveSection("timeline");
      a.setTimelineFilter(null);
    },
  },
  {
    id: "show-evidence-graph",
    label: "Show evidence graph",
    hint: "Evidence graph",
    keywords: ["evidence", "evidence graph", "graph", "relationships"],
    run: (a) => a.setActiveSection("evidence"),
  },
  {
    id: "show-hypotheses",
    label: "Show hypotheses",
    hint: "Clinical Hypothesis Explorer",
    keywords: ["hypothesis", "hypotheses", "explanations"],
    run: (a) => a.setActiveSection("hypotheses"),
  },
  {
    id: "what-changed",
    label: "What changed today",
    hint: "Compares two points in the record",
    keywords: ["what changed", "changed today", "delta", "compare"],
    run: (a) => a.setActiveSection("delta"),
  },
  {
    id: "ingest-record",
    label: "Ingest a record",
    hint: "Add a synthetic EHR document",
    keywords: ["ingest", "upload", "ingest record"],
    run: (a) => a.setActiveSection("ingestion"),
  },
  {
    id: "generate-handoff",
    label: "Generate handoff",
    hint: "Builds a fresh SBAR from current state",
    keywords: ["generate handoff", "handoff", "sbar"],
    run: (a) => {
      a.setActiveSection("sbar");
      a.bumpSbarAutoGenerate();
    },
  },
  {
    id: "show-overview",
    label: "Show overview",
    hint: "Patient state, vitals and the Synapse State Index",
    keywords: ["overview", "vitals", "home"],
    run: (a) => {
      a.setActiveSection("overview");
      a.setSignalsOnly(false);
      a.setFocusVital(null);
    },
  },
];

export function matchCommands(query: string): Command[] {
  const q = query.trim().toLowerCase();
  if (!q) return commands;
  return commands.filter(
    (c) =>
      c.label.toLowerCase().includes(q) ||
      c.keywords.some((k) => k.includes(q) || q.includes(k))
  );
}
