import type { SupabaseClient } from "@supabase/supabase-js";
import type { Account, Database } from "@/lib/database.types";

export type TxnFilters = {
  start: string;
  end: string;
  account_id?: string;
  branch_id?: string;
  q?: string;
  category?: string;
};

/** Filter query bersama untuk list & export — satu tempat supaya perilaku filter selalu konsisten. */
export function buildTransactionsQuery(
  supabase: SupabaseClient<Database>,
  sp: TxnFilters,
  accounts: Account[],
) {
  let query = supabase
    .from("transactions")
    .select("*, accounts(code, name, section, category), branches(name)", { count: "exact" })
    .gte("txn_date", sp.start)
    .lte("txn_date", sp.end)
    .order("txn_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (sp.account_id) query = query.eq("account_id", Number(sp.account_id));
  if (sp.branch_id) query = query.eq("branch_id", Number(sp.branch_id));
  // Strip characters that break PostgREST's or() filter list syntax (, ( ))
  const q = sp.q?.replace(/[,()]/g, "").trim();
  if (q) query = query.or(`description.ilike.%${q}%,reference.ilike.%${q}%`);
  if (sp.category) {
    const idsInCat = accounts.filter((a) => (a.category ?? "") === sp.category).map((a) => a.id);
    if (idsInCat.length === 0) idsInCat.push(-1);
    query = query.in("account_id", idsInCat);
  }

  return query;
}
