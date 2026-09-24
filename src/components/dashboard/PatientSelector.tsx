"use client";

import { useState } from "react";
import { ChevronDown, Check } from "lucide-react";
import clsx from "clsx";
import { usePatient } from "@/components/patient/PatientContext";

export function PatientSelector() {
  const { patient, patients, selectedPatientId, setSelectedPatientId } = usePatient();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 rounded-md px-1.5 py-1 text-sm font-medium text-ink-primary transition-colors duration-150 ease-product hover:bg-base-200"
      >
        {patient.name}
        <ChevronDown className={clsx("h-3.5 w-3.5 text-ink-tertiary transition-transform duration-150 ease-product", open && "rotate-180")} />
      </button>

      {open && (
        <>
          <div onClick={() => setOpen(false)} className="fixed inset-0 z-40" aria-hidden="true" />
          <div className="animate-fade-in panel absolute left-0 top-full z-50 mt-1.5 w-72 overflow-hidden py-1 shadow-floating">
            <p className="px-3 py-1.5 text-[11px] font-medium uppercase tracking-wide text-ink-tertiary">
              Switch patient
            </p>
            {patients.map((p) => {
              const isSelected = p.id === selectedPatientId;
              return (
                <button
                  key={p.id}
                  onClick={() => {
                    setSelectedPatientId(p.id);
                    setOpen(false);
                  }}
                  className={clsx(
                    "flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left transition-colors duration-150 ease-product hover:bg-base-200",
                    isSelected && "bg-base-300"
                  )}
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm text-ink-primary">{p.name}</p>
                    <p className="truncate text-xs text-ink-tertiary">
                      {p.age} · {p.encounterLabel}
                    </p>
                  </div>
                  {isSelected && <Check className="h-4 w-4 shrink-0 text-synapse-bright" />}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
