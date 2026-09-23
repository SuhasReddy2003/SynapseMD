"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { patient, POINT_COUNT } from "@/lib/mock-data";
import { computeSynapseIndex, eventsUpTo } from "@/lib/clinical-engine";
import type { Patient, SynapseIndexResult, ClinicalEvent } from "@/lib/types";

interface PatientContextValue {
  patient: Patient;
  tickIndex: number;
  synapseIndex: SynapseIndexResult;
  /** Base revealed-by-tick events plus anything ingestion has added, timestamp-ordered. */
  events: ClinicalEvent[];
  ingestedCount: number;
  addIngestedEvent: (event: ClinicalEvent) => void;
}

const PatientContext = createContext<PatientContextValue | null>(null);

const TICK_INTERVAL_MS = 3500;
const MIN_TICK_INDEX = 8; // start the demo just after the medication event so the trend is visible

export function PatientProvider({ children }: { children: React.ReactNode }) {
  const [tickIndex, setTickIndex] = useState(MIN_TICK_INDEX);
  const [ingestedEvents, setIngestedEvents] = useState<ClinicalEvent[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTickIndex((prev) => (prev + 1 >= POINT_COUNT ? MIN_TICK_INDEX : prev + 1));
    }, TICK_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  function addIngestedEvent(event: ClinicalEvent) {
    setIngestedEvents((prev) => [...prev, event]);
  }

  const value = useMemo<PatientContextValue>(() => {
    const events = [...eventsUpTo(tickIndex), ...ingestedEvents].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    return {
      patient,
      tickIndex,
      synapseIndex: computeSynapseIndex(tickIndex, events),
      events,
      ingestedCount: ingestedEvents.length,
      addIngestedEvent,
    };
  }, [tickIndex, ingestedEvents]);

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
