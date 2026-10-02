import { describe, expect, it } from "vitest";
import { buildActivityFeed } from "@/lib/activity-engine";
import { patientDatasets, POINT_COUNT } from "@/lib/mock-data";

const arthur = patientDatasets[0]!;

describe("buildActivityFeed", () => {
  it("is empty at the start of the record — nothing has changed yet", () => {
    expect(buildActivityFeed(0, arthur)).toEqual([]);
  });

  it("notices new records and signal transitions", () => {
    const feed = buildActivityFeed(POINT_COUNT - 1, arthur, 200);
    expect(feed.some((e) => e.category === "record" && e.text.includes("Potassium level flagged critical"))).toBe(true);
    expect(feed.some((e) => e.category === "signal" && e.text.startsWith("Potassium moved normal → warning"))).toBe(true);
  });

  it("rewinds: the feed at an earlier tick never contains anything from the future", () => {
    const feed = buildActivityFeed(10, arthur, 200);
    expect(feed.length).toBeGreaterThan(0);
    expect(Math.max(...feed.map((e) => e.tick))).toBeLessThanOrEqual(10);
  });

  it("is a prefix-consistent function of time", () => {
    const early = buildActivityFeed(12, arthur, 200);
    const late = buildActivityFeed(20, arthur, 200);
    const lateUpTo12 = late.filter((e) => e.tick <= 12);
    expect(lateUpTo12).toEqual(early);
  });

  it("lists newest first, respects the limit, and never repeats an id", () => {
    for (const d of patientDatasets) {
      const feed = buildActivityFeed(POINT_COUNT - 1, d, 8);
      expect(feed.length).toBeLessThanOrEqual(8);
      const ticks = feed.map((e) => e.tick);
      expect([...ticks].sort((a, b) => b - a)).toEqual(ticks);
      const all = buildActivityFeed(POINT_COUNT - 1, d, 500);
      expect(new Set(all.map((e) => e.id)).size).toBe(all.length);
    }
  });
});
