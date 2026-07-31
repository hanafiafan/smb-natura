"use client";

import { CalendarRange } from "lucide-react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTransition } from "react";
import { PERIOD_MODES, type PeriodMode } from "@/lib/period";
import { todayISO } from "@/lib/format";
import { cn } from "@/lib/utils";

export function PeriodPicker() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [pending, start] = useTransition();

  const mode = (sp.get("mode") ?? "monthly") as PeriodMode;
  const customStart = sp.get("start") ?? todayISO();
  const customEnd = sp.get("end") ?? todayISO();

  const setMode = (m: PeriodMode) => {
    const q = new URLSearchParams();
    q.set("mode", m);
    if (m === "custom") {
      q.set("start", customStart);
      q.set("end", customEnd);
    }
    start(() => router.push(`${pathname}?${q.toString()}`, { scroll: false }));
  };

  const updateCustom = (key: "start" | "end", value: string) => {
    const q = new URLSearchParams(sp);
    q.set("mode", "custom");
    q.set(key, value);
    start(() => router.push(`${pathname}?${q.toString()}`, { scroll: false }));
  };

  return (
    <div className={cn("card p-5 no-print", pending && "opacity-70")}>
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg grid place-items-center text-brand-600" style={{ background: "var(--color-brand-50)" }}>
          <CalendarRange size={16} />
        </div>
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Rentang Periode</div>
          <div className="text-[13px] text-gray-800 font-medium">Pilih tampilan data yang ingin dilihat</div>
        </div>
      </div>

      <div className="inline-flex rounded-xl p-1 border border-gray-200 bg-white gap-0.5 flex-wrap">
        {PERIOD_MODES.map((m) => {
          const active = mode === m.key;
          return (
            <button
              key={m.key}
              type="button"
              onClick={() => setMode(m.key)}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-semibold transition-all",
                active
                  ? "text-white shadow-brand-sm"
                  : "text-gray-600 hover:bg-brand-25 hover:text-brand-700",
              )}
              style={active ? { background: "linear-gradient(135deg, var(--color-brand-500), var(--color-brand-600))" } : undefined}
            >
              {m.label}
            </button>
          );
        })}
      </div>

      {mode === "custom" && (
        <div className="flex flex-wrap items-end gap-3 mt-4 pt-4" style={{ borderTop: "1px dashed var(--color-gray-200)" }}>
          <div>
            <label className="label">Dari tanggal</label>
            <input type="date" className="input" value={customStart} onChange={(e) => updateCustom("start", e.target.value)} />
          </div>
          <div>
            <label className="label">Sampai tanggal</label>
            <input type="date" className="input" value={customEnd} onChange={(e) => updateCustom("end", e.target.value)} />
          </div>
          <p className="text-[11px] pb-3" style={{ color: "var(--muted)" }}>
            Data dibandingkan otomatis dengan periode sebelumnya yang panjangnya sama.
          </p>
        </div>
      )}
    </div>
  );
}
