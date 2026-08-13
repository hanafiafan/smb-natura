import Link from "next/link";
import { notFound } from "next/navigation";
import { sql } from "@/lib/db";
import { getSession } from "@/lib/session";
import type { CashAccount } from "@/lib/database.types";
import { updateCashAccount } from "../../actions";

export const metadata = { title: "Edit Rekening Kas — SMB Natura" };

export default async function EditCashAccountPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const session = await getSession();

  const [account] = await sql<CashAccount[]>`
    select * from cash_accounts where id = ${id} and brand_id = ${session.activeBrandId!}
  `;
  if (!account) notFound();

  const boundUpdate = updateCashAccount.bind(null, account.id);

  return (
    <div className="space-y-4 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Edit Rekening Kas</h1>
        <Link href="/cash-flow/accounts" className="btn-ghost text-sm">← Kembali</Link>
      </div>
      <form action={boundUpdate} className="card p-5 space-y-4">
        <div>
          <label className="label" htmlFor="name">Nama Rekening</label>
          <input id="name" name="name" className="input" defaultValue={account.name} required />
        </div>
        {error && (
          <div className="rounded-xl px-3 py-2 text-xs" style={{ background: "var(--neg-soft)", color: "var(--neg)" }}>
            {decodeURIComponent(error)}
          </div>
        )}
        <button type="submit" className="btn w-full">Simpan Perubahan</button>
      </form>
    </div>
  );
}
