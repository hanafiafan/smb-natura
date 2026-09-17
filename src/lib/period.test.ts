import { describe, it, expect } from "vitest";
import { computePeriods } from "@/lib/period";

// Wednesday 15 April 2026 — mid-week and mid-month, so week/month boundaries are unambiguous.
const TODAY = new Date(2026, 3, 15);

const range = (p: { start: string; end: string }) => `${p.start}..${p.end}`;

describe("computePeriods", () => {
  it("daily compares today with yesterday", () => {
    const { periodA, periodB } = computePeriods("daily", undefined, undefined, TODAY);
    expect(range(periodA)).toBe("2026-04-14..2026-04-14");
    expect(range(periodB)).toBe("2026-04-15..2026-04-15");
  });

  it("weekly runs Monday–Sunday and compares with the week before", () => {
    const { periodA, periodB } = computePeriods("weekly", undefined, undefined, TODAY);
    expect(range(periodB)).toBe("2026-04-13..2026-04-19");
    expect(range(periodA)).toBe("2026-04-06..2026-04-12");
  });

  it("weekly treats Sunday as the last day of the week, not the first", () => {
    const sunday = new Date(2026, 3, 19);
    const { periodB } = computePeriods("weekly", undefined, undefined, sunday);
    expect(range(periodB)).toBe("2026-04-13..2026-04-19");
  });

  it("monthly compares the full current month with the full previous one", () => {
    const { periodA, periodB } = computePeriods("monthly", undefined, undefined, TODAY);
    expect(range(periodB)).toBe("2026-04-01..2026-04-30");
    expect(range(periodA)).toBe("2026-03-01..2026-03-31");
  });

  it("monthly handles the January rollback into the previous year", () => {
    const { periodA } = computePeriods("monthly", undefined, undefined, new Date(2026, 0, 10));
    expect(range(periodA)).toBe("2025-12-01..2025-12-31");
  });

  it("yearly compares YTD against the same span last year", () => {
    const { periodA, periodB } = computePeriods("yearly", undefined, undefined, TODAY);
    expect(range(periodB)).toBe("2026-01-01..2026-04-15");
    expect(range(periodA)).toBe("2025-01-01..2025-04-15");
  });

  it("custom derives a comparison period of the same length, ending the day before", () => {
    const { periodA, periodB } = computePeriods("custom", "2026-04-10", "2026-04-19", TODAY);
    expect(range(periodB)).toBe("2026-04-10..2026-04-19"); // 10 days
    expect(range(periodA)).toBe("2026-03-31..2026-04-09"); // 10 days, immediately before
  });

  it("custom keeps a single-day range one day long", () => {
    const { periodA, periodB } = computePeriods("custom", "2026-04-10", "2026-04-10", TODAY);
    expect(range(periodB)).toBe("2026-04-10..2026-04-10");
    expect(range(periodA)).toBe("2026-04-09..2026-04-09");
  });

  it("custom swaps a backwards range instead of collapsing it to one day", () => {
    const { periodB } = computePeriods("custom", "2026-04-19", "2026-04-10", TODAY);
    expect(range(periodB)).toBe("2026-04-10..2026-04-19");
  });

  it("custom falls back to today when a date is malformed", () => {
    const { periodB } = computePeriods("custom", "bukan-tanggal", "2026-02-30", TODAY);
    expect(range(periodB)).toBe("2026-04-15..2026-04-15");
  });

  it("custom spans a month boundary without drifting a day", () => {
    const { periodA, periodB } = computePeriods("custom", "2026-03-01", "2026-03-31", TODAY);
    expect(range(periodB)).toBe("2026-03-01..2026-03-31"); // 31 days
    expect(range(periodA)).toBe("2026-01-29..2026-02-28"); // 31 days back from 28 Feb
  });

  it("falls back to monthly for an unknown mode", () => {
    const { mode, periodB } = computePeriods("bulanan" as never, undefined, undefined, TODAY);
    expect(mode).toBe("monthly");
    expect(range(periodB)).toBe("2026-04-01..2026-04-30");
  });
});
