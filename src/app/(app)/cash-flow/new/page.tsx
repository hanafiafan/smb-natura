import Link from "next/link";
import { CashFlowForm } from "@/components/cash-flow-form";
import { createCashFlowEntry } from "../actions";

export const metadata = { title: "Catat Arus Kas — SMB Natura" };

export default function NewCashFlowPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Catat Arus Kas</h1>
          <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>Tambah entri baru ke buku kas.</p>
        </div>
        <Link href="/cash-flow" className="btn-ghost text-sm">← Kembali</Link>
      </div>
      <CashFlowForm action={createCashFlowEntry} submitLabel="Simpan Catatan" />
    </div>
  );
}
