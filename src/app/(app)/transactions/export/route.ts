import { createClient } from "@/lib/supabase/server";
import { buildTransactionsQuery } from "@/lib/transactions-query";
import { toCsv, csvResponse } from "@/lib/csv";
import { fmtDate, firstOfMonth, lastOfMonth } from "@/lib/format";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const sp = Object.fromEntries(new URL(request.url).searchParams);
  const start = sp.start ?? firstOfMonth();
  const end = sp.end ?? lastOfMonth();

  const { data: accounts } = await supabase.from("accounts").select("*").eq("is_active", true);
  const { data: txns, error } = await buildTransactionsQuery(supabase, { ...sp, start, end }, accounts ?? []);
  if (error) return new Response(error.message, { status: 500 });

  const rows: (string | number)[][] = [
    ["Tanggal", "Kode Akun", "Akun", "Kategori", "Cabang", "Keterangan", "Referensi", "Jumlah"],
    ...(txns ?? []).map((t) => [
      fmtDate(t.txn_date),
      t.accounts?.code ?? "",
      t.accounts?.name ?? "",
      t.accounts?.category ?? "",
      t.branches?.name ?? "",
      t.description ?? "",
      t.reference ?? "",
      Math.round(Number(t.amount)),
    ]),
  ];

  return csvResponse(toCsv(rows), `transaksi-${start}_${end}.csv`);
}
