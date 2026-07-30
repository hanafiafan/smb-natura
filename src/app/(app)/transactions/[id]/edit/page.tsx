import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TxnForm } from "@/components/txn-form";
import { updateTransaction, type ActionState } from "../../actions";

export const metadata = { title: "Edit Transaksi — SMB Natura" };

export default async function EditTransactionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: txn }, { data: accounts, error: e1 }, { data: branches, error: e2 }] = await Promise.all([
    supabase.from("transactions").select("*").eq("id", id).maybeSingle(),
    supabase.from("accounts").select("*").eq("is_active", true).order("sort_order"),
    supabase.from("branches").select("*").eq("is_active", true).order("id"),
  ]);
  if (!txn) notFound();
  if (e1) throw e1;
  if (e2) throw e2;

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
      <TxnForm action={boundUpdate} accounts={accounts ?? []} branches={branches ?? []} txn={txn} submitLabel="Simpan Perubahan" />
    </div>
  );
}
