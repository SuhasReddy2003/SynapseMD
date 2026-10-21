"use client";

import dynamic from "next/dynamic";
import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { commandById } from "@/lib/commands";
import { ToastProvider, useToast } from "@/components/dashboard/ToastContext";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { TopBar } from "@/components/dashboard/TopBar";
import { HorizonPanel } from "@/components/dashboard/HorizonPanel";
import { EngineLog } from "@/components/dashboard/EngineLog";
import { unresolvedSignals } from "@/lib/clinical-engine";
import { GuidedTour } from "@/components/dashboard/GuidedTour";
import { WardBoard } from "@/components/dashboard/WardBoard";
import { UnresolvedContext } from "@/components/dashboard/UnresolvedContext";
import { VitalFingerprint } from "@/components/dashboard/VitalFingerprint";
import { TimeScrubber } from "@/components/dashboard/TimeScrubber";
import { PatientHeader } from "@/components/dashboard/PatientHeader";
import { StabilityIndex } from "@/components/dashboard/StabilityIndex";
import { VitalTrends } from "@/components/dashboard/VitalTrends";
import { Timeline } from "@/components/dashboard/Timeline";
import { HypothesisExplorer } from "@/components/dashboard/HypothesisExplorer";
import { ClinicalDelta } from "@/components/dashboard/ClinicalDelta";
import { SBARGenerator } from "@/components/dashboard/SBARGenerator";
import { IngestionPanel } from "@/components/dashboard/IngestionPanel";
import { CommandPalette } from "@/components/dashboard/CommandPalette";
import { KeyboardShortcuts } from "@/components/dashboard/KeyboardShortcuts";
import { SignalWatcher } from "@/components/dashboard/SignalWatcher";
import { CommandProvider, useCommandState } from "@/components/dashboard/CommandContext";
import { PatientProvider, usePatient } from "@/components/patient/PatientContext";

/** Runs a command passed as ?cmd=<id> (from the landing page's try-a-command bar), then cleans the URL. */
function CommandFromUrl() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const state = useCommandState();
  const { showToast } = useToast();

  useEffect(() => {
    const id = searchParams.get("cmd");
    if (!id) return;
    const command = commandById(id);
    if (command) {
      command.run(state);
      showToast(`Jumped to: ${command.label}`);
    }
    router.replace("/dashboard");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  return null;
}

// React Flow is only needed on one tab — keep it out of the initial dashboard bundle.
const EvidenceGraph = dynamic(() => import("@/components/dashboard/EvidenceGraph").then((m) => m.EvidenceGraph), {
  ssr: false,
  loading: () => <div className="panel h-full animate-pulse-live" aria-busy="true" aria-label="Loading evidence graph" />,
});

function DashboardShell() {
  const { activeSection } = useCommandState();
  const { tickIndex, dataset, selectedPatientId } = usePatient();
  const { worst } = unresolvedSignals(tickIndex, dataset.vitalSeries);

  return (
    <div className="flex h-screen overflow-hidden bg-base-50">
      <Sidebar />

      <div className="relative isolate flex flex-1 flex-col overflow-hidden">
        <div
          aria-hidden="true"
          className="bg-grid pointer-events-none absolute inset-0 -z-10 [mask-image:radial-gradient(ellipse_90%_70%_at_50%_0%,black_20%,transparent_75%)]"
        />
        {worst === "critical" && (
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-30 animate-alarm-edge" />
        )}
        <TopBar />
        <TimeScrubber />

        <main className="flex-1 overflow-auto p-5">
          <div key={`${activeSection}-${selectedPatientId}`} className="h-full animate-section-in">
            {activeSection === "overview" ? (
              <div className="flex min-h-full flex-col gap-5">
                <PatientHeader />
                <div className="grid min-h-[440px] flex-1 grid-cols-1 gap-5 lg:grid-cols-[380px_1fr]">
                  <div className="flex flex-col gap-5">
                    <StabilityIndex />
                    <VitalFingerprint />
                  </div>
                  <VitalTrends />
                </div>
                <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                  <HorizonPanel />
                  <EngineLog />
                </div>
              </div>
            ) : activeSection === "ward" ? (
              <WardBoard />
            ) : activeSection === "context" ? (
              <UnresolvedContext />
            ) : activeSection === "timeline" ? (
              <Timeline />
            ) : activeSection === "ingestion" ? (
              <IngestionPanel />
            ) : activeSection === "evidence" ? (
              <EvidenceGraph />
            ) : activeSection === "hypotheses" ? (
              <HypothesisExplorer />
            ) : activeSection === "delta" ? (
              <ClinicalDelta />
            ) : (
              <SBARGenerator />
            )}
          </div>
        </main>
      </div>

      <CommandPalette />
      <KeyboardShortcuts />
      <SignalWatcher />
      <GuidedTour />
      <Suspense fallback={null}>
        <CommandFromUrl />
      </Suspense>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <PatientProvider>
      <CommandProvider>
        <ToastProvider>
          <DashboardShell />
        </ToastProvider>
      </CommandProvider>
    </PatientProvider>
  );
}
