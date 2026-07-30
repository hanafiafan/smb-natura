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

export function fmtDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function firstOfMonth(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

export function lastOfMonth(d = new Date()): string {
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  return end.toISOString().slice(0, 10);
}

export function firstOfPrevMonth(d = new Date()): string {
  const prev = new Date(d.getFullYear(), d.getMonth() - 1, 1);
  return firstOfMonth(prev);
}

export function lastOfPrevMonth(d = new Date()): string {
  const prev = new Date(d.getFullYear(), d.getMonth() - 1, 1);
  return lastOfMonth(prev);
}
