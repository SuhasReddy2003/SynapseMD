"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { patient } from "@/lib/mock-data";
import { POINT_COUNT } from "@/lib/mock-data";
import { computeSynapseIndex, eventsUpTo } from "@/lib/clinical-engine";
import type { Patient, SynapseIndexResult, ClinicalEvent } from "@/lib/types";

interface PatientContextValue {
  patient: Patient;
  tickIndex: number;
  synapseIndex: SynapseIndexResult;
  events: ClinicalEvent[];
}

const PatientContext = createContext<PatientContextValue | null>(null);

const TICK_INTERVAL_MS = 3500;
const MIN_TICK_INDEX = 8; // start the demo just after the medication event so the trend is visible

export function PatientProvider({ children }: { children: React.ReactNode }) {
  const [tickIndex, setTickIndex] = useState(MIN_TICK_INDEX);

  useEffect(() => {
    const interval = setInterval(() => {
      setTickIndex((prev) => (prev + 1 >= POINT_COUNT ? MIN_TICK_INDEX : prev + 1));
    }, TICK_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  const value = useMemo<PatientContextValue>(
    () => ({
      patient,
      tickIndex,
      synapseIndex: computeSynapseIndex(tickIndex),
      events: eventsUpTo(tickIndex),
    }),
    [tickIndex]
  );

  return (
    <PatientContext.Provider value={value}>{children}</PatientContext.Provider>
  );
}

export function usePatient(): PatientContextValue {
  const ctx = useContext(PatientContext);
  if (!ctx) {
    throw new Error("usePatient must be used within a PatientProvider");
  }
  return ctx;
}
