import { sql } from "@/lib/db";
import { getSession } from "@/lib/session";
import type { Account } from "@/lib/database.types";
import { aggregate, buildPnL, relevantAccounts, type PnLRow } from "@/lib/pnl";
import { variance } from "@/lib/format";
import { computePeriods, type PeriodMode } from "@/lib/period";
import { toCsv, csvResponse, numCell, csvText } from "@/lib/csv";

function pctCell(v: number, denom: number): string {
  return denom ? numCell((v / denom) * 100, 1) : numCell(0, 1);
}
function varCell(a: number, b: number): string {
  return numCell(variance(a, b), 1);
}

function toRow(r: PnLRow, omsetA: number, omsetB: number): (string | number)[] {
  if (r.kind === "section" && !r.total) return [csvText(r.label), "", "", "", "", ""];
  const label = r.kind === "item" ? r.account.name : r.label;
  return [csvText(label), Math.round(r.a), pctCell(r.a, omsetA), Math.round(r.b), pctCell(r.b, omsetB), varCell(r.a, r.b)];
}

export async function GET(request: Request) {
  const session = await getSession();
  if (!session.email) return new Response("Unauthorized", { status: 401 });
  const brandId = session.activeBrandId;
  if (!brandId) return new Response("No active brand", { status: 400 });

  const sp = Object.fromEntries(new URL(request.url).searchParams);
  const mode = (sp.mode ?? "monthly") as PeriodMode;
  const { periodA, periodB } = computePeriods(mode, sp.start, sp.end);

  const min = periodA.start < periodB.start ? periodA.start : periodB.start;
  const max = periodA.end > periodB.end ? periodA.end : periodB.end;

  const [allAccounts, txns] = await Promise.all([
    sql<Account[]>`select * from accounts where brand_id = ${brandId} order by sort_order asc`,
    sql<{ account_id: number; txn_date: string; amount: number }[]>`
      select account_id, txn_date, amount from transactions
      where brand_id = ${brandId} and txn_date >= ${min} and txn_date <= ${max}
    `,
  ]);

  const aggs = aggregate(txns, periodA, periodB);
  const pnl = buildPnL(relevantAccounts(allAccounts, aggs), aggs);
  const omsetA = pnl.totals.netRevenue[0];
  const omsetB = pnl.totals.netRevenue[1];

  const rows: (string | number)[][] = [
    ["Deskripsi", periodA.start, "% Periode A", periodB.start, "% Periode B", "% Var"],
    ...pnl.rows.map((r) => toRow(r, omsetA, omsetB)),
  ];

  return csvResponse(toCsv(rows), `laporan-lr-${periodB.start}_${periodB.end}.csv`);
}
