"use client";

import Link from "next/link";
import { usePatient } from "@/components/patient/PatientContext";
import { useCommandState } from "@/components/dashboard/CommandContext";
import { unresolvedSignals } from "@/lib/clinical-engine";
import { SeverityDot } from "@/components/ui/Severity";
import { Button } from "@/components/ui/Button";
import { Menu, Search } from "lucide-react";
import { PatientSelector } from "@/components/dashboard/PatientSelector";

export function TopBar() {
  const { patient, tickIndex, dataset } = usePatient();
  const { setPaletteOpen, setSidebarOpen } = useCommandState();
  const { count, worst } = unresolvedSignals(tickIndex, dataset.vitalSeries);

  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-base-400 bg-base-50/95 px-3 backdrop-blur sm:px-5">
      <div className="flex min-w-0 items-center gap-2 sm:gap-3">
        <button
          onClick={() => setSidebarOpen(true)}
          aria-label="Open navigation"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-ink-tertiary hover:bg-base-200 hover:text-ink-primary lg:hidden"
        >
          <Menu className="h-4 w-4" />
        </button>
        <PatientSelector />
        <span className="hidden h-3 w-px bg-base-400 sm:block" />
        <p className="hidden truncate text-sm text-ink-tertiary sm:block">
          {patient.age} · {patient.encounterLabel}
        </p>
      </div>

      <button
        onClick={() => setPaletteOpen(true)}
        aria-label="Open command palette"
        className="hidden items-center gap-2 rounded-md border border-base-400 bg-base-200 px-3 py-1.5 text-left text-xs text-ink-tertiary transition-colors duration-150 ease-product hover:border-base-500 hover:text-ink-secondary sm:flex sm:w-full sm:max-w-xs"
      >
        <Search className="h-3.5 w-3.5" />
        Search commands…
        <kbd className="tabular ml-auto rounded border border-base-400 px-1.5 py-0.5 text-[10px]">⌘K</kbd>
      </button>
      <button
        onClick={() => setPaletteOpen(true)}
        aria-label="Open command palette"
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-ink-tertiary hover:bg-base-200 hover:text-ink-primary sm:hidden"
      >
        <Search className="h-4 w-4" />
      </button>

      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <span className="hidden items-center gap-1.5 text-xs text-ink-tertiary md:flex">
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
