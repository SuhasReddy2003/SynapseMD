"use client";

import Link from "next/link";
import { usePatient } from "@/components/patient/PatientContext";
import { useCommandState } from "@/components/dashboard/CommandContext";
import { unresolvedSignals } from "@/lib/clinical-engine";
import { SeverityDot } from "@/components/ui/Severity";
import { Button } from "@/components/ui/Button";
import { Search } from "lucide-react";

export function TopBar() {
  const { patient, tickIndex } = usePatient();
  const { setPaletteOpen } = useCommandState();
  const { count, worst } = unresolvedSignals(tickIndex);

  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-4 border-b border-base-400 bg-base-50/95 px-5 backdrop-blur">
      <div className="flex items-center gap-3">
        <p className="text-sm font-medium text-ink-primary">{patient.name}</p>
        <span className="h-3 w-px bg-base-400" />
        <p className="text-sm text-ink-tertiary">
          {patient.age} · {patient.encounterLabel}
        </p>
      </div>

      <button
        onClick={() => setPaletteOpen(true)}
        className="flex w-full max-w-xs items-center gap-2 rounded-md border border-base-400 bg-base-200 px-3 py-1.5 text-left text-xs text-ink-tertiary transition-colors duration-150 ease-product hover:border-base-500 hover:text-ink-secondary"
      >
        <Search className="h-3.5 w-3.5" />
        Search commands…
        <kbd className="tabular ml-auto rounded border border-base-400 px-1.5 py-0.5 text-[10px]">⌘K</kbd>
      </button>

      <div className="flex items-center gap-3">
        <span className="flex items-center gap-1.5 text-xs text-ink-tertiary">
          <SeverityDot level={worst} pulse={worst !== "normal"} />
          {count === 0
            ? "No unresolved signals"
            : `${count} unresolved signal${count > 1 ? "s" : ""}`}
        </span>
        <Link href="/">
          <Button variant="ghost" size="sm">
            Exit demo
          </Button>
        </Link>
      </div>
    </header>
  );
}
