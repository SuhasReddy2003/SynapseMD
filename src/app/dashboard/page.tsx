"use client";

import { useState } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { TopBar } from "@/components/dashboard/TopBar";
import { SectionEmptyState } from "@/components/dashboard/SectionEmptyState";
import { PatientHeader } from "@/components/dashboard/PatientHeader";
import { StabilityIndex } from "@/components/dashboard/StabilityIndex";
import { VitalTrends } from "@/components/dashboard/VitalTrends";
import { Timeline } from "@/components/dashboard/Timeline";
import { EvidenceGraph } from "@/components/dashboard/EvidenceGraph";
import { PatientProvider } from "@/components/patient/PatientContext";
import { dashboardSections, type SectionId } from "@/lib/navigation";

function DashboardShell() {
  const [active, setActive] = useState<SectionId>("overview");
  const section = dashboardSections.find((s) => s.id === active)!;

  return (
    <div className="flex h-screen overflow-hidden bg-base-50">
      <Sidebar active={active} onSelect={setActive} />

      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar />

        <main className="flex-1 overflow-auto p-5">
          {active === "overview" ? (
            <div className="flex h-full flex-col gap-5">
              <PatientHeader />
              <div className="grid flex-1 grid-cols-1 gap-5 lg:grid-cols-[380px_1fr]">
                <StabilityIndex />
                <VitalTrends />
              </div>
            </div>
          ) : active === "timeline" ? (
            <div className="h-full">
              <Timeline />
            </div>
          ) : active === "evidence" ? (
            <div className="h-full">
              <EvidenceGraph />
            </div>
          ) : (
            <div className="panel h-full">
              <SectionEmptyState
                icon={section.icon}
                title={section.label}
                description={section.description}
              />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <PatientProvider>
      <DashboardShell />
    </PatientProvider>
  );
}
