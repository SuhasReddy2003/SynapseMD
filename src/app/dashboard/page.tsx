"use client";

import { Sidebar } from "@/components/dashboard/Sidebar";
import { TopBar } from "@/components/dashboard/TopBar";
import { PatientHeader } from "@/components/dashboard/PatientHeader";
import { StabilityIndex } from "@/components/dashboard/StabilityIndex";
import { VitalTrends } from "@/components/dashboard/VitalTrends";
import { Timeline } from "@/components/dashboard/Timeline";
import { EvidenceGraph } from "@/components/dashboard/EvidenceGraph";
import { HypothesisExplorer } from "@/components/dashboard/HypothesisExplorer";
import { ClinicalDelta } from "@/components/dashboard/ClinicalDelta";
import { SBARGenerator } from "@/components/dashboard/SBARGenerator";
import { IngestionPanel } from "@/components/dashboard/IngestionPanel";
import { CommandPalette } from "@/components/dashboard/CommandPalette";
import { CommandProvider, useCommandState } from "@/components/dashboard/CommandContext";
import { PatientProvider } from "@/components/patient/PatientContext";

function DashboardShell() {
  const { activeSection } = useCommandState();

  return (
    <div className="flex h-screen overflow-hidden bg-base-50">
      <Sidebar />

      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar />

        <main className="flex-1 overflow-auto p-5">
          {activeSection === "overview" ? (
            <div className="flex h-full flex-col gap-5">
              <PatientHeader />
              <div className="grid flex-1 grid-cols-1 gap-5 lg:grid-cols-[380px_1fr]">
                <StabilityIndex />
                <VitalTrends />
              </div>
            </div>
          ) : activeSection === "timeline" ? (
            <div className="h-full">
              <Timeline />
            </div>
          ) : activeSection === "ingestion" ? (
            <div className="h-full">
              <IngestionPanel />
            </div>
          ) : activeSection === "evidence" ? (
            <div className="h-full">
              <EvidenceGraph />
            </div>
          ) : activeSection === "hypotheses" ? (
            <div className="h-full">
              <HypothesisExplorer />
            </div>
          ) : activeSection === "delta" ? (
            <div className="h-full">
              <ClinicalDelta />
            </div>
          ) : (
            <div className="h-full">
              <SBARGenerator />
            </div>
          )}
        </main>
      </div>

      <CommandPalette />
    </div>
  );
}

export default function DashboardPage() {
  return (
    <PatientProvider>
      <CommandProvider>
        <DashboardShell />
      </CommandProvider>
    </PatientProvider>
  );
}
