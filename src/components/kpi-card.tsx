import type { ReactNode } from "react";
import { fmtRp, variance } from "@/lib/format";

type Tone = "revenue" | "profit" | "expense" | "health";

const TONE: Record<Tone, { color: string; soft: string; gradient: string }> = {
  revenue: {
    color: "var(--revenue)",
    soft: "var(--revenue-soft)",
    gradient: "linear-gradient(135deg, #ecfdf5 0%, #ffffff 55%)",
  },
  profit: {
    color: "var(--profit)",
    soft: "var(--profit-soft)",
    gradient: "linear-gradient(135deg, #f0fdfa 0%, #ffffff 55%)",
  },
  expense: {
    color: "var(--expense)",
    soft: "var(--expense-soft)",
    gradient: "linear-gradient(135deg, #fffbeb 0%, #ffffff 55%)",
  },
  health: {
    color: "var(--health)",
    soft: "var(--health-soft)",
    gradient: "linear-gradient(135deg, #f0fdfa 0%, #ffffff 55%)",
  },
};

export function KpiCard({
  label,
  valueA,
  valueB,
  labelA = "Sebelumnya",
  margin,
  tone = "profit",
  icon,
  hint,
}: {
  label: string;
  valueA: number;
  valueB: number;
  labelA?: string;
  margin?: number;
  tone?: Tone;
  icon?: ReactNode;
  hint?: string;
}) {
  const delta = variance(valueA, valueB);
  const positive = delta >= 0;
  const t = TONE[tone];
  return (
    <div
      className="card p-5 relative overflow-hidden group hover:shadow-theme-md transition-shadow"
      style={{ background: t.gradient }}
    >
      {/* accent stripe */}
      <div className="absolute top-0 left-0 right-0 h-1"
        style={{ background: `linear-gradient(90deg, ${t.color}, transparent)` }} />

      <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full opacity-30 blur-xl pointer-events-none"
        style={{ background: t.soft }} aria-hidden />

      <div className="relative">
        <div className="flex items-start justify-between gap-2 mb-4">
          <div className="text-[11px] uppercase tracking-wider font-bold" style={{ color: "var(--muted)" }}>
            {label}
          </div>
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-theme-xs"
            style={{ background: t.color, color: "white" }}
          >
            {icon}
          </div>
        </div>
        <div className="text-[26px] font-bold tracking-tight leading-none" style={{ color: t.color }}>
          {fmtRp(valueB)}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px]" style={{ color: "var(--muted-fg)" }}>
          <span>{labelA}: <b>{fmtRp(valueA)}</b></span>
          <span className={`badge ${positive ? "badge-pos" : "badge-neg"}`}>
            {positive ? "▲" : "▼"} {Math.abs(delta).toFixed(1)}%
          </span>
          {margin != null && (
            <span className="font-medium">· {margin.toFixed(1)}% omset</span>
          )}
        </div>
        {hint && (
          <p className="text-[11px] mt-2.5" style={{ color: "var(--muted)" }}>{hint}</p>
        )}
      </div>
    </div>
  );
}
