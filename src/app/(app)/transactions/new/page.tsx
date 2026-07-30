import Link from "next/link";
import { sql } from "@/lib/db";
import type { Account, Branch } from "@/lib/database.types";
import { TxnForm } from "@/components/txn-form";
import { createTransaction } from "../actions";

export const metadata = { title: "Catat Transaksi — SMB Natura" };

export default async function NewTransactionPage() {
  const [accounts, branches] = await Promise.all([
    sql<Account[]>`select * from accounts where is_active = true order by sort_order`,
    sql<Branch[]>`select * from branches where is_active = true order by id`,
  ]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Catat Transaksi</h1>
          <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>Tambah entri baru ke jurnal keuangan.</p>
        </div>
        <Link href="/transactions" className="btn-ghost text-sm">← Kembali</Link>
      </div>
      <TxnForm action={createTransaction} accounts={accounts} branches={branches} submitLabel="Simpan Transaksi" />
    </div>
  );
}
