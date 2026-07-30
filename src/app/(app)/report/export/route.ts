import { createClient } from "@/lib/supabase/server";
import { aggregate, buildPnL, type PnLRow } from "@/lib/pnl";
import { variance } from "@/lib/format";
import { computePeriods, type PeriodMode } from "@/lib/period";
import { toCsv, csvResponse, numCell } from "@/lib/csv";

function pctCell(v: number, denom: number): string {
  return denom ? numCell((v / denom) * 100, 1) : numCell(0, 1);
}
function varCell(a: number, b: number): string {
  return numCell(variance(a, b), 1);
}

function toRow(r: PnLRow, omsetA: number, omsetB: number): (string | number)[] {
  if (r.kind === "section" && !r.total) return [r.label, "", "", "", "", ""];
  const label = r.kind === "item" ? r.account.name : r.label;
  return [label, Math.round(r.a), pctCell(r.a, omsetA), Math.round(r.b), pctCell(r.b, omsetB), varCell(r.a, r.b)];
}

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const sp = Object.fromEntries(new URL(request.url).searchParams);
  const mode = (sp.mode ?? "monthly") as PeriodMode;
  const { periodA, periodB } = computePeriods(mode, sp.start, sp.end);
  const branchId = sp.branch_id ? Number(sp.branch_id) : null;

  const min = periodA.start < periodB.start ? periodA.start : periodB.start;
  const max = periodA.end > periodB.end ? periodA.end : periodB.end;

  const [accountsRes, txnsQuery] = await Promise.all([
    supabase.from("accounts").select("*").eq("is_active", true).order("sort_order", { ascending: true }),
    (async () => {
      let q = supabase.from("transactions").select("account_id, txn_date, amount, branch_id").gte("txn_date", min).lte("txn_date", max);
      if (branchId) q = q.eq("branch_id", branchId);
      return await q;
    })(),
  ]);
  if (accountsRes.error) return new Response(accountsRes.error.message, { status: 500 });
  if (txnsQuery.error) return new Response(txnsQuery.error.message, { status: 500 });

  const aggs = aggregate(txnsQuery.data ?? [], periodA, periodB);
  const pnl = buildPnL(accountsRes.data ?? [], aggs);
  const omsetA = pnl.totals.netRevenue[0];
  const omsetB = pnl.totals.netRevenue[1];

  const rows: (string | number)[][] = [
    ["Deskripsi", periodA.start, "% Periode A", periodB.start, "% Periode B", "% Var"],
    ...pnl.rows.map((r) => toRow(r, omsetA, omsetB)),
  ];

  return csvResponse(toCsv(rows), `laporan-lr-${periodB.start}_${periodB.end}.csv`);
}
