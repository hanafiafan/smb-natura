import { Lightbulb, TrendingDown, TrendingUp, Minus, HeartPulse } from "lucide-react";
import { fmtRp, variance } from "@/lib/format";

export function ExecutiveSummary({
  omsetA, omsetB,
  netA, netB,
  netMarginB,
  hasRevenue,
  hasPriorPeriodData,
  biggestExpense,
  biggestUp,
  marketingPct,
  periodBLabel,
  periodALabel,
}: {
  omsetA: number; omsetB: number;
  netA: number; netB: number;
  netMarginB: number;
  /** false when this period had zero net revenue — margin % is meaningless then. */
  hasRevenue: boolean;
  /** false when the comparison period had no transactions at all (e.g. brand's first period). */
  hasPriorPeriodData: boolean;
  biggestExpense: { label: string; b: number } | null;
  biggestUp: { label: string; a: number; b: number } | null;
  marketingPct: number;
  periodBLabel: string;
  periodALabel: string;
}) {
  const omsetDelta = variance(omsetA, omsetB);
  const netDelta = variance(netA, netB);
  const netSignFlipped = hasPriorPeriodData && netA !== 0 && netB !== 0 && Math.sign(netA) !== Math.sign(netB);

  const trendWord = netSignFlipped ? (netB >= 0 ? "berbalik jadi untung" : "berbalik jadi rugi")
    : netDelta >= 5 ? "naik" : netDelta <= -5 ? "turun" : "relatif stabil";
  const TrendIcon = netSignFlipped ? (netB >= 0 ? TrendingUp : TrendingDown)
    : netDelta >= 5 ? TrendingUp : netDelta <= -5 ? TrendingDown : Minus;
  const trendColor = netSignFlipped ? (netB >= 0 ? "var(--pos)" : "var(--neg)")
    : netDelta >= 5 ? "var(--pos)" : netDelta <= -5 ? "var(--neg)" : "var(--muted-fg)";

  const insights: string[] = [];
  if (Math.abs(omsetDelta) >= 3) {
    insights.push(
      `Omset ${omsetDelta >= 0 ? "naik" : "turun"} ${Math.abs(omsetDelta).toFixed(1)}% ke ${fmtRp(omsetB)}${omsetDelta < 0 ? " — perlu perhatian" : ""}.`,
    );
  } else {
    insights.push(`Omset ${fmtRp(omsetB)} relatif sama dengan bulan sebelumnya.`);
  }
  if (biggestExpense) {
    insights.push(`Beban terbesar bulan ini adalah <b>${biggestExpense.label}</b> senilai ${fmtRp(biggestExpense.b)}.`);
  }
  if (biggestUp && biggestUp.b > biggestUp.a) {
    const delta = variance(biggestUp.a, biggestUp.b);
    insights.push(`<b>${biggestUp.label}</b> melonjak ${delta.toFixed(0)}% (+${fmtRp(biggestUp.b - biggestUp.a)}) — cek apakah wajar.`);
  }
  if (marketingPct >= 25) {
    insights.push(`Belanja iklan mencapai ${marketingPct.toFixed(0)}% dari omset — pastikan konversi sepadan.`);
  }

  const healthMsg = !hasRevenue
    ? (netB < 0 ? `Tidak ada omset periode ini — seluruh biaya (${fmtRp(Math.abs(netB))}) langsung jadi rugi.` : `Belum ada omset maupun transaksi periode ini.`)
    : netMarginB >= 15 ? `Margin laba bersih ${netMarginB.toFixed(1)}% — bisnis sehat.`
    : netMarginB >= 5 ? `Margin laba bersih ${netMarginB.toFixed(1)}% — cukup, masih bisa dioptimalkan.`
    : netMarginB >= 0 ? `Margin laba bersih tipis (${netMarginB.toFixed(1)}%) — waspada terhadap biaya.`
    : `Bisnis rugi ${Math.abs(netMarginB).toFixed(1)}% dari omset periode ini — perlu tindakan cepat.`;

  const healthColor = !hasRevenue
    ? (netB < 0 ? "var(--neg)" : "var(--muted-fg)")
    : netMarginB >= 5 ? "var(--pos)"
    : netMarginB >= 0 ? "var(--expense)"
    : "var(--neg)";

  return (
    <div className="card p-6 relative overflow-hidden"
      style={{ background: "linear-gradient(135deg, #ecfdf5 0%, #ffffff 45%, #fffbeb 100%)" }}>
      <div className="absolute -right-16 -top-16 w-56 h-56 rounded-full opacity-20 blur-3xl"
        style={{ background: "var(--color-brand-400)" }} aria-hidden />
      <div className="absolute -left-16 -bottom-16 w-56 h-56 rounded-full opacity-15 blur-3xl"
        style={{ background: "var(--color-gold-400)" }} aria-hidden />

      <div className="relative flex items-start gap-4">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-brand-sm text-white"
          style={{ background: "linear-gradient(135deg, var(--color-brand-500), var(--color-brand-700))" }}>
          <Lightbulb size={22} strokeWidth={2.2} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-2.5">
            <h2 className="text-lg font-bold text-gray-900">Ringkasan Otomatis</h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-medium"
              style={{ background: "white", color: "var(--muted-fg)", border: "1px solid var(--color-gray-200)" }}>
              {periodBLabel}
            </span>
          </div>
          <p className="text-[15px] mb-3 leading-relaxed text-gray-800 flex items-baseline gap-2 flex-wrap">
            <TrendIcon size={18} strokeWidth={2.5} className="translate-y-0.5 shrink-0" style={{ color: trendColor }} />
            <span>
              {!hasPriorPeriodData ? (
                <>Laba bersih periode ini <b>{fmtRp(netB)}</b> — belum ada data {periodALabel} untuk dibandingkan.</>
              ) : netSignFlipped ? (
                <>Laba bersih Anda <b>{trendWord}</b>, dari {fmtRp(netA)} ({periodALabel}) ke <b style={{ color: netB >= 0 ? "var(--profit)" : "var(--neg)" }}>{fmtRp(netB)}</b> ({periodBLabel}).</>
              ) : (
                <>
                  Laba bersih Anda <b>{trendWord}</b>
                  {netDelta !== 0 && <> {Math.abs(netDelta).toFixed(1)}% ke <b style={{ color: netB >= 0 ? "var(--profit)" : "var(--neg)" }}>{fmtRp(netB)}</b></>}
                  {netDelta === 0 && <> di <b>{fmtRp(netB)}</b></>}
                  {" "}dibanding {periodALabel} ({fmtRp(netA)}).
                </>
              )}
            </span>
          </p>
          <ul className="space-y-2 text-sm" style={{ color: "var(--muted-fg)" }}>
            {insights.map((t, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full mt-2 shrink-0" style={{ background: "var(--color-brand-500)" }} />
                <span dangerouslySetInnerHTML={{ __html: t }} />
              </li>
            ))}
          </ul>
          <p className="text-sm mt-4 pt-3.5 font-semibold flex items-center gap-2"
            style={{ borderTop: "1px dashed var(--color-gray-200)", color: healthColor }}>
            <HeartPulse size={16} strokeWidth={2.4} className="shrink-0" />
            <span>{healthMsg}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
