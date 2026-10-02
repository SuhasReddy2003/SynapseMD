import { describe, expect, it } from "vitest";
import { reasoningProvider } from "@/lib/reasoning-engine";
import { eventsUpTo } from "@/lib/clinical-engine";
import { patientDatasets } from "@/lib/mock-data";

describe("explainEvent", () => {
  it("always returns the same 6-step trace shape for a real event", () => {
    const arthur = patientDatasets[0]!;
    const event = arthur.clinicalEvents[0]!;
    const steps = reasoningProvider.explainEvent(event, arthur.clinicalEvents);

    expect(steps).toHaveLength(6);
    expect(steps.map((s) => s.id)).toEqual([
      "entity",
      "temporal",
      "related",
      "signal",
      "consistency",
      "review",
    ]);
    for (const step of steps) {
      expect(step.detail.length).toBeGreaterThan(0);
    }
  });
});

describe("generateHypotheses", () => {
  for (const dataset of patientDatasets) {
    it(`ranks hypotheses by descending confidence for ${dataset.patient.name}`, () => {
      const tickIndex = 20;
      const events = eventsUpTo(tickIndex, dataset.clinicalEvents, dataset.vitalSeries);
      const hypotheses = reasoningProvider.generateHypotheses(tickIndex, events, dataset.vitalSeries);

      expect(hypotheses.length).toBeGreaterThan(0);
      for (const h of hypotheses) {
        expect(h.confidence).toBeGreaterThanOrEqual(0);
        expect(h.confidence).toBeLessThanOrEqual(100);
      }
      for (let i = 1; i < hypotheses.length; i++) {
        expect(hypotheses[i - 1]!.confidence).toBeGreaterThanOrEqual(hypotheses[i]!.confidence);
      }
    });
  }
});

describe("generateSBAR", () => {
  it("always produces the 4 SBAR sections in order", () => {
    const arthur = patientDatasets[0]!;
    const tickIndex = 20;
    const events = eventsUpTo(tickIndex, arthur.clinicalEvents, arthur.vitalSeries);
    const report = reasoningProvider.generateSBAR(tickIndex, events, arthur.vitalSeries, arthur.patient);

    expect(report.sections.map((s) => s.id)).toEqual([
      "situation",
      "background",
      "assessment",
      "recommendation",
    ]);
    for (const section of report.sections) {
      expect(section.content.length).toBeGreaterThan(0);
    }
  });
});
