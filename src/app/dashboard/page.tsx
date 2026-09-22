"use client";

import { useState } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { TopBar } from "@/components/dashboard/TopBar";
import { SectionEmptyState } from "@/components/dashboard/SectionEmptyState";
import { dashboardSections, type SectionId } from "@/lib/navigation";

export default function DashboardPage() {
  const [active, setActive] = useState<SectionId>("overview");
  const section = dashboardSections.find((s) => s.id === active)!;

  return (
    <div className="flex h-screen overflow-hidden bg-base-50">
      <Sidebar active={active} onSelect={setActive} />

      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar />

        <main className="flex-1 overflow-auto">
          <div className="panel m-5 h-[calc(100%-2.5rem)]">
            <SectionEmptyState
              icon={section.icon}
              title={section.label}
              description={section.description}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
