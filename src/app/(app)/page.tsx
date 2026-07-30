import Link from "next/link";
import { Wallet, TrendingUp, Activity, Sparkles, ArrowUpRight, ArrowDownRight, Star, Megaphone } from "lucide-react";
import { sql } from "@/lib/db";
import type { Account } from "@/lib/database.types";
import { aggregate, buildPnL } from "@/lib/pnl";
import { fmtRp, fmtRpFull, variance } from "@/lib/format";
import { KpiCard } from "@/components/kpi-card";
import { PeriodPicker } from "@/components/period-picker";
import { CategoryDonut, ComparisonBar } from "@/components/charts";
import { RevenueFlow } from "@/components/revenue-flow";
import { RevenueBreakdown } from "@/components/revenue-breakdown";
import { MarketingBreakdown } from "@/components/marketing-breakdown";
import { ExecutiveSummary } from "@/components/summary";
import { computePeriods, type PeriodMode } from "@/lib/period";

export const metadata = { title: "Dashboard — SMB Natura" };

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string; start?: string; end?: string }>;
}) {
  const sp = await searchParams;
  const mode = (sp.mode ?? "monthly") as PeriodMode;
  const { periodA, periodB, labelA, labelB, summary } = computePeriods(mode, sp.start, sp.end);

  const min = periodA.start < periodB.start ? periodA.start : periodB.start;
  const max = periodA.end > periodB.end ? periodA.end : periodB.end;

  const [accounts, txns] = await Promise.all([
    sql<Account[]>`select * from accounts where is_active = true order by sort_order asc`,
    sql<{ account_id: number; txn_date: string; amount: number }[]>`
      select account_id, txn_date, amount from transactions
      where txn_date >= ${min} and txn_date <= ${max}
    `,
  ]);

  const aggs = aggregate(txns, periodA, periodB);
  const pnl = buildPnL(accounts, aggs);
  const { totals } = pnl;

  const grossMarginB = totals.netRevenue[1] > 0 ? (totals.grossProfit[1] / totals.netRevenue[1]) * 100 : 0;
  const opMarginB = totals.netRevenue[1] > 0 ? (totals.opIncome[1] / totals.netRevenue[1]) * 100 : 0;
  const netMarginB = totals.netRevenue[1] > 0 ? (totals.netIncome[1] / totals.netRevenue[1]) * 100 : 0;

  const items = pnl.rows.filter((r) => r.kind === "item").map((r) => ({
    label: r.account.name,
    a: r.a,
    b: r.b,
    section: r.account.section,
    category: r.account.category,
  }));
  const expenseItems = items.filter((r) => r.section === "opex" || r.section === "cogs");
  const biggest = [...expenseItems].sort((a, b) => b.b - a.b)[0];
  const withDelta = expenseItems.filter((r) => Math.abs(r.b - r.a) > 1_000_000);
  const biggestUp = [...withDelta].sort((a, b) => (b.b - b.a) - (a.b - a.a))[0];
  const biggestDown = [...withDelta].sort((a, b) => (a.b - a.a) - (b.b - b.a))[0];
  const top10 = [...expenseItems].sort((x, y) => y.b - x.b).slice(0, 10)
    .map((r) => ({ name: r.label, a: r.a, b: r.b }));

  // Marketing insight
  const marketing = totals.opexByCategory.find((c) => c.category === "Pemasaran");
  const marketingPct = marketing && totals.netRevenue[1] > 0
    ? (marketing.b / totals.netRevenue[1]) * 100 : 0;
  const marketingItems = items.filter((r) => r.category === "Pemasaran" && r.b > 0);

  // Revenue breakdown (Penjualan / Retur / Diskon)
  const penjualanRow = items.find((r) => r.label === "Penjualan");
  const returRow = items.find((r) => r.label === "Retur Penjualan");
  const diskonRow = items.find((r) => r.label === "Diskon Penjualan");
  const penjualanB = penjualanRow?.b ?? 0;
  const returB = Math.abs(returRow?.b ?? 0);
  const diskonB = Math.abs(diskonRow?.b ?? 0);

  const hasData = totals.netRevenue[1] !== 0 || totals.opex[1] !== 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>
            CV Loka Bumi Persada · {summary}
          </p>
        </div>
        <Link href="/transactions/new" className="btn"><Sparkles size={16} /> Catat Transaksi</Link>
      </div>

      <PeriodPicker />

      {!hasData ? (
        <div className="card p-12 text-center">
          <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>
            <Wallet size={28} />
          </div>
          <p className="mb-2 text-lg font-semibold">Belum ada transaksi di periode ini</p>
          <p className="text-sm mb-6" style={{ color: "var(--muted)" }}>
            Tambahkan transaksi dulu untuk melihat laporan.
          </p>
          <Link href="/transactions/new" className="btn">+ Catat Transaksi Baru</Link>
        </div>
      ) : (
        <>
          {/* Executive Summary */}
          <ExecutiveSummary
            omsetA={totals.netRevenue[0]} omsetB={totals.netRevenue[1]}
            netA={totals.netIncome[0]} netB={totals.netIncome[1]}
            netMarginB={netMarginB}
            biggestExpense={biggest ? { label: biggest.label, b: biggest.b } : null}
            biggestUp={biggestUp ? { label: biggestUp.label, a: biggestUp.a, b: biggestUp.b } : null}
            marketingPct={marketingPct}
            periodBLabel={labelB}
            periodALabel={labelA}
          />

          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard
              label="Omset"
              valueA={totals.netRevenue[0]}
              valueB={totals.netRevenue[1]}
              labelA={labelA}
              tone="revenue"
              icon={<Wallet size={18} />}
              hint="Pendapatan operasional bersih (setelah retur & diskon)"
            />
            <KpiCard
              label="Laba Kotor"
              valueA={totals.grossProfit[0]}
              valueB={totals.grossProfit[1]}
              labelA={labelA}
              margin={grossMarginB}
              tone="health"
              icon={<Activity size={18} />}
              hint="Omset dikurangi harga pokok penjualan"
            />
            <KpiCard
              label="Laba Operasional"
              valueA={totals.opIncome[0]}
              valueB={totals.opIncome[1]}
              labelA={labelA}
              margin={opMarginB}
              tone="expense"
              icon={<TrendingUp size={18} />}
              hint="Laba dari kegiatan operasi utama"
            />
            <KpiCard
              label="Laba Bersih"
              valueA={totals.netIncome[0]}
              valueB={totals.netIncome[1]}
              labelA={labelA}
              margin={netMarginB}
              tone="profit"
              icon={<Star size={18} />}
              hint="Yang tersisa setelah semua beban & pajak"
            />
          </div>

          {/* Revenue Breakdown (Penjualan → Retur → Diskon → Net) */}
          {penjualanB > 0 && (
            <div className="card p-6">
              <div className="flex items-baseline justify-between mb-4 gap-2 flex-wrap">
                <h2 className="text-lg font-bold">Cara Omset Terbentuk</h2>
                <p className="text-xs" style={{ color: "var(--muted)" }}>Dari penjualan kotor hingga omset bersih</p>
              </div>
              <RevenueBreakdown
                penjualan={penjualanB}
                retur={returB}
                diskon={diskonB}
                netRevenue={totals.netRevenue[1]}
              />
            </div>
          )}

          {/* Hero: Revenue Flow */}
          <div className="card p-6">
            <div className="flex items-baseline justify-between mb-4 gap-2 flex-wrap">
              <h2 className="text-lg font-bold">Kemana omset Anda terpakai?</h2>
              <p className="text-xs" style={{ color: "var(--muted)" }}>Dari setiap Rp yang masuk, ini pembagiannya</p>
            </div>
            <RevenueFlow
              omset={totals.netRevenue[1]}
              cogs={totals.cogs[1]}
              opex={totals.opex[1]}
              nonOp={totals.nonOpNet[1]}
              tax={totals.tax[1]}
              net={totals.netIncome[1]}
            />
          </div>

          {/* Highlights */}
          {(biggest || biggestUp || biggestDown) && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {biggest && (
                <Highlight
                  tone="neutral" icon={<Star size={16} />}
                  title="Beban terbesar bulan ini"
                  name={biggest.label}
                  body={`${fmtRpFull(biggest.b)} · ${(biggest.b / (totals.netRevenue[1] || 1) * 100).toFixed(1)}% dari omset`}
                />
              )}
              {biggestUp && biggestUp.b > biggestUp.a && (
                <Highlight
                  tone="up" icon={<ArrowUpRight size={16} />}
                  title="Naik paling tajam"
                  name={biggestUp.label}
                  body={`+${fmtRp(biggestUp.b - biggestUp.a)} (${variance(biggestUp.a, biggestUp.b).toFixed(1)}%)`}
                />
              )}
              {biggestDown && biggestDown.b < biggestDown.a && (
                <Highlight
                  tone="down" icon={<ArrowDownRight size={16} />}
                  title="Turun paling tajam"
                  name={biggestDown.label}
                  body={`${fmtRp(biggestDown.b - biggestDown.a)} (${variance(biggestDown.a, biggestDown.b).toFixed(1)}%)`}
                />
              )}
            </div>
          )}

          {/* Marketing breakdown per channel */}
          {marketingItems.length > 0 && (
            <div className="card p-6">
              <div className="flex items-baseline justify-between mb-4 gap-2 flex-wrap">
                <h2 className="text-lg font-bold">Breakdown Iklan per Channel</h2>
                <p className="text-xs" style={{ color: "var(--muted)" }}>Kemana anggaran iklan mengalir</p>
              </div>
              <MarketingBreakdown items={marketingItems.map((i) => ({ label: i.label, b: i.b }))} />
            </div>
          )}

          {/* Marketing insight */}
          {marketing && marketing.b > 0 && (
            <div className="card p-5" style={{ borderLeft: "4px solid var(--expense)" }}>
              <div className="flex items-start gap-4 flex-wrap">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: "var(--expense-soft)", color: "var(--expense)" }}>
                  <Megaphone size={22} />
                </div>
                <div className="flex-1 min-w-[260px]">
                  <div className="text-xs uppercase tracking-wide font-semibold mb-1" style={{ color: "var(--muted)" }}>
                    Belanja iklan & pemasaran
                  </div>
                  <div className="text-2xl font-bold" style={{ color: "var(--expense)" }}>{fmtRpFull(marketing.b)}</div>
                  <p className="text-sm mt-1" style={{ color: "var(--muted-fg)" }}>
                    Setara <b>{marketingPct.toFixed(1)}%</b> dari omset — dari setiap Rp 100 penjualan, {(marketingPct).toFixed(0)} Rp habis untuk iklan.
                  </p>
                </div>
                <div className="w-full sm:w-64">
                  <div className="text-[11px] mb-1.5 flex justify-between" style={{ color: "var(--muted)" }}>
                    <span>vs periode sebelumnya</span>
                    <span className={variance(marketing.a, marketing.b) >= 0 ? "" : ""} style={{ color: variance(marketing.a, marketing.b) >= 0 ? "var(--neg)" : "var(--pos)" }}>
                      {variance(marketing.a, marketing.b) >= 0 ? "▲" : "▼"} {Math.abs(variance(marketing.a, marketing.b)).toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--sub)" }}>
                    <div className="h-full" style={{ width: `${Math.min(100, marketingPct)}%`, background: "var(--expense)" }} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Composition + MoM */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="card p-5">
              <h2 className="text-sm font-bold mb-3">Komposisi Beban Operasional</h2>
              <p className="text-xs mb-2" style={{ color: "var(--muted)" }}>Persentase per kategori beban</p>
              <CategoryDonut data={totals.opexByCategory.map((c) => ({ category: c.category, b: c.b }))} />
            </div>
            <div className="card p-5">
              <h2 className="text-sm font-bold mb-3">Perbandingan per Kategori</h2>
              <p className="text-xs mb-2" style={{ color: "var(--muted)" }}>Naik-turun beban setiap kategori</p>
              <ComparisonBar
                data={totals.opexByCategory.map((c) => ({ name: c.category, a: c.a, b: c.b }))}
                labelA={labelA} labelB={labelB}
              />
            </div>
          </div>

          {/* Top 10 */}
          <div className="card p-5">
            <h2 className="text-sm font-bold mb-3">Top 10 Item Beban</h2>
            <p className="text-xs mb-2" style={{ color: "var(--muted)" }}>Beban terbesar bulan ini (bar biru) vs sebelumnya (bar abu-abu)</p>
            <ComparisonBar
              data={top10}
              labelA={labelA} labelB={labelB}
              horizontal
              height={430}
            />
          </div>
        </>
      )}
    </div>
  );
}

function Highlight({ tone, title, name, body, icon }: { tone: "neutral" | "up" | "down"; title: string; name: string; body: string; icon: React.ReactNode }) {
  const color = tone === "up" ? "var(--neg)" : tone === "down" ? "var(--pos)" : "var(--accent)";
  const soft = tone === "up" ? "var(--neg-soft)" : tone === "down" ? "var(--pos-soft)" : "var(--accent-soft)";
  return (
    <div className="card p-4 flex items-start gap-3">
      <div className="w-9 h-9 rounded-lg shrink-0 flex items-center justify-center" style={{ background: soft, color }}>
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-[11px] uppercase tracking-wide font-semibold mb-1" style={{ color: "var(--muted)" }}>{title}</div>
        <div className="font-semibold truncate">{name}</div>
        <div className="text-xs mt-0.5" style={{ color: "var(--muted-fg)" }}>{body}</div>
      </div>
    </div>
  );
}
