import Link from "next/link";
import { Landmark, CheckCircle2, XCircle, Pencil } from "lucide-react";
import { sql } from "@/lib/db";
import { getSession } from "@/lib/session";
import type { CashAccount } from "@/lib/database.types";
import { createCashAccount, toggleCashAccountActive } from "./actions";

export const metadata = { title: "Rekening Kas — SMB Natura" };

export default async function CashAccountsPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const session = await getSession();
  const brandId = session.activeBrandId!;

  const accounts = await sql<CashAccount[]>`
    select * from cash_accounts where brand_id = ${brandId} order by name
  `;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Rekening Kas</h1>
          <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
            Bank/e-wallet/saldo marketplace yang dipakai di Arus Kas.
          </p>
        </div>
        <Link href="/cash-flow" className="btn-ghost text-sm">← Kembali</Link>
      </div>

      <form action={createCashAccount} className="card p-5 flex items-end gap-3">
        <div className="flex-1">
          <label className="label" htmlFor="name">Nama Rekening</label>
          <input id="name" name="name" type="text" className="input" placeholder="mis. BCA, Shopee Saldo, GoPay" required />
        </div>
        <button type="submit" className="btn">+ Tambah</button>
      </form>
      {error && (
        <div className="rounded-xl px-3 py-2 text-xs" style={{ background: "var(--neg-soft)", color: "var(--neg)" }}>
          {decodeURIComponent(error)}
        </div>
      )}

      <div className="card overflow-x-auto">
        {accounts.length === 0 ? (
          <div className="p-10 text-center" style={{ color: "var(--muted)" }}>Belum ada rekening kas.</div>
        ) : (
          <table className="pnl-table">
            <thead><tr><th>Nama</th><th></th></tr></thead>
            <tbody>
              {accounts.map((a) => (
                <tr key={a.id} className="item">
                  <td style={{ paddingLeft: 12 }}>
                    <span className="inline-flex items-center gap-1.5" style={!a.is_active ? { opacity: 0.5 } : undefined}>
                      <Landmark size={14} /> {a.name}
                    </span>
                  </td>
                  <td>
                    <div className="flex justify-end items-center gap-3">
                      <Link href={`/cash-flow/accounts/${a.id}/edit`} title="Edit rekening"><Pencil size={14} /></Link>
                      <form action={toggleCashAccountActive.bind(null, a.id)}>
                        <button type="submit" className="text-xs inline-flex items-center gap-1" style={{ color: a.is_active ? "var(--neg)" : "var(--pos)" }}>
                          {a.is_active ? <><XCircle size={14} /> Nonaktifkan</> : <><CheckCircle2 size={14} /> Aktifkan</>}
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
