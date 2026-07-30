"use client";

import { fmtRp } from "@/lib/format";

type Slice = { label: string; value: number; color: string; soft: string };

export function RevenueFlow({
  omset,
  cogs,
  opex,
  nonOp,
  tax,
  net,
}: {
  omset: number;
  cogs: number;
  opex: number;
  nonOp: number;      // net non-operational (bisa negatif = beban lebih besar)
  tax: number;
  net: number;
}) {
  // Non-op net: positif = tambah income (kurangi block), negatif = beban tambahan
  const nonOpExpense = nonOp < 0 ? -nonOp : 0;
  const nonOpIncome = nonOp > 0 ? nonOp : 0;

  const slices: Slice[] = [
    { label: "Laba Bersih", value: Math.max(0, net), color: "var(--profit)", soft: "var(--profit-soft)" },
    { label: "Pajak", value: tax, color: "var(--tax)", soft: "var(--tax-soft)" },
    { label: "Beban Non-Op", value: nonOpExpense, color: "#94a3b8", soft: "#f1f5f9" },
    { label: "Beban Operasional", value: opex, color: "var(--expense)", soft: "var(--expense-soft)" },
    { label: "Beban Pokok Penjualan", value: cogs, color: "#facc15", soft: "#fef9c3" },
  ].filter((s) => s.value > 0);

  // Kalau laba rugi negatif, tampilkan block "Rugi" merah
  if (net < 0) {
    slices.unshift({ label: "Rugi Bersih", value: -net, color: "var(--neg)", soft: "var(--neg-soft)" });
  }

  // Anchor omset (fallback ke jumlah slices kalau non-op income menambah omset)
  const totalOut = slices.reduce((s, x) => s + x.value, 0);
  const anchor = Math.max(omset + nonOpIncome, totalOut);

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between gap-4 flex-wrap">
        <div>
          <div className="text-xs uppercase tracking-wide font-semibold" style={{ color: "var(--muted)" }}>
            Omset periode ini
          </div>
          <div className="text-3xl font-bold" style={{ color: "var(--revenue)" }}>{fmtRp(omset)}</div>
        </div>
        <div className="text-right">
          <div className="text-xs uppercase tracking-wide font-semibold" style={{ color: "var(--muted)" }}>
            Yang tersisa jadi laba
          </div>
          <div className="text-2xl font-bold" style={{ color: net >= 0 ? "var(--profit)" : "var(--neg)" }}>
            {fmtRp(net)} <span className="text-sm font-medium" style={{ color: "var(--muted)" }}>({omset > 0 ? ((net / omset) * 100).toFixed(1) : 0}%)</span>
          </div>
        </div>
      </div>

      <div className="flex h-14 rounded-xl overflow-hidden shadow-inner" style={{ background: "#f8fafc" }} role="img" aria-label="Aliran uang dari omset ke laba">
        {slices.map((s) => {
          const width = (s.value / anchor) * 100;
          if (width < 0.4) return null;
          return (
            <div
              key={s.label}
              className="relative flex items-center justify-center text-xs font-semibold transition-all hover:brightness-95"
              style={{ width: `${width}%`, background: s.color, color: "white", minWidth: 4 }}
              title={`${s.label}: ${fmtRp(s.value)} (${((s.value / omset) * 100).toFixed(1)}% dari omset)`}
            >
              {width > 6 && (
                <span className="truncate px-2">{Math.round((s.value / omset) * 100)}%</span>
              )}
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {slices.map((s) => (
          <div key={s.label} className="rounded-lg p-3" style={{ background: s.soft, borderLeft: `3px solid ${s.color}` }}>
            <div className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: "var(--muted-fg)" }}>{s.label}</div>
            <div className="text-sm font-bold mt-0.5" style={{ color: s.color }}>{fmtRp(s.value)}</div>
            <div className="text-[11px]" style={{ color: "var(--muted)" }}>
              {omset > 0 ? ((s.value / omset) * 100).toFixed(1) : "0"}% dari omset
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
