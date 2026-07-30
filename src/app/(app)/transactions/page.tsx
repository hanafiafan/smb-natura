import Link from "next/link";
import { CheckCircle2, FileSpreadsheet } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { fmtRpFull, fmtDate } from "@/lib/format";
import { DeleteBtn } from "@/components/delete-btn";
import { buildTransactionsQuery } from "@/lib/transactions-query";

export const metadata = { title: "Transaksi — SMB Natura" };

const PAGE_SIZE = 50;

function firstOfMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}
function lastOfMonth() {
  const d = new Date();
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  return end.toISOString().slice(0, 10);
}

type SP = {
  start?: string; end?: string;
  account_id?: string; category?: string; branch_id?: string;
  q?: string; page?: string; ok?: string;
};

export default async function TransactionsPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const start = sp.start ?? firstOfMonth();
  const end = sp.end ?? lastOfMonth();
  const page = Math.max(1, Number(sp.page ?? "1"));
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const supabase = await createClient();
  const [{ data: accounts }, { data: branches }] = await Promise.all([
    supabase.from("accounts").select("*").eq("is_active", true).order("sort_order"),
    supabase.from("branches").select("*").eq("is_active", true).order("id"),
  ]);

  const query = buildTransactionsQuery(supabase, { ...sp, start, end }, accounts ?? []).range(from, to);

  const { data: txns, error, count } = await query;
  if (error) throw error;

  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const sumAmount = (txns ?? []).reduce((s, t) => s + Number(t.amount), 0);

  const categories = Array.from(new Set((accounts ?? []).map((a) => a.category).filter(Boolean) as string[])).sort();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold">Transaksi</h1>
          <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
            {total.toLocaleString("id-ID")} transaksi · Total halaman ini: {fmtRpFull(sumAmount)}
          </p>
        </div>
        <div className="flex gap-2">
          <a href={`/transactions/export?${exportQuery(sp)}`} className="btn-outline">
            <FileSpreadsheet size={16} /> Export Excel
          </a>
          <Link href="/transactions/new" className="btn">+ Catat Transaksi Baru</Link>
        </div>
      </div>

      {sp.ok && (
        <div className="rounded-xl px-4 py-3 text-sm font-medium flex items-center gap-2"
          style={{ color: "var(--pos)", background: "var(--pos-soft)", border: "1px solid var(--color-brand-100)" }}>
          <CheckCircle2 size={16} />
          <span>
            {sp.ok === "created" && "Transaksi berhasil ditambahkan."}
            {sp.ok === "updated" && "Transaksi berhasil diperbarui."}
          </span>
        </div>
      )}

      {(() => {
        const active: { label: string; removeQuery: string }[] = [];
        const baseSp = new URLSearchParams();
        if (sp.start) baseSp.set("start", sp.start);
        if (sp.end) baseSp.set("end", sp.end);
        const removeBuilder = (key: string) => {
          const q = new URLSearchParams(baseSp);
          for (const [k, v] of Object.entries(sp)) if (v && k !== key && !["start", "end", "ok", "page"].includes(k)) q.set(k, v);
          return q.toString();
        };
        if (sp.category) active.push({ label: `Kategori: ${sp.category}`, removeQuery: removeBuilder("category") });
        if (sp.account_id) {
          const acc = accounts?.find((a) => a.id === Number(sp.account_id));
          active.push({ label: `Akun: ${acc?.name ?? sp.account_id}`, removeQuery: removeBuilder("account_id") });
        }
        if (sp.branch_id) {
          const br = branches?.find((b) => b.id === Number(sp.branch_id));
          active.push({ label: `Cabang: ${br?.name ?? sp.branch_id}`, removeQuery: removeBuilder("branch_id") });
        }
        if (sp.q) active.push({ label: `Cari: "${sp.q}"`, removeQuery: removeBuilder("q") });
        if (active.length === 0) return null;
        return (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold" style={{ color: "var(--muted)" }}>Filter aktif:</span>
            {active.map((chip, i) => (
              <Link key={i} href={`/transactions?${chip.removeQuery}`} className="chip hover:brightness-95">
                {chip.label}
                <span>×</span>
              </Link>
            ))}
          </div>
        );
      })()}

      <form className="card p-4 flex flex-wrap items-end gap-3">
        <div>
          <label className="label" htmlFor="start">Dari tanggal</label>
          <input type="date" id="start" name="start" defaultValue={start} className="input" />
        </div>
        <div>
          <label className="label" htmlFor="end">Sampai tanggal</label>
          <input type="date" id="end" name="end" defaultValue={end} className="input" />
        </div>
        <div>
          <label className="label" htmlFor="category">Kategori</label>
          <select id="category" name="category" defaultValue={sp.category ?? ""} className="select">
            <option value="">Semua Kategori</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="account_id">Akun</label>
          <select id="account_id" name="account_id" defaultValue={sp.account_id ?? ""} className="select" style={{ minWidth: 220 }}>
            <option value="">Semua Akun</option>
            {(accounts ?? []).map((a) => <option key={a.id} value={a.id}>{a.code} — {a.name}</option>)}
          </select>
        </div>
        {(branches?.length ?? 0) > 1 && (
          <div>
            <label className="label" htmlFor="branch_id">Cabang</label>
            <select id="branch_id" name="branch_id" defaultValue={sp.branch_id ?? ""} className="select">
              <option value="">Semua Cabang</option>
              {(branches ?? []).map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
        )}
        <div className="flex-1 min-w-[180px]">
          <label className="label" htmlFor="q">Cari</label>
          <input type="text" id="q" name="q" defaultValue={sp.q ?? ""} className="input" placeholder="keterangan / referensi" />
        </div>
        <div className="flex gap-2">
          <button type="submit" className="btn">Terapkan</button>
          <Link href="/transactions" className="btn-outline">Reset</Link>
        </div>
      </form>

      <div className="card overflow-x-auto">
        {(!txns || txns.length === 0) ? (
          <div className="p-10 text-center" style={{ color: "var(--muted)" }}>Tidak ada transaksi di filter ini.</div>
        ) : (
          <table className="pnl-table">
            <thead>
              <tr>
                <th>Tanggal</th><th>Akun</th><th>Kategori</th><th>Cabang</th><th>Keterangan</th><th>Referensi</th><th>Jumlah</th><th></th>
              </tr>
            </thead>
            <tbody>
              {txns.map((t) => (
                <tr key={t.id} className="item">
                  <td style={{ paddingLeft: 12 }}>{fmtDate(t.txn_date)}</td>
                  <td style={{ paddingLeft: 12 }}>
                    <div className="font-medium" style={{ color: "var(--foreground)" }}>{t.accounts?.name ?? "—"}</div>
                    <div className="text-[11px]" style={{ color: "var(--muted)" }}>{t.accounts?.code}</div>
                  </td>
                  <td>{t.accounts?.category ?? <span style={{ color: "var(--muted)" }}>—</span>}</td>
                  <td>{t.branches?.name ?? "—"}</td>
                  <td style={{ maxWidth: 240, whiteSpace: "normal" }}>{t.description ?? <span style={{ color: "var(--muted)" }}>—</span>}</td>
                  <td>{t.reference ?? <span style={{ color: "var(--muted)" }}>—</span>}</td>
                  <td className="font-mono">{fmtRpFull(Number(t.amount))}</td>
                  <td>
                    <div className="flex gap-3 justify-end">
                      <Link href={`/transactions/${t.id}/edit`} className="text-xs" style={{ color: "var(--accent)" }}>Edit</Link>
                      <DeleteBtn id={t.id} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-between items-center text-sm">
          <span style={{ color: "var(--muted)" }}>
            Halaman {page} dari {totalPages}
          </span>
          <div className="flex gap-2">
            <PageLink sp={sp} page={page - 1} disabled={page <= 1}>← Sebelumnya</PageLink>
            <PageLink sp={sp} page={page + 1} disabled={page >= totalPages}>Berikutnya →</PageLink>
          </div>
        </div>
      )}
    </div>
  );
}

function exportQuery(sp: SP): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) if (v && k !== "page" && k !== "ok") q.set(k, v);
  return q.toString();
}

function PageLink({ sp, page, disabled, children }: { sp: SP; page: number; disabled?: boolean; children: React.ReactNode }) {
  if (disabled) return <span className="btn-outline opacity-40 pointer-events-none">{children}</span>;
  const q = new URLSearchParams(Object.entries(sp).filter(([, v]) => v != null) as [string, string][]);
  q.set("page", String(page));
  return <Link href={`/transactions?${q.toString()}`} className="btn-outline">{children}</Link>;
}
