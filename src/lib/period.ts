export type PeriodMode = "daily" | "weekly" | "monthly" | "yearly" | "custom";

export const PERIOD_MODES: { key: PeriodMode; label: string }[] = [
  { key: "daily", label: "Harian" },
  { key: "weekly", label: "Mingguan" },
  { key: "monthly", label: "Bulanan" },
  { key: "yearly", label: "Tahunan" },
  { key: "custom", label: "Custom" },
];

export type PeriodResult = {
  mode: PeriodMode;
  periodA: { start: string; end: string };
  periodB: { start: string; end: string };
  labelA: string;
  labelB: string;
  summary: string;
};

const iso = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const addDays = (d: Date, n: number) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};

const fmtId = (d: Date, opts: Intl.DateTimeFormatOptions) =>
  d.toLocaleDateString("id-ID", opts);

/**
 * Hitung periode utama (B) + periode banding (A) dari mode filter.
 * Custom: user tentukan start/end untuk B; A dihitung otomatis = range sebelumnya sama panjang.
 */
export function computePeriods(
  mode: PeriodMode,
  customStart?: string,
  customEnd?: string,
  today: Date = new Date(),
): PeriodResult {
  const t = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  if (mode === "daily") {
    const y = addDays(t, -1);
    return {
      mode,
      periodA: { start: iso(y), end: iso(y) },
      periodB: { start: iso(t), end: iso(t) },
      labelA: `Kemarin (${fmtId(y, { day: "numeric", month: "short" })})`,
      labelB: `Hari ini (${fmtId(t, { day: "numeric", month: "short" })})`,
      summary: `Harian · ${fmtId(t, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}`,
    };
  }

  if (mode === "weekly") {
    // ISO week: Senin = start of week
    const dow = t.getDay() || 7; // Sun=0 → 7
    const monday = addDays(t, 1 - dow);
    const sunday = addDays(monday, 6);
    const prevMonday = addDays(monday, -7);
    const prevSunday = addDays(monday, -1);
    return {
      mode,
      periodA: { start: iso(prevMonday), end: iso(prevSunday) },
      periodB: { start: iso(monday), end: iso(sunday) },
      labelA: `Minggu lalu (${fmtId(prevMonday, { day: "numeric", month: "short" })} – ${fmtId(prevSunday, { day: "numeric", month: "short" })})`,
      labelB: `Minggu ini (${fmtId(monday, { day: "numeric", month: "short" })} – ${fmtId(sunday, { day: "numeric", month: "short" })})`,
      summary: `Mingguan · ${fmtId(monday, { day: "numeric", month: "short" })} – ${fmtId(sunday, { day: "numeric", month: "short", year: "numeric" })}`,
    };
  }

  if (mode === "yearly") {
    const y = t.getFullYear();
    const startB = new Date(y, 0, 1);
    const startA = new Date(y - 1, 0, 1);
    const endA = new Date(y - 1, t.getMonth(), t.getDate());
    return {
      mode,
      periodA: { start: iso(startA), end: iso(endA) },
      periodB: { start: iso(startB), end: iso(t) },
      labelA: `YTD ${y - 1}`,
      labelB: `YTD ${y}`,
      summary: `Tahunan · YTD ${y} vs YTD ${y - 1}`,
    };
  }

  if (mode === "custom") {
    const startB = customStart ?? iso(t);
    const endB = customEnd ?? iso(t);
    const dB0 = new Date(startB);
    const dB1 = new Date(endB);
    const days = Math.max(1, Math.round((dB1.getTime() - dB0.getTime()) / 86_400_000) + 1);
    const dA1 = addDays(dB0, -1);
    const dA0 = addDays(dA1, -(days - 1));
    return {
      mode,
      periodA: { start: iso(dA0), end: iso(dA1) },
      periodB: { start: startB, end: endB },
      labelA: `${fmtId(dA0, { day: "numeric", month: "short" })} – ${fmtId(dA1, { day: "numeric", month: "short", year: "numeric" })}`,
      labelB: `${fmtId(dB0, { day: "numeric", month: "short" })} – ${fmtId(dB1, { day: "numeric", month: "short", year: "numeric" })}`,
      summary: `Custom · ${fmtId(dB0, { day: "numeric", month: "short" })} – ${fmtId(dB1, { day: "numeric", month: "short", year: "numeric" })}`,
    };
  }

  // Bulanan (default)
  const startB = new Date(t.getFullYear(), t.getMonth(), 1);
  const endB = new Date(t.getFullYear(), t.getMonth() + 1, 0);
  const startA = new Date(t.getFullYear(), t.getMonth() - 1, 1);
  const endA = new Date(t.getFullYear(), t.getMonth(), 0);
  return {
    mode: "monthly",
    periodA: { start: iso(startA), end: iso(endA) },
    periodB: { start: iso(startB), end: iso(endB) },
    labelA: fmtId(startA, { month: "long", year: "numeric" }),
    labelB: fmtId(startB, { month: "long", year: "numeric" }),
    summary: `Bulanan · ${fmtId(startB, { month: "long", year: "numeric" })} vs ${fmtId(startA, { month: "long", year: "numeric" })}`,
  };
}
