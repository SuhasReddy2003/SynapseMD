import { describe, expect, it } from "vitest";
import { buildEvidenceGraph, worstVitalKind } from "@/lib/evidence-engine";
import { eventsUpTo } from "@/lib/clinical-engine";
import { patientDatasets } from "@/lib/mock-data";

const VITAL_KINDS = ["heartRate", "spo2", "map", "temperature", "potassium"];

describe("worstVitalKind", () => {
  it("always returns one of the 5 known vital kinds", () => {
    for (const dataset of patientDatasets) {
      const kind = worstVitalKind(20, dataset.vitalSeries);
      expect(VITAL_KINDS).toContain(kind);
    }
  });
});

describe("buildEvidenceGraph", () => {
  for (const dataset of patientDatasets) {
    it(`produces a fully-connected graph for ${dataset.patient.name}`, () => {
      const tickIndex = 20;
      const events = eventsUpTo(tickIndex, dataset.clinicalEvents, dataset.vitalSeries);
      const graph = buildEvidenceGraph(tickIndex, events, dataset.vitalSeries, dataset.patient);

      // A signal node plus at least the observation/previous/encounter evidence nodes.
      expect(graph.nodes.length).toBeGreaterThanOrEqual(4);
      expect(graph.nodes[0]!.id).toBe("signal");

      const nodeIds = new Set(graph.nodes.map((n) => n.id));
      for (const edge of graph.edges) {
        expect(nodeIds.has(edge.source)).toBe(true);
        expect(nodeIds.has(edge.target)).toBe(true);
      }

      // Every non-signal node should be reachable from the signal.
      expect(graph.edges.length).toBe(graph.nodes.length - 1);
    });
  }
});

import { replayOrder } from "@/lib/evidence-engine";
import { patientDatasets as replayDatasets } from "@/lib/mock-data";
import { eventsUpTo as replayEventsUpTo } from "@/lib/clinical-engine";

describe("replayOrder", () => {
  it("puts context first, excludes the signal, and orders the rest chronologically", () => {
    const d = replayDatasets[0]!;
    const events = replayEventsUpTo(20, d.clinicalEvents, d.vitalSeries);
    const graph = buildEvidenceGraph(20, events, d.vitalSeries, d.patient);
    const order = replayOrder(graph);
    expect(order.some((n) => n.kind === "signal")).toBe(false);
    expect(order[0]!.kind).toBe("context");
    const stamps = order.filter((n) => n.timestamp).map((n) => n.timestamp!);
    expect([...stamps].sort()).toEqual(stamps);
    expect(order).toHaveLength(graph.nodes.length - 1);
  });
});
