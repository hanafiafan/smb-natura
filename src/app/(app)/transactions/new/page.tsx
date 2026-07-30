import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { TxnForm } from "@/components/txn-form";
import { createTransaction } from "../actions";

export const metadata = { title: "Catat Transaksi — SMB Natura" };

export default async function NewTransactionPage() {
  const supabase = await createClient();
  const [{ data: accounts, error: e1 }, { data: branches, error: e2 }] = await Promise.all([
    supabase.from("accounts").select("*").eq("is_active", true).order("sort_order"),
    supabase.from("branches").select("*").eq("is_active", true).order("id"),
  ]);
  if (e1) throw e1;
  if (e2) throw e2;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Catat Transaksi</h1>
          <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>Tambah entri baru ke jurnal keuangan.</p>
        </div>
        <Link href="/transactions" className="btn-ghost text-sm">← Kembali</Link>
      </div>
      <TxnForm action={createTransaction} accounts={accounts ?? []} branches={branches ?? []} submitLabel="Simpan Transaksi" />
    </div>
  );
}
