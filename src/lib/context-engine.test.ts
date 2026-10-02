import { describe, expect, it } from "vitest";
import { eventsUpTo } from "@/lib/clinical-engine";
import { findMissingContext } from "@/lib/context-engine";
import { patientDatasets, POINT_COUNT } from "@/lib/mock-data";

const arthur = patientDatasets[0]!;
const gapsAt = (t: number, d = arthur) => findMissingContext(t, eventsUpTo(t, d.clinicalEvents, d.vitalSeries), d.vitalSeries);

describe("findMissingContext", () => {
  it("flags an abnormal vital with no related follow-up, then closes the gap once a follow-up exists", () => {
    expect(gapsAt(14).some((g) => g.id === "no-follow-up-potassium")).toBe(true);
    // The potassium re-check order (tick 20) closes it.
    expect(gapsAt(20).some((g) => g.id === "no-follow-up-potassium")).toBe(false);
  });

  it("raises a critical gap for an alert with no clinician response", () => {
    const last = gapsAt(POINT_COUNT - 1);
    expect(last[0]!.severity).toBe("critical");
    expect(last.some((g) => g.id.startsWith("no-response-"))).toBe(true);
  });

  it("does not count a monitor auto-alert as its own response", () => {
    expect(gapsAt(POINT_COUNT - 1).some((g) => g.id.startsWith("no-response-"))).toBe(true);
  });

  it("closes a critical-alert gap when any later clinician record is added", () => {
    const d = arthur;
    const events = eventsUpTo(POINT_COUNT - 1, d.clinicalEvents, d.vitalSeries);
    const note = { ...events[0]!, id: "later", type: "note" as const, timestamp: "2099-01-01T00:00:00.000Z" };
    const gaps = findMissingContext(POINT_COUNT - 1, [...events, note], d.vitalSeries);
    expect(gaps.some((g) => g.id.startsWith("no-response-"))).toBe(false);
  });

  it("flags a medication event that gives no reason", () => {
    const events = eventsUpTo(10, arthur.clinicalEvents, arthur.vitalSeries);
    const med = { ...events.find((e) => e.type === "medication")!, id: "m2", title: "Metoprolol reduced", sourceText: "MAR: Metoprolol dose reduced." };
    expect(findMissingContext(10, [...events, med], arthur.vitalSeries).some((g) => g.id === "no-reason-m2")).toBe(true);
  });

  it("is deterministic and orders critical gaps first", () => {
    for (const d of patientDatasets) {
      for (let t = 0; t < POINT_COUNT; t++) {
        const a = gapsAt(t, d);
        expect(a).toEqual(gapsAt(t, d));
        const ranks = a.map((g) => (g.severity === "critical" ? 0 : 1));
        expect([...ranks].sort()).toEqual(ranks);
      }
    }
  });
});
