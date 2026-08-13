import Link from "next/link";
import { CheckCircle2, XCircle, Pencil, ListTree } from "lucide-react";
import { sql } from "@/lib/db";
import { getSession, requireSuperAdmin } from "@/lib/session";
import type { Account, AccountSection } from "@/lib/database.types";
import { DeleteAccountBtn } from "@/components/delete-account-btn";
import { createAccount, toggleAccountActive } from "./actions";

export const metadata = { title: "Akun & Kategori Transaksi — SMB Natura" };

export const SECTION_LABELS: Record<AccountSection, string> = {
  revenue: "Pendapatan",
  cogs: "HPP / Modal",
  opex: "Biaya Operasional",
  non_op_income: "Pendapatan Lain-lain",
  non_op_expense: "Biaya Lain-lain",
  tax: "Pajak",
};

export default async function AccountsPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  await requireSuperAdmin();
  const { error } = await searchParams;
  const session = await getSession();
  const brandId = session.activeBrandId!;

  const [[brand], accounts] = await Promise.all([
    sql<{ name: string }[]>`select b.name from brands b where b.id = ${brandId}`,
    sql<Account[]>`select * from accounts where brand_id = ${brandId} order by section, sort_order`,
  ]);

  const bySection = new Map<AccountSection, Account[]>();
  for (const a of accounts) {
    if (!bySection.has(a.section)) bySection.set(a.section, []);
    bySection.get(a.section)!.push(a);
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Akun & Kategori Transaksi</h1>
          <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
            Chart of Accounts untuk brand <b>{brand?.name}</b>. Ganti brand aktif lewat dropdown di header.
          </p>
        </div>
        <Link href="/master-data" className="btn-ghost text-sm">← Kembali</Link>
      </div>

      <form action={createAccount} className="card p-5 space-y-4">
        <h2 className="text-sm font-bold flex items-center gap-2"><ListTree size={16} /> Tambah ID / Kategori Baru</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label" htmlFor="section">Jenis</label>
            <select id="section" name="section" className="select" defaultValue="opex" required>
              {Object.entries(SECTION_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="category">Kategori</label>
            <input id="category" name="category" className="input" placeholder="mis. Sewa (kosongkan untuk buat baru)" />
          </div>
          <div>
            <label className="label" htmlFor="code">Kode</label>
            <input id="code" name="code" className="input" placeholder="mis. 6820" required />
          </div>
          <div>
            <label className="label" htmlFor="sign">Tipe Nilai</label>
            <select id="sign" name="sign" className="select" defaultValue="1">
              <option value="1">Normal (+)</option>
              <option value="-1">Pengurang (-)</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="label" htmlFor="name">Nama</label>
            <input id="name" name="name" className="input" placeholder="mis. Beban Sewa Laptop" required />
          </div>
        </div>
        <p className="text-[11px]" style={{ color: "var(--muted)" }}>
          Untuk Biaya Operasional: isi <b>Kategori</b> dengan nama grup yang sudah ada (mis. &quot;Sewa&quot;) supaya akun baru
          langsung muncul di grup itu saat Catat Transaksi. Isi nama grup baru untuk membuat kategori baru.
        </p>
        {error && (
          <div className="rounded-xl px-3 py-2 text-xs" style={{ background: "var(--neg-soft)", color: "var(--neg)" }}>
            {decodeURIComponent(error)}
          </div>
        )}
        <button type="submit" className="btn">+ Tambah Akun</button>
      </form>

      {accounts.length === 0 ? (
        <p className="text-sm text-center py-6" style={{ color: "var(--muted)" }}>Belum ada akun untuk brand ini.</p>
      ) : (
        [...bySection.entries()].map(([section, rows]) => (
          <div key={section} className="card overflow-x-auto">
            <div className="px-4 pt-4 pb-1 text-xs font-bold uppercase tracking-wide" style={{ color: "var(--muted)" }}>
              {SECTION_LABELS[section]}
            </div>
            <table className="pnl-table">
              <thead><tr><th>Nama</th><th>Kode</th><th>Kategori</th><th></th></tr></thead>
              <tbody>
                {rows.map((a) => (
                  <tr key={a.id} className="item">
                    <td style={{ paddingLeft: 12, textAlign: "left" }}>
                      <span style={!a.is_active ? { opacity: 0.5 } : undefined}>{a.name}</span>
                      {a.sign === -1 && <span className="text-[10px] ml-1.5" style={{ color: "var(--muted)" }}>(pengurang)</span>}
                    </td>
                    <td className="font-mono text-xs">{a.code}</td>
                    <td>{a.category ?? "—"}</td>
                    <td>
                      <div className="flex gap-3 justify-end items-center">
                        <Link href={`/master-data/accounts/${a.id}/edit`} title="Edit akun"><Pencil size={14} /></Link>
                        <form action={toggleAccountActive.bind(null, a.id)}>
                          <button type="submit" title={a.is_active ? "Nonaktifkan" : "Aktifkan"}>
                            {a.is_active ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                          </button>
                        </form>
                        <DeleteAccountBtn id={a.id} name={a.name} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))
      )}
    </div>
  );
}
