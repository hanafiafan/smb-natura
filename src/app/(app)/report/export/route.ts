import { getAccessibleBrandId, getSession } from "@/lib/session";
import { getAccessibleBrands } from "@/lib/brands";
import { loadCombinedPnL, type PnLRow } from "@/lib/pnl";
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
  const brandId = await getAccessibleBrandId(session);
  if (!brandId) return new Response("No active brand", { status: 403 });

  const sp = Object.fromEntries(new URL(request.url).searchParams);
  const mode = (sp.mode ?? "monthly") as PeriodMode;
  const { periodA, periodB } = computePeriods(mode, sp.start, sp.end);

  const brands = await getAccessibleBrands(session.userId!, session.role!);
  const active = brands.find((b) => b.id === brandId)!;
  const shown = sp.brand === "all" && brands.length > 1 ? brands : [active];

  const header = ["Deskripsi", periodA.start, "% Periode A", periodB.start, "% Periode B", "% Var"];
  const pnl = await loadCombinedPnL(shown.map((b) => b.id), periodA, periodB);
  const omsetA = pnl.totals.netRevenue[0];
  const omsetB = pnl.totals.netRevenue[1];
  const title = shown.length > 1
    ? `Gabungan ${shown.length} Brand: ${shown.map((b) => b.name).join(", ")}`
    : `${active.company_name} — ${active.name}`;
  const rows: (string | number)[][] = [
    [csvText(title), "", "", "", "", ""],
    header,
    ...pnl.rows.map((r) => toRow(r, omsetA, omsetB)),
  ];

  const scope = shown.length > 1 ? "gabungan-" : "";
  return csvResponse(toCsv(rows), `laporan-lr-${scope}${periodB.start}_${periodB.end}.csv`);
}
