import Link from "next/link";
import { CheckCircle2, FileSpreadsheet } from "lucide-react";
import { sql } from "@/lib/db";
import { getSession } from "@/lib/session";
import { getAccessibleBrands } from "@/lib/brands";
import type { Account } from "@/lib/database.types";
import { fmtRpFull, fmtDate, firstOfMonth, lastOfMonth, safeISODate } from "@/lib/format";
import { DeleteBtn } from "@/components/delete-btn";
import { queryTransactions } from "@/lib/transactions-query";
import { BrandFilterCard } from "@/components/brand-filter";

export const metadata = { title: "Transaksi — SMB Natura" };

const PAGE_SIZE = 50;

type SP = {
  start?: string; end?: string;
  account_id?: string; category?: string;
  q?: string; page?: string; ok?: string;
};

export default async function TransactionsPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const start = safeISODate(sp.start, firstOfMonth());
  const end = safeISODate(sp.end, lastOfMonth());
  const page = Math.max(1, Number(sp.page ?? "1"));
  const from = (page - 1) * PAGE_SIZE;

  const session = await getSession();
  const brandId = session.activeBrandId!;

  const [accounts, brands] = await Promise.all([
    sql<Account[]>`select * from accounts where brand_id = ${brandId} order by sort_order`,
    getAccessibleBrands(session.userId!, session.role!),
  ]);

  const { rows: txns, count: total } = await queryTransactions(
    brandId,
    { ...sp, start, end },
    accounts,
    { limit: PAGE_SIZE, offset: from },
  );

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const sumAmount = txns.reduce((s, t) => s + Number(t.amount), 0);

  const categories = Array.from(new Set(accounts.map((a) => a.category).filter(Boolean) as string[])).sort();

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

      <BrandFilterCard brands={brands} activeBrandId={brandId} />

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
          const acc = accounts.find((a) => a.id === Number(sp.account_id));
          active.push({ label: `Akun: ${acc?.name ?? sp.account_id}`, removeQuery: removeBuilder("account_id") });
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
            {accounts.map((a) => <option key={a.id} value={a.id}>{a.code} — {a.name}{!a.is_active ? " (nonaktif)" : ""}</option>)}
          </select>
        </div>
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
        {txns.length === 0 ? (
          <div className="p-10 text-center" style={{ color: "var(--muted)" }}>Tidak ada transaksi di filter ini.</div>
        ) : (
          <table className="pnl-table">
            <thead>
              <tr>
                <th>Tanggal</th><th>Akun</th><th>Kategori</th><th>Keterangan</th><th>Referensi</th><th>Jumlah</th><th></th>
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
