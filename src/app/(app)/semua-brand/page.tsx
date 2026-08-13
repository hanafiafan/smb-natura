import { Wallet, Activity, TrendingUp, Star } from "lucide-react";
import { sql } from "@/lib/db";
import { getSession } from "@/lib/session";
import { getAccessibleBrands } from "@/lib/brands";
import type { Account } from "@/lib/database.types";
import { aggregate, buildPnL, relevantAccounts } from "@/lib/pnl";
import { fmtRpFull, fmtPct } from "@/lib/format";
import { KpiCard } from "@/components/kpi-card";
import { PeriodPicker } from "@/components/period-picker";
import { computePeriods, type PeriodMode } from "@/lib/period";

export const metadata = { title: "Semua Brand — SMB Natura" };

type BrandTotals = {
  brandId: number;
  brandName: string;
  companyId: number;
  companyName: string;
  netRevenue: [number, number];
  grossProfit: [number, number];
  opIncome: [number, number];
  netIncome: [number, number];
};

export default async function AllBrandsPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string; start?: string; end?: string }>;
}) {
  const sp = await searchParams;
  const mode = (sp.mode ?? "monthly") as PeriodMode;
  const { periodA, periodB, labelA, labelB, summary } = computePeriods(mode, sp.start, sp.end);

  const min = periodA.start < periodB.start ? periodA.start : periodB.start;
  const max = periodA.end > periodB.end ? periodA.end : periodB.end;

  const session = await getSession();
  const brands = await getAccessibleBrands(session.userId!, session.role!);

  const perBrand: BrandTotals[] = await Promise.all(
    brands.map(async (b): Promise<BrandTotals> => {
      const [allAccounts, txns] = await Promise.all([
        sql<Account[]>`select * from accounts where brand_id = ${b.id} order by sort_order asc`,
        sql<{ account_id: number; txn_date: string; amount: number }[]>`
          select account_id, txn_date, amount from transactions
          where brand_id = ${b.id} and txn_date >= ${min} and txn_date <= ${max}
        `,
      ]);
      const aggs = aggregate(txns, periodA, periodB);
      const { totals } = buildPnL(relevantAccounts(allAccounts, aggs), aggs);
      return {
        brandId: b.id,
        brandName: b.name,
        companyId: b.company_id,
        companyName: b.company_name,
        netRevenue: totals.netRevenue,
        grossProfit: totals.grossProfit,
        opIncome: totals.opIncome,
        netIncome: totals.netIncome,
      };
    }),
  );

  const grand = perBrand.reduce(
    (acc, b) => ({
      netRevenue: [acc.netRevenue[0] + b.netRevenue[0], acc.netRevenue[1] + b.netRevenue[1]] as [number, number],
      grossProfit: [acc.grossProfit[0] + b.grossProfit[0], acc.grossProfit[1] + b.grossProfit[1]] as [number, number],
      opIncome: [acc.opIncome[0] + b.opIncome[0], acc.opIncome[1] + b.opIncome[1]] as [number, number],
      netIncome: [acc.netIncome[0] + b.netIncome[0], acc.netIncome[1] + b.netIncome[1]] as [number, number],
    }),
    { netRevenue: [0, 0], grossProfit: [0, 0], opIncome: [0, 0], netIncome: [0, 0] } as Omit<BrandTotals, "brandId" | "brandName" | "companyId" | "companyName">,
  );

  const grossMarginB = grand.netRevenue[1] > 0 ? (grand.grossProfit[1] / grand.netRevenue[1]) * 100 : 0;
  const opMarginB = grand.netRevenue[1] > 0 ? (grand.opIncome[1] / grand.netRevenue[1]) * 100 : 0;
  const netMarginB = grand.netRevenue[1] > 0 ? (grand.netIncome[1] / grand.netRevenue[1]) * 100 : 0;

  const companies = new Map<number, { name: string; brands: BrandTotals[] }>();
  for (const b of perBrand) {
    const entry = companies.get(b.companyId) ?? { name: b.companyName, brands: [] };
    entry.brands.push(b);
    companies.set(b.companyId, entry);
  }
  const sortedBrands = [...perBrand].sort((a, b) => b.netIncome[1] - a.netIncome[1]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Semua Brand</h1>
          <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>
            Ringkasan gabungan {perBrand.length} brand yang bisa kamu akses · {summary}
          </p>
        </div>
      </div>

      <PeriodPicker />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Omset (Semua Brand)"
          valueA={grand.netRevenue[0]}
          valueB={grand.netRevenue[1]}
          labelA={labelA}
          tone="revenue"
          icon={<Wallet size={18} />}
          hint="Total pendapatan operasional bersih dari seluruh brand"
        />
        <KpiCard
          label="Laba Kotor (Semua Brand)"
          valueA={grand.grossProfit[0]}
          valueB={grand.grossProfit[1]}
          labelA={labelA}
          margin={grossMarginB}
          tone="health"
          icon={<Activity size={18} />}
          hint="Omset dikurangi harga pokok penjualan"
        />
        <KpiCard
          label="Laba Operasional (Semua Brand)"
          valueA={grand.opIncome[0]}
          valueB={grand.opIncome[1]}
          labelA={labelA}
          margin={opMarginB}
          tone="expense"
          icon={<TrendingUp size={18} />}
          hint="Laba dari kegiatan operasi utama"
        />
        <KpiCard
          label="Laba Bersih (Semua Brand)"
          valueA={grand.netIncome[0]}
          valueB={grand.netIncome[1]}
          labelA={labelA}
          margin={netMarginB}
          tone="profit"
          icon={<Star size={18} />}
          hint="Yang tersisa setelah semua beban & pajak"
        />
      </div>

      <div className="card p-5 overflow-x-auto">
        <h2 className="text-sm font-bold mb-1">Kontribusi per Brand</h2>
        <p className="text-xs mb-3" style={{ color: "var(--muted)" }}>
          Diurutkan dari laba bersih {labelB} terbesar
        </p>
        {sortedBrands.length === 0 ? (
          <div className="p-10 text-center" style={{ color: "var(--muted)" }}>Belum ada brand yang bisa diakses.</div>
        ) : (
          <table className="pnl-table">
            <thead>
              <tr>
                <th className="text-left">Perusahaan</th>
                <th className="text-left">Brand</th>
                <th>Omset ({labelB})</th>
                <th>Laba Bersih ({labelB})</th>
                <th>% Kontribusi Laba</th>
              </tr>
            </thead>
            <tbody>
              {sortedBrands.map((b) => (
                <tr key={b.brandId} className="item">
                  <td style={{ paddingLeft: 12 }}>{b.companyName}</td>
                  <td>{b.brandName}</td>
                  <td className="font-mono">{fmtRpFull(b.netRevenue[1])}</td>
                  <td className="font-mono">{fmtRpFull(b.netIncome[1])}</td>
                  <td>{grand.netIncome[1] !== 0 ? fmtPct((b.netIncome[1] / grand.netIncome[1]) * 100, 1) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {companies.size > 1 && (
        <div className="card p-5 overflow-x-auto">
          <h2 className="text-sm font-bold mb-3">Subtotal per Perusahaan</h2>
          <table className="pnl-table">
            <thead>
              <tr><th className="text-left">Perusahaan</th><th>Omset ({labelB})</th><th>Laba Bersih ({labelB})</th></tr>
            </thead>
            <tbody>
              {[...companies.entries()].map(([companyId, { name, brands: list }]) => {
                const omset = list.reduce((s, b) => s + b.netRevenue[1], 0);
                const laba = list.reduce((s, b) => s + b.netIncome[1], 0);
                return (
                  <tr key={companyId} className="item">
                    <td style={{ paddingLeft: 12 }}>{name}</td>
                    <td className="font-mono">{fmtRpFull(omset)}</td>
                    <td className="font-mono">{fmtRpFull(laba)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
