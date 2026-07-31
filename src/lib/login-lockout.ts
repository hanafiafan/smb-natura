/** Account lockout policy after repeated bad passwords. Pure logic — actions.ts persists the result. */

export const MAX_LOGIN_ATTEMPTS = 5;
export const LOCKOUT_MINUTES = 15;

export type LockoutState = { failed_attempts: number; locked_until: string | null };

export const RESET_STATE: LockoutState = { failed_attempts: 0, locked_until: null };

export function isLocked(state: LockoutState, now = new Date()): boolean {
  return !!state.locked_until && new Date(state.locked_until) > now;
}

export function minutesRemaining(state: LockoutState, now = new Date()): number {
  if (!state.locked_until) return 0;
  return Math.max(1, Math.ceil((new Date(state.locked_until).getTime() - now.getTime()) / 60_000));
}

export function afterFailedAttempt(state: LockoutState, now = new Date()): LockoutState {
  const attempts = state.failed_attempts + 1;
  if (attempts >= MAX_LOGIN_ATTEMPTS) {
    return { failed_attempts: 0, locked_until: new Date(now.getTime() + LOCKOUT_MINUTES * 60_000).toISOString() };
  }
  return { failed_attempts: attempts, locked_until: null };
}
