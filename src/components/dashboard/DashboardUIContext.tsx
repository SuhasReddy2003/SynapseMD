"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { ClinicalEventType, VitalKind } from "@/lib/types";
import type { SectionId } from "@/lib/navigation";

interface DashboardUIContextValue {
  active: SectionId;
  setActive: (id: SectionId) => void;

  /** Set by "show potassium" / "show unresolved signals" — Overview highlights this vital. */
  focusedVital: VitalKind | null;
  setFocusedVital: (kind: VitalKind | null) => void;

  /** Set by "show lab results" / "show medication events" — Timeline filters to this type. */
  timelineFilter: ClinicalEventType | null;
  setTimelineFilter: (type: ClinicalEventType | null) => void;

  /** Bumped by "generate handoff" — SBARGenerator listens and runs generate() once. */
  sbarAutoGenerateToken: number;
  triggerSbarGenerate: () => void;

  paletteOpen: boolean;
  setPaletteOpen: (open: boolean) => void;
}

const DashboardUIContext = createContext<DashboardUIContextValue | null>(null);

export function DashboardUIProvider({ children }: { children: React.ReactNode }) {
  const [active, setActive] = useState<SectionId>("overview");
  const [focusedVital, setFocusedVital] = useState<VitalKind | null>(null);
  const [timelineFilter, setTimelineFilter] = useState<ClinicalEventType | null>(null);
  const [sbarAutoGenerateToken, setSbarAutoGenerateToken] = useState(0);
  const [paletteOpen, setPaletteOpen] = useState(false);

  const triggerSbarGenerate = useCallback(() => setSbarAutoGenerateToken((t) => t + 1), []);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((open) => !open);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <DashboardUIContext.Provider
      value={{
        active,
        setActive,
        focusedVital,
        setFocusedVital,
        timelineFilter,
        setTimelineFilter,
        sbarAutoGenerateToken,
        triggerSbarGenerate,
        paletteOpen,
        setPaletteOpen,
      }}
    >
      {children}
    </DashboardUIContext.Provider>
  );
}

export function useDashboardUI(): DashboardUIContextValue {
  const ctx = useContext(DashboardUIContext);
  if (!ctx) throw new Error("useDashboardUI must be used within a DashboardUIProvider");
  return ctx;
}
