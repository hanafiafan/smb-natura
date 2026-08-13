import Link from "next/link";
import { notFound } from "next/navigation";
import { sql } from "@/lib/db";
import { getSession } from "@/lib/session";
import type { CashAccount, CashFlowEntry } from "@/lib/database.types";
import { CashFlowForm } from "@/components/cash-flow-form";
import { updateCashFlowEntry, type ActionState } from "../../actions";

export const metadata = { title: "Edit Arus Kas — SMB Natura" };

export default async function EditCashFlowPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();

  const [[entry], accounts] = await Promise.all([
    sql<CashFlowEntry[]>`
      select * from cash_flow_entries where id = ${id} and brand_id = ${session.activeBrandId!}
    `,
    sql<CashAccount[]>`
      select * from cash_accounts where brand_id = ${session.activeBrandId!} order by name
    `,
  ]);
  if (!entry) notFound();
  // Keep the entry's already-assigned account selectable even if it's been deactivated
  // since — a native <select> silently falls back to the first option (and loses the
  // real value on save) if the current value isn't among the rendered options.
  const selectableAccounts = accounts.filter((a) => a.is_active || a.id === entry.account_id);

  const boundUpdate = updateCashFlowEntry.bind(null, id) as (s: ActionState, fd: FormData) => Promise<ActionState>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Edit Arus Kas</h1>
          <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>Ubah entri buku kas.</p>
        </div>
        <Link href="/cash-flow" className="btn-ghost text-sm">← Kembali</Link>
      </div>
      <CashFlowForm action={boundUpdate} entry={entry} accounts={selectableAccounts} submitLabel="Simpan Perubahan" />
    </div>
  );
}
