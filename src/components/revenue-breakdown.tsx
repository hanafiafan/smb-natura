import { fmtRp } from "@/lib/format";

/**
 * Revenue breakdown: Penjualan Bruto → -Retur → -Diskon → Omset Bersih.
 * Visual "waterfall" pakai bar bertumpuk sederhana + delta labels.
 */
export function RevenueBreakdown({
  penjualan, retur, diskon, netRevenue,
}: {
  penjualan: number;
  retur: number;        // absolut, sudah positif
  diskon: number;
  netRevenue: number;
}) {
  const anchor = Math.max(penjualan, 1);
  const returPct = (retur / anchor) * 100;
  const diskonPct = (diskon / anchor) * 100;
  const netPct = (netRevenue / anchor) * 100;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StepCard
          label="Penjualan Bruto" value={penjualan}
          color="var(--revenue)" soft="var(--revenue-soft)"
        />
        <StepCard
          label="Retur Penjualan" value={-retur} pct={returPct}
          color="var(--neg)" soft="var(--neg-soft)" negative
        />
        <StepCard
          label="Diskon Penjualan" value={-diskon} pct={diskonPct}
          color="var(--expense)" soft="var(--expense-soft)" negative
        />
        <StepCard
          label="Omset Bersih" value={netRevenue} pct={netPct}
          color="var(--profit)" soft="var(--profit-soft)" bold
        />
      </div>

      {/* Waterfall visual */}
      <div className="relative">
        <div className="h-16 flex items-end gap-1">
          <Bar label="Bruto" value={penjualan} anchor={anchor} color="var(--revenue)" showValue />
          <Bar label="Retur" value={retur} anchor={anchor} color="var(--neg)" hollow />
          <Bar label="Diskon" value={diskon} anchor={anchor} color="var(--expense)" hollow />
          <Bar label="Net" value={netRevenue} anchor={anchor} color="var(--profit)" showValue />
        </div>
      </div>

      <p className="text-xs text-center" style={{ color: "var(--muted)" }}>
        Dari <b style={{ color: "var(--revenue)" }}>{fmtRp(penjualan)}</b> penjualan kotor, hanya <b style={{ color: "var(--profit)" }}>{fmtRp(netRevenue)}</b> ({netPct.toFixed(1)}%) yang jadi omset bersih setelah retur & diskon.
      </p>
    </div>
  );
}

function StepCard({
  label, value, pct, color, soft, negative, bold,
}: {
  label: string; value: number; pct?: number;
  color: string; soft: string;
  negative?: boolean; bold?: boolean;
}) {
  return (
    <div className="rounded-lg p-3" style={{ background: soft, borderLeft: `3px solid ${color}` }}>
      <div className="text-[10px] uppercase tracking-wide font-semibold flex items-center gap-1" style={{ color: "var(--muted-fg)" }}>
        {negative && <span>−</span>}
        <span>{label}</span>
      </div>
      <div className={`text-sm mt-0.5 ${bold ? "font-bold" : "font-semibold"}`} style={{ color }}>
        {fmtRp(value)}
      </div>
      {pct != null && (
        <div className="text-[10px] mt-0.5" style={{ color: "var(--muted)" }}>
          {pct.toFixed(1)}% dari bruto
        </div>
      )}
    </div>
  );
}

function Bar({ label, value, anchor, color, hollow, showValue }: {
  label: string; value: number; anchor: number; color: string;
  hollow?: boolean; showValue?: boolean;
}) {
  const h = Math.max(2, (value / anchor) * 100);
  return (
    <div className="flex-1 flex flex-col items-center">
      {showValue && (
        <div className="text-[10px] font-semibold mb-1" style={{ color }}>{fmtRp(value)}</div>
      )}
      <div
        className="w-full rounded-t transition-all"
        style={{
          height: `${h}%`,
          background: hollow ? "transparent" : color,
          border: hollow ? `2px dashed ${color}` : "none",
          opacity: hollow ? 0.7 : 1,
        }}
      />
      <div className="text-[10px] mt-1" style={{ color: "var(--muted)" }}>{label}</div>
    </div>
  );
}
