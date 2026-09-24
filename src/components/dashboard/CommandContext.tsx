"use client";

import { createContext, useContext, useMemo, useState } from "react";
import type { SectionId } from "@/lib/navigation";
import type { ClinicalEventType, VitalKind } from "@/lib/types";
import type { CommandActions } from "@/lib/commands";

interface CommandContextValue extends CommandActions {
  activeSection: SectionId;
  timelineFilter: ClinicalEventType | null;
  signalsOnly: boolean;
  focusVital: VitalKind | null;
  sbarAutoGenerateToken: number;
  paletteOpen: boolean;
  setPaletteOpen: (open: boolean) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

const CommandContext = createContext<CommandContextValue | null>(null);

export function CommandProvider({
  children,
  initialSection = "overview",
}: {
  children: React.ReactNode;
  initialSection?: SectionId;
}) {
  const [activeSection, setActiveSection] = useState<SectionId>(initialSection);
  const [timelineFilter, setTimelineFilter] = useState<ClinicalEventType | null>(null);
  const [signalsOnly, setSignalsOnly] = useState(false);
  const [focusVital, setFocusVital] = useState<VitalKind | null>(null);
  const [sbarAutoGenerateToken, setSbarAutoGenerateToken] = useState(0);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const value = useMemo<CommandContextValue>(
    () => ({
      activeSection,
      setActiveSection,
      timelineFilter,
      setTimelineFilter,
      signalsOnly,
      setSignalsOnly,
      focusVital,
      setFocusVital,
      sbarAutoGenerateToken,
      bumpSbarAutoGenerate: () => setSbarAutoGenerateToken((t) => t + 1),
      paletteOpen,
      setPaletteOpen,
      sidebarOpen,
      setSidebarOpen,
    }),
    [activeSection, timelineFilter, signalsOnly, focusVital, sbarAutoGenerateToken, paletteOpen, sidebarOpen]
  );

  return <CommandContext.Provider value={value}>{children}</CommandContext.Provider>;
}

export function useCommandState(): CommandContextValue {
  const ctx = useContext(CommandContext);
  if (!ctx) throw new Error("useCommandState must be used within a CommandProvider");
  return ctx;
}
