import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Activity,
  GitBranch,
  Waypoints,
  GitCompareArrows,
  FileStack,
  UploadCloud,
  FileQuestion,
  Users,
} from "lucide-react";

export type SectionId =
  | "overview"
  | "ward"
  | "timeline"
  | "ingestion"
  | "evidence"
  | "hypotheses"
  | "context"
  | "delta"
  | "sbar";

export interface DashboardSection {
  id: SectionId;
  label: string;
  description: string;
  icon: LucideIcon;
  /** Which build phase populates this section with real data/interaction. */
  phase: number;
}

export const dashboardSections: DashboardSection[] = [
  {
    id: "overview",
    label: "Overview",
    description: "Patient state, vitals and the Synapse State Index",
    icon: LayoutDashboard,
    phase: 2,
  },
  {
    id: "ward",
    label: "Ward board",
    description: "Every patient ranked at the same moment in time",
    icon: Users,
    phase: 12,
  },
  {
    id: "timeline",
    label: "Timeline",
    description: "Chronological clinical event stream",
    icon: Activity,
    phase: 3,
  },
  {
    id: "ingestion",
    label: "Ingest record",
    description: "Add a synthetic EHR document to the patient's event store",
    icon: UploadCloud,
    phase: 7,
  },
  {
    id: "evidence",
    label: "Evidence graph",
    description: "Relationships behind every clinical signal",
    icon: GitBranch,
    phase: 4,
  },
  {
    id: "hypotheses",
    label: "Hypotheses",
    description: "Ranked, evidence-linked explanations for a signal",
    icon: Waypoints,
    phase: 5,
  },
  {
    id: "context",
    label: "Unresolved context",
    description: "What the record does not contain",
    icon: FileQuestion,
    phase: 12,
  },
  {
    id: "delta",
    label: "What changed",
    description: "Compare two points in the patient's record",
    icon: GitCompareArrows,
    phase: 6,
  },
  {
    id: "sbar",
    label: "Handoff",
    description: "Generated SBAR report for shift handoff",
    icon: FileStack,
    phase: 8,
  },
];
