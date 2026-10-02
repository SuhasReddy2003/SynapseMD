import { describe, expect, it } from "vitest";
import { buildIngestedEvent, ingestionStageLabels } from "@/lib/ingestion-engine";
import { patientDatasets, POINT_COUNT } from "@/lib/mock-data";

const arthur = patientDatasets[0]!;

describe("buildIngestedEvent", () => {
  it("is deterministic — same inputs always produce the same event", () => {
    const a = buildIngestedEvent(2, arthur.patient.id, arthur.vitalSeries);
    const b = buildIngestedEvent(2, arthur.patient.id, arthur.vitalSeries);
    expect(a).toEqual(b);
  });

  it("cycles through templates rather than repeating the same one back to back", () => {
    const first = buildIngestedEvent(0, arthur.patient.id, arthur.vitalSeries);
    const second = buildIngestedEvent(1, arthur.patient.id, arthur.vitalSeries);
    expect(first.title).not.toBe(second.title);
  });

  it("always timestamps the new event after the last recorded observation", () => {
    const lastKnown = arthur.vitalSeries.heartRate[POINT_COUNT - 1]!.timestamp;
    const event = buildIngestedEvent(0, arthur.patient.id, arthur.vitalSeries);
    expect(new Date(event.timestamp).getTime()).toBeGreaterThan(new Date(lastKnown).getTime());
  });

  it("scopes the generated id to the given patient", () => {
    const event = buildIngestedEvent(3, "some-other-patient", arthur.vitalSeries);
    expect(event.id).toContain("some-other-patient");
  });
});

describe("ingestionStageLabels", () => {
  it("ends with Success", () => {
    expect(ingestionStageLabels[ingestionStageLabels.length - 1]).toBe("Success");
  });
});
