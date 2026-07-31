import { sql } from "@/lib/db";
import { getSession } from "@/lib/session";
import type { CashFlowEntry } from "@/lib/database.types";
import { toCsv, csvResponse } from "@/lib/csv";
import { fmtDate, firstOfMonth, lastOfMonth } from "@/lib/format";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session.email) return new Response("Unauthorized", { status: 401 });
  const brandId = session.activeBrandId;
  if (!brandId) return new Response("No active brand", { status: 400 });

  const sp = Object.fromEntries(new URL(request.url).searchParams);
  const start = sp.start ?? firstOfMonth();
  const end = sp.end ?? lastOfMonth();
  const q = sp.q?.trim();

  const conditions = [sql`cfe.brand_id = ${brandId}`, sql`cfe.entry_date >= ${start}`, sql`cfe.entry_date <= ${end}`];
  if (q) conditions.push(sql`cfe.description ilike ${"%" + q + "%"}`);
  const where = conditions.reduce((acc, c) => sql`${acc} and ${c}`);

  const entries = await sql<(CashFlowEntry & { account_name: string | null })[]>`
    select cfe.*, ca.name as account_name
    from cash_flow_entries cfe left join cash_accounts ca on ca.id = cfe.account_id
    where ${where}
    order by cfe.entry_date desc, cfe.created_at desc
  `;

  const rows: (string | number)[][] = [
    ["Tanggal", "Keterangan", "Channel", "Akun", "Jenis", "Jumlah"],
    ...entries.map((e) => [
      fmtDate(e.entry_date),
      e.description,
      e.channel ?? "",
      e.account_name ?? "",
      e.type === "in" ? "Masuk" : "Keluar",
      Math.round(Number(e.amount)),
    ]),
  ];

  return csvResponse(toCsv(rows), `arus-kas-${start}_${end}.csv`);
}
