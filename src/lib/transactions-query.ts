import { sql } from "@/lib/db";
import type { Account, TransactionWithRelations } from "@/lib/database.types";

export type TxnFilters = {
  start: string;
  end: string;
  account_id?: string;
  q?: string;
  category?: string;
};

/** Filter query bersama untuk list & export — satu tempat supaya perilaku filter selalu konsisten. */
export async function queryTransactions(
  brandId: number,
  filters: TxnFilters,
  accounts: Account[],
  pagination?: { limit: number; offset: number },
): Promise<{ rows: TransactionWithRelations[]; count: number }> {
  const conditions = [
    sql`t.brand_id = ${brandId}`,
    sql`t.txn_date >= ${filters.start}`,
    sql`t.txn_date <= ${filters.end}`,
  ];

  if (filters.account_id) conditions.push(sql`t.account_id = ${Number(filters.account_id)}`);

  const q = filters.q?.trim();
  if (q) conditions.push(sql`(t.description ilike ${"%" + q + "%"} or t.reference ilike ${"%" + q + "%"})`);

  if (filters.category) {
    const idsInCat = accounts.filter((a) => (a.category ?? "") === filters.category).map((a) => a.id);
    conditions.push(idsInCat.length ? sql`t.account_id in ${sql(idsInCat)}` : sql`false`);
  }

  const where = conditions.reduce((acc, c) => sql`${acc} and ${c}`);

  const [{ count }] = await sql<{ count: number }[]>`
    select count(*)::int as count from transactions t where ${where}
  `;

  const rows = await sql<TransactionWithRelations[]>`
    select
      t.*,
      json_build_object('code', a.code, 'name', a.name, 'section', a.section, 'category', a.category) as accounts
    from transactions t
    join accounts a on a.id = t.account_id
    where ${where}
    order by t.txn_date desc, t.created_at desc
    ${pagination ? sql`limit ${pagination.limit} offset ${pagination.offset}` : sql``}
  `;

  return { rows, count };
}
