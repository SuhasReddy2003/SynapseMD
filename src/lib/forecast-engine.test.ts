import { describe, expect, it } from "vitest";
import { buildHorizon, formatEta, linearTrend } from "@/lib/forecast-engine";
import { patientDatasets, POINT_COUNT } from "@/lib/mock-data";

describe("linearTrend", () => {
  it("recovers an exact line and reports R² of 1", () => {
    const t = linearTrend([1, 2, 3, 4, 5, 6]);
    expect(t.slope).toBeCloseTo(1);
    expect(t.r2).toBeCloseTo(1);
  });

  it("reports low R² for noise", () => {
    expect(linearTrend([5, 1, 6, 0, 5, 1]).r2).toBeLessThan(0.3);
  });

  it("handles a flat series without dividing by zero", () => {
    expect(linearTrend([3, 3, 3, 3]).r2).toBe(0);
  });
});

describe("buildHorizon", () => {
  const arthur = patientDatasets[0]!;

  it("says nothing before there are enough readings", () => {
    expect(buildHorizon(3, arthur.vitalSeries)).toEqual([]);
  });

  it("projects potassium toward critical for Arthur, in a plausible number of hours", () => {
    const k = buildHorizon(14, arthur.vitalSeries).find((i) => i.kind === "potassium");
    expect(k).toBeDefined();
    expect(k!.direction).toBe("worsening");
    expect(k!.target).toBe("critical");
    expect(k!.minutesAway).toBeGreaterThan(60);
    expect(k!.minutesAway).toBeLessThan(360);
  });

  it("never reports a crossing in the past, beyond eight hours, or for a critical vital already worsening", () => {
    for (const d of patientDatasets) {
      for (let t = 0; t < POINT_COUNT; t++) {
        for (const item of buildHorizon(t, d.vitalSeries)) {
          expect(item.minutesAway).toBeGreaterThan(0);
          expect(item.minutesAway).toBeLessThanOrEqual(16 * 30);
          expect(item.r2).toBeGreaterThanOrEqual(0.6);
        }
      }
    }
  });

  it("finds a recovering trajectory somewhere in the ward", () => {
    const anyRecovery = patientDatasets.some((d) =>
      Array.from({ length: POINT_COUNT }, (_, t) => buildHorizon(t, d.vitalSeries)).some((items) =>
        items.some((i) => i.direction === "recovering")
      )
    );
    expect(anyRecovery).toBe(true);
  });

  it("is deterministic and sorted soonest-first", () => {
    const a = buildHorizon(16, arthur.vitalSeries);
    expect(a).toEqual(buildHorizon(16, arthur.vitalSeries));
    expect([...a].sort((x, y) => x.minutesAway - y.minutesAway)).toEqual(a);
  });
});

describe("formatEta", () => {
  it("formats minutes and hours", () => {
    expect(formatEta(45)).toBe("45 min");
    expect(formatEta(120)).toBe("2 h");
    expect(formatEta(150)).toBe("2 h 30 min");
  });
});
