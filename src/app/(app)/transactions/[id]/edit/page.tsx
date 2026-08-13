import Link from "next/link";
import { notFound } from "next/navigation";
import { sql } from "@/lib/db";
import { getSession } from "@/lib/session";
import type { Account, Transaction } from "@/lib/database.types";
import { TxnForm } from "@/components/txn-form";
import { updateTransaction, type ActionState } from "../../actions";

export const metadata = { title: "Edit Transaksi — SMB Natura" };

export default async function EditTransactionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  const brandId = session.activeBrandId!;

  const [[txn], accounts] = await Promise.all([
    sql<Transaction[]>`select * from transactions where id = ${id} and brand_id = ${brandId}`,
    sql<Account[]>`select * from accounts where brand_id = ${brandId} order by sort_order`,
  ]);
  if (!txn) notFound();

  const boundUpdate = updateTransaction.bind(null, id) as (s: ActionState, fd: FormData) => Promise<ActionState>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Edit Transaksi</h1>
          <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>Ubah entri jurnal.</p>
        </div>
        <Link href="/transactions" className="btn-ghost text-sm">← Kembali</Link>
      </div>
      <TxnForm action={boundUpdate} accounts={accounts} txn={txn} submitLabel="Simpan Perubahan" />
    </div>
  );
}
