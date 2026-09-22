import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Activity,
  GitBranch,
  Waypoints,
  GitCompareArrows,
  FileStack,
} from "lucide-react";

export type SectionId =
  | "overview"
  | "timeline"
  | "evidence"
  | "hypotheses"
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
    id: "timeline",
    label: "Timeline",
    description: "Chronological clinical event stream",
    icon: Activity,
    phase: 3,
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
