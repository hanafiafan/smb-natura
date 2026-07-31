import { describe, expect, test } from "vitest";
import { firstOfMonth, lastOfMonth, todayISO } from "./format";

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
