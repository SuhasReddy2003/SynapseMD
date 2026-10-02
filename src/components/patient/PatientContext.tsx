"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { patientDatasets, datasetForPatientId, POINT_COUNT } from "@/lib/mock-data";
import { computeSynapseIndex, eventsUpTo } from "@/lib/clinical-engine";
import type { Patient, PatientDataset, SynapseIndexResult, ClinicalEvent } from "@/lib/types";

interface PatientContextValue {
  patient: Patient;
  dataset: PatientDataset;
  patients: Patient[];
  selectedPatientId: string;
  setSelectedPatientId: (id: string) => void;
  tickIndex: number;
  maxTickIndex: number;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  speed: number;
  setSpeed: (speed: number) => void;
  /** Manually move to a point in the record — pauses auto-playback, like scrubbing a video. */
  scrubTo: (index: number) => void;
  synapseIndex: SynapseIndexResult;
  /** Base revealed-by-tick events plus anything ingestion has added, timestamp-ordered. */
  events: ClinicalEvent[];
  ingestedCount: number;
  addIngestedEvent: (event: ClinicalEvent) => void;
}

const PatientContext = createContext<PatientContextValue | null>(null);

const TICK_INTERVAL_MS = 3500;
const MIN_TICK_INDEX = 8; // start the demo just after the first notable event so the trend is visible

export function PatientProvider({ children }: { children: React.ReactNode }) {
  const [selectedPatientId, setSelectedPatientId] = useState(patientDatasets[0]!.patient.id);
  const [tickIndex, setTickIndex] = useState(MIN_TICK_INDEX);
  const [isPlaying, setIsPlaying] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [ingestedByPatient, setIngestedByPatient] = useState<Record<string, ClinicalEvent[]>>({});

  const dataset = datasetForPatientId(selectedPatientId);
  const maxTickIndex = POINT_COUNT - 1;

  // Switching patients restarts their telemetry playback from the same relative point.
  useEffect(() => {
    setTickIndex(MIN_TICK_INDEX);
    setIsPlaying(true);
  }, [selectedPatientId]);

  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setTickIndex((prev) => (prev + 1 >= POINT_COUNT ? MIN_TICK_INDEX : prev + 1));
    }, TICK_INTERVAL_MS / speed);
    return () => clearInterval(interval);
  }, [isPlaying, speed]);

  function scrubTo(index: number) {
    setIsPlaying(false);
    setTickIndex(Math.min(Math.max(index, 0), maxTickIndex));
  }

  function addIngestedEvent(event: ClinicalEvent) {
    setIngestedByPatient((prev) => ({
      ...prev,
      [selectedPatientId]: [...(prev[selectedPatientId] ?? []), event],
    }));
  }

  const value = useMemo<PatientContextValue>(() => {
    const ingestedEvents = ingestedByPatient[selectedPatientId] ?? [];
    const events = [...eventsUpTo(tickIndex, dataset.clinicalEvents, dataset.vitalSeries), ...ingestedEvents].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    return {
      patient: dataset.patient,
      dataset,
      patients: patientDatasets.map((d) => d.patient),
      selectedPatientId,
      setSelectedPatientId,
      tickIndex,
      maxTickIndex,
      isPlaying,
      setIsPlaying,
      speed,
      setSpeed,
      scrubTo,
      synapseIndex: computeSynapseIndex(tickIndex, events, dataset.vitalSeries),
      events,
      ingestedCount: ingestedEvents.length,
      addIngestedEvent,
    };
  }, [dataset, selectedPatientId, tickIndex, maxTickIndex, isPlaying, speed, ingestedByPatient]);

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
