export function fmtRp(n: number | null | undefined): string {
  if (n == null || n === 0) return "Rp 0";
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  if (abs >= 1_000_000_000)
    return `${sign}Rp ${(abs / 1e9).toLocaleString("id-ID", { maximumFractionDigits: 2 })} M`;
  if (abs >= 1_000_000)
    return `${sign}Rp ${(abs / 1e6).toLocaleString("id-ID", { maximumFractionDigits: 1 })} jt`;
  if (abs >= 1_000)
    return `${sign}Rp ${Math.round(abs / 1e3).toLocaleString("id-ID")} rb`;
  return `${sign}Rp ${abs.toLocaleString("id-ID")}`;
}

export function fmtRpFull(n: number | null | undefined): string {
  if (n == null || n === 0) return "Rp 0";
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  return `${sign}Rp ${abs.toLocaleString("id-ID", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export function fmtPct(p: number | null | undefined, digits = 2): string {
  if (p == null || !isFinite(p)) return "—";
  return `${p.toFixed(digits)}%`;
}

export function variance(a: number, b: number): number {
  if (a === 0) return b === 0 ? 0 : 100;
  return ((b - a) / Math.abs(a)) * 100;
}

/** "YYYY-MM-DD" → local Date at midnight. `new Date(iso)` parses a date-only string as
 * UTC midnight, which then formats/shifts to the *previous* day in any negative-UTC-offset
 * timezone — so every date-column value must go through here, never through new Date(). */
export function parseISODateLocal(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Guards a `date`-column query param: a malformed value (bad shape, non-existent date
 * like "2026-02-30") would otherwise reach Postgres as a raw string and throw an
 * unhandled "invalid input syntax for type date" 500, or land unsanitized in a CSV
 * export filename. Falls back silently instead of erroring the whole page/export. */
export function safeISODate(value: string | undefined | null, fallback: string): string {
  if (!value || !ISO_DATE_RE.test(value)) return fallback;
  // Round-trip guard: Date happily rolls a non-existent date over ("2026-02-30" becomes
  // 2 Mar), so it never reads back as invalid — only comparing the components catches it.
  const [y, m, d] = value.split("-").map(Number);
  const parsed = parseISODateLocal(value);
  const real = parsed.getFullYear() === y && parsed.getMonth() === m - 1 && parsed.getDate() === d;
  return real ? value : fallback;
}

export function fmtDate(iso: string): string {
  return parseISODateLocal(iso).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}

export function todayISO(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function firstOfMonth(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

export function lastOfMonth(d = new Date()): string {
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  return `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, "0")}-${String(end.getDate()).padStart(2, "0")}`;
}

export function firstOfPrevMonth(d = new Date()): string {
  const prev = new Date(d.getFullYear(), d.getMonth() - 1, 1);
  return firstOfMonth(prev);
}

export function lastOfPrevMonth(d = new Date()): string {
  const prev = new Date(d.getFullYear(), d.getMonth() - 1, 1);
  return lastOfMonth(prev);
}
