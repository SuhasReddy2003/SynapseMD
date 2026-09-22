import {
  FlaskConical,
  Pill,
  ScanLine,
  StickyNote,
  Stethoscope,
  Waves,
  type LucideIcon,
} from "lucide-react";
import type { ClinicalEventType } from "@/lib/types";

export const eventTypeIcon: Record<ClinicalEventType, LucideIcon> = {
  medication: Pill,
  lab: FlaskConical,
  note: StickyNote,
  procedure: Stethoscope,
  radiology: ScanLine,
  vital: Waves,
};

export const eventTypeDisplayLabel: Record<ClinicalEventType, string> = {
  medication: "Medication",
  lab: "Laboratory",
  note: "Nursing note",
  procedure: "Procedure",
  radiology: "Radiology",
  vital: "Vital event",
};
