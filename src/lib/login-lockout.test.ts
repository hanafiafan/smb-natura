import { describe, expect, test } from "vitest";
import { afterFailedAttempt, isLocked, minutesRemaining, RESET_STATE, MAX_LOGIN_ATTEMPTS } from "./login-lockout";

describe("login-lockout", () => {
  test("fresh account is never locked", () => {
    expect(isLocked(RESET_STATE)).toBe(false);
  });

  test("bad attempts below the threshold just increment the counter", () => {
    let state = RESET_STATE;
    for (let i = 0; i < MAX_LOGIN_ATTEMPTS - 1; i++) state = afterFailedAttempt(state);
    expect(state.failed_attempts).toBe(MAX_LOGIN_ATTEMPTS - 1);
    expect(isLocked(state)).toBe(false);
  });

  test("reaching the threshold locks the account and resets the counter", () => {
    let state = RESET_STATE;
    for (let i = 0; i < MAX_LOGIN_ATTEMPTS; i++) state = afterFailedAttempt(state);
    expect(state.failed_attempts).toBe(0);
    expect(isLocked(state)).toBe(true);
  });

  test("lock expires after the lockout window passes", () => {
    const now = new Date("2026-01-01T00:00:00Z");
    let state = RESET_STATE;
    for (let i = 0; i < MAX_LOGIN_ATTEMPTS; i++) state = afterFailedAttempt(state, now);

    const stillLocked = new Date(now.getTime() + 5 * 60_000);
    const afterWindow = new Date(now.getTime() + 20 * 60_000);
    expect(isLocked(state, stillLocked)).toBe(true);
    expect(isLocked(state, afterWindow)).toBe(false);
  });

  test("minutesRemaining rounds up and never reports 0 while locked", () => {
    const now = new Date("2026-01-01T00:00:00Z");
    let state = RESET_STATE;
    for (let i = 0; i < MAX_LOGIN_ATTEMPTS; i++) state = afterFailedAttempt(state, now);

    const almostExpired = new Date(now.getTime() + 14 * 60_000 + 59_000);
    expect(minutesRemaining(state, almostExpired)).toBe(1);
  });
});
