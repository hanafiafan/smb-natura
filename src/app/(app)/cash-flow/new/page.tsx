import Link from "next/link";
import { sql } from "@/lib/db";
import { getSession } from "@/lib/session";
import type { CashAccount } from "@/lib/database.types";
import { CashFlowForm } from "@/components/cash-flow-form";
import { createCashFlowEntry } from "../actions";

export const metadata = { title: "Catat Arus Kas — SMB Natura" };

export default async function NewCashFlowPage() {
  const session = await getSession();
  const accounts = await sql<CashAccount[]>`
    select * from cash_accounts where brand_id = ${session.activeBrandId!} and is_active order by name
  `;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Catat Arus Kas</h1>
          <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>Tambah entri baru ke buku kas.</p>
        </div>
        <Link href="/cash-flow" className="btn-ghost text-sm">← Kembali</Link>
      </div>
      <CashFlowForm action={createCashFlowEntry} accounts={accounts} submitLabel="Simpan Catatan" />
    </div>
  );
}
