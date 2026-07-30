import { sql } from "@/lib/db";
import { getSession } from "@/lib/session";
import { queryTransactions } from "@/lib/transactions-query";
import type { Account } from "@/lib/database.types";
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

  const accounts = await sql<Account[]>`select * from accounts where brand_id = ${brandId} and is_active = true`;
  const { rows: txns } = await queryTransactions(brandId, { ...sp, start, end }, accounts);

  const rows: (string | number)[][] = [
    ["Tanggal", "Kode Akun", "Akun", "Kategori", "Keterangan", "Referensi", "Jumlah"],
    ...txns.map((t) => [
      fmtDate(t.txn_date),
      t.accounts?.code ?? "",
      t.accounts?.name ?? "",
      t.accounts?.category ?? "",
      t.description ?? "",
      t.reference ?? "",
      Math.round(Number(t.amount)),
    ]),
  ];

  return csvResponse(toCsv(rows), `transaksi-${start}_${end}.csv`);
}
