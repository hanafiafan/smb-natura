import { describe, expect, test } from "vitest";
import { firstOfMonth, lastOfMonth, parseISODateLocal, safeISODate, todayISO } from "./format";

describe("date boundaries", () => {
  test("lastOfMonth returns the actual last day, not a UTC-shifted one", () => {
    // Regression: an earlier version routed through `.toISOString()`, which converts to UTC
    // and silently drops a day in any positive-UTC-offset timezone (e.g. Asia/Jakarta, UTC+7).
    expect(lastOfMonth(new Date(2026, 6, 15))).toBe("2026-07-31"); // July has 31 days
    expect(lastOfMonth(new Date(2026, 1, 10))).toBe("2026-02-28"); // Feb 2026 is not a leap year
    expect(lastOfMonth(new Date(2028, 1, 10))).toBe("2028-02-29"); // Feb 2028 is a leap year
  });

  test("firstOfMonth pads the month correctly", () => {
    expect(firstOfMonth(new Date(2026, 2, 20))).toBe("2026-03-01");
  });

  test("todayISO reflects local date components, not a UTC-shifted one", () => {
    expect(todayISO(new Date(2026, 6, 31, 23, 0))).toBe("2026-07-31");
  });
});

describe("safeISODate", () => {
  test("accepts a well-formed date", () => {
    expect(safeISODate("2026-04-15", "2026-01-01")).toBe("2026-04-15");
  });

  test("rejects a calendar date that doesn't exist", () => {
    // Regression: `new Date("2026-02-30")` rolls over to 2 Mar rather than going NaN, so a
    // shape-only check let it through to Postgres as a `date` literal and threw a 500.
    expect(safeISODate("2026-02-30", "2026-01-01")).toBe("2026-01-01");
    expect(safeISODate("2026-13-01", "2026-01-01")).toBe("2026-01-01");
    expect(safeISODate("2026-02-29", "2026-01-01")).toBe("2026-01-01"); // 2026 isn't a leap year
    expect(safeISODate("2028-02-29", "2026-01-01")).toBe("2028-02-29"); // 2028 is
  });

  test("rejects malformed or missing input", () => {
    expect(safeISODate("15/04/2026", "2026-01-01")).toBe("2026-01-01");
    expect(safeISODate(undefined, "2026-01-01")).toBe("2026-01-01");
  });
});

describe("parseISODateLocal", () => {
  test("lands on local midnight of the same calendar day", () => {
    const d = parseISODateLocal("2026-04-15");
    expect([d.getFullYear(), d.getMonth(), d.getDate(), d.getHours()]).toEqual([2026, 3, 15, 0]);
  });
});
