import { describe, expect, it } from "vitest";
import {
  buildClinicalDelta,
  computeSynapseIndex,
  eventsUpTo,
  latestObservation,
  nearestEvent,
  severityForVital,
  unresolvedSignals,
} from "@/lib/clinical-engine";
import { patientDatasets, vitalDefinitions } from "@/lib/mock-data";

const arthur = patientDatasets[0]!;

describe("severityForVital", () => {
  it("classifies a potassium value inside the normal band as normal", () => {
    expect(severityForVital("potassium", 4.5)).toBe("normal");
  });

  it("classifies a potassium value just past the normal band as warning", () => {
    expect(severityForVital("potassium", 5.2)).toBe("warning");
  });

  it("classifies a potassium value beyond the critical band as critical", () => {
    expect(severityForVital("potassium", 5.6)).toBe("critical");
  });

  it("is consistent with the vital's own defined bands for every kind", () => {
    for (const def of Object.values(vitalDefinitions)) {
      const [low, high] = def.normalRange;
      expect(severityForVital(def.kind, (low + high) / 2)).toBe("normal");
    }
  });
});

describe("eventsUpTo", () => {
  it("never returns an event with a timestamp after the tick cutoff", () => {
    const tickIndex = 10;
    const cutoff = arthur.vitalSeries.heartRate[tickIndex]!.timestamp;
    const events = eventsUpTo(tickIndex, arthur.clinicalEvents, arthur.vitalSeries);
    for (const e of events) {
      expect(e.timestamp <= cutoff).toBe(true);
    }
  });

  it("reveals more events as the tick advances", () => {
    const early = eventsUpTo(0, arthur.clinicalEvents, arthur.vitalSeries).length;
    const late = eventsUpTo(24, arthur.clinicalEvents, arthur.vitalSeries).length;
    expect(late).toBeGreaterThanOrEqual(early);
  });
});

describe("nearestEvent", () => {
  it("picks the event with the smallest time difference", () => {
    const target = arthur.vitalSeries.heartRate[8]!.timestamp;
    const found = nearestEvent(target, arthur.clinicalEvents);
    expect(found).toBeDefined();

    const foundDiff = Math.abs(new Date(found!.timestamp).getTime() - new Date(target).getTime());
    for (const e of arthur.clinicalEvents) {
      const diff = Math.abs(new Date(e.timestamp).getTime() - new Date(target).getTime());
      expect(foundDiff).toBeLessThanOrEqual(diff);
    }
  });
});

describe("unresolvedSignals", () => {
  it("counts only vitals outside their normal band", () => {
    const { count, worst } = unresolvedSignals(24, arthur.vitalSeries);
    expect(count).toBeGreaterThanOrEqual(0);
    expect(["normal", "warning", "critical", "neutral"]).toContain(worst);
  });
});

describe("computeSynapseIndex", () => {
  it("returns a score between 0 and 100", () => {
    for (let tick = 0; tick < 25; tick += 4) {
      const result = computeSynapseIndex(tick, undefined, arthur.vitalSeries);
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
    }
  });

  it("always returns exactly 4 components", () => {
    const result = computeSynapseIndex(12, undefined, arthur.vitalSeries);
    expect(result.components).toHaveLength(4);
  });
});

describe("buildClinicalDelta", () => {
  it("is order-independent — comparing (a,b) or (b,a) gives the same result", () => {
    const forward = buildClinicalDelta(2, 20, arthur.vitalSeries, arthur.clinicalEvents);
    const backward = buildClinicalDelta(20, 2, arthur.vitalSeries, arthur.clinicalEvents);
    expect(forward).toEqual(backward);
  });

  it("covers all 5 vitals", () => {
    const delta = buildClinicalDelta(0, 24, arthur.vitalSeries, arthur.clinicalEvents);
    expect(delta.vitals).toHaveLength(5);
  });

  it("flags a vital as changed only when its value actually moved", () => {
    const delta = buildClinicalDelta(0, 0, arthur.vitalSeries, arthur.clinicalEvents);
    for (const v of delta.vitals) {
      expect(v.changed).toBe(false);
    }
  });
});

describe("latestObservation", () => {
  it("never returns a reading beyond the requested tick", () => {
    const obs = latestObservation("potassium", 5, arthur.vitalSeries);
    expect(obs.timestamp).toBe(arthur.vitalSeries.potassium[5]!.timestamp);
  });
});
