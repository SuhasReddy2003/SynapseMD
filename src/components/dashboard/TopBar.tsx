"use client";

import Link from "next/link";
import { usePatient } from "@/components/patient/PatientContext";
import { unresolvedSignals } from "@/lib/clinical-engine";
import { SeverityDot } from "@/components/ui/Severity";
import { Button } from "@/components/ui/Button";

export function TopBar() {
  const { patient, tickIndex } = usePatient();
  const { count, worst } = unresolvedSignals(tickIndex);

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-base-400 bg-base-50/95 px-5 backdrop-blur">
      <div className="flex items-center gap-3">
        <p className="text-sm font-medium text-ink-primary">{patient.name}</p>
        <span className="h-3 w-px bg-base-400" />
        <p className="text-sm text-ink-tertiary">
          {patient.age} · {patient.encounterLabel}
        </p>
      </div>

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
