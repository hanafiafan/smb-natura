import Link from "next/link";
import { notFound } from "next/navigation";
import { sql } from "@/lib/db";
import { getSession } from "@/lib/session";
import type { CashFlowEntry } from "@/lib/database.types";
import { CashFlowForm } from "@/components/cash-flow-form";
import { updateCashFlowEntry, type ActionState } from "../../actions";

export const metadata = { title: "Edit Arus Kas — SMB Natura" };

export default async function EditCashFlowPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();

  const [entry] = await sql<CashFlowEntry[]>`
    select * from cash_flow_entries where id = ${id} and brand_id = ${session.activeBrandId!}
  `;
  if (!entry) notFound();

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
      <CashFlowForm action={boundUpdate} entry={entry} submitLabel="Simpan Perubahan" />
    </div>
  );
}
