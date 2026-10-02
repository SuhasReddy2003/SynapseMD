"use client";

import { useEffect, useRef } from "react";
import { usePatient } from "@/components/patient/PatientContext";
import { useToast } from "@/components/dashboard/ToastContext";
import { latestObservation, severityForVital } from "@/lib/clinical-engine";
import { vitalDefinitions } from "@/lib/mock-data";
import type { SeverityLevel } from "@/lib/design-tokens";
import type { VitalKind } from "@/lib/types";

const KINDS: VitalKind[] = ["heartRate", "spo2", "map", "temperature", "potassium"];

export function SignalWatcher() {
  const { tickIndex, dataset } = usePatient();
  const { showToast } = useToast();
  const prevLevels = useRef<Partial<Record<VitalKind, SeverityLevel>>>({});
  const prevPatientId = useRef(dataset.patient.id);

  useEffect(() => {
    const patientChanged = prevPatientId.current !== dataset.patient.id;
    prevPatientId.current = dataset.patient.id;

    for (const kind of KINDS) {
      const level = severityForVital(kind, latestObservation(kind, tickIndex, dataset.vitalSeries).value);
      const previous = prevLevels.current[kind];
      // Only alert on a genuine new crossing into critical for the same patient —
      // never on the first read after mount or after switching patients.
      if (!patientChanged && previous !== undefined && previous !== "critical" && level === "critical") {
        showToast(`New critical signal: ${vitalDefinitions[kind].label}`, "critical");
      }
      prevLevels.current[kind] = level;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tickIndex, dataset.patient.id]);

  return null;
}
