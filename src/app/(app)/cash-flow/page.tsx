import Link from "next/link";
import { CheckCircle2, FileSpreadsheet, Wallet, ArrowDownCircle, ArrowUpCircle, Landmark } from "lucide-react";
import { sql } from "@/lib/db";
import { getSession } from "@/lib/session";
import type { CashFlowEntry } from "@/lib/database.types";
import { fmtRpFull, fmtDate, firstOfMonth, lastOfMonth } from "@/lib/format";
import { DeleteCashFlowBtn } from "@/components/delete-cashflow-btn";

export const metadata = { title: "Arus Kas — SMB Natura" };

const PAGE_SIZE = 50;

type SP = { start?: string; end?: string; q?: string; page?: string; ok?: string };

export default async function CashFlowPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const start = sp.start ?? firstOfMonth();
  const end = sp.end ?? lastOfMonth();
  const page = Math.max(1, Number(sp.page ?? "1"));
  const from = (page - 1) * PAGE_SIZE;
  const q = sp.q?.trim();

  const session = await getSession();
  const brandId = session.activeBrandId!;

  const conditions = [sql`cfe.brand_id = ${brandId}`, sql`cfe.entry_date >= ${start}`, sql`cfe.entry_date <= ${end}`];
  if (q) conditions.push(sql`cfe.description ilike ${"%" + q + "%"}`);
  const where = conditions.reduce((acc, c) => sql`${acc} and ${c}`);

  const [[{ balance }], [{ count }], entries] = await Promise.all([
    sql<{ balance: number }[]>`
      select coalesce(sum(case when type = 'in' then amount else -amount end), 0) as balance
      from cash_flow_entries where brand_id = ${brandId}
    `,
    sql<{ count: number }[]>`select count(*)::int as count from cash_flow_entries cfe where ${where}`,
    sql<(CashFlowEntry & { account_name: string | null })[]>`
      select cfe.*, ca.name as account_name
      from cash_flow_entries cfe left join cash_accounts ca on ca.id = cfe.account_id
      where ${where}
      order by cfe.entry_date desc, cfe.created_at desc
      limit ${PAGE_SIZE} offset ${from}
    `,
  ]);

  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold">Arus Kas</h1>
          <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
            {count.toLocaleString("id-ID")} catatan di periode ini
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/cash-flow/accounts" className="btn-outline">
            <Landmark size={16} /> Rekening
          </Link>
          <a href={`/cash-flow/export?${exportQuery(sp)}`} className="btn-outline">
            <FileSpreadsheet size={16} /> Export Excel
          </a>
          <Link href="/cash-flow/new" className="btn">+ Catat Arus Kas</Link>
        </div>
      </div>

      <div className="card p-5" style={{ background: "linear-gradient(135deg, var(--color-brand-50) 0%, #ffffff 60%)" }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl grid place-items-center shrink-0 shadow-theme-xs" style={{ background: "var(--accent)", color: "white" }}>
            <Wallet size={20} />
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-wider font-bold" style={{ color: "var(--muted)" }}>Kas Saat Ini</div>
            <div className="text-2xl font-bold tracking-tight" style={{ color: "var(--accent)" }}>{fmtRpFull(balance)}</div>
          </div>
        </div>
      </div>

      {sp.ok && (
        <div className="rounded-xl px-4 py-3 text-sm font-medium flex items-center gap-2"
          style={{ color: "var(--pos)", background: "var(--pos-soft)", border: "1px solid var(--color-brand-100)" }}>
          <CheckCircle2 size={16} />
          <span>
            {sp.ok === "created" && "Catatan arus kas berhasil ditambahkan."}
            {sp.ok === "updated" && "Catatan arus kas berhasil diperbarui."}
          </span>
        </div>
      )}

      <form className="card p-4 flex flex-wrap items-end gap-3">
        <div>
          <label className="label" htmlFor="start">Dari tanggal</label>
          <input type="date" id="start" name="start" defaultValue={start} className="input" />
        </div>
        <div>
          <label className="label" htmlFor="end">Sampai tanggal</label>
          <input type="date" id="end" name="end" defaultValue={end} className="input" />
        </div>
        <div className="flex-1 min-w-[180px]">
          <label className="label" htmlFor="q">Cari</label>
          <input type="text" id="q" name="q" defaultValue={sp.q ?? ""} className="input" placeholder="keterangan" />
        </div>
        <div className="flex gap-2">
          <button type="submit" className="btn">Terapkan</button>
          <Link href="/cash-flow" className="btn-outline">Reset</Link>
        </div>
      </form>

      <div className="card overflow-x-auto">
        {entries.length === 0 ? (
          <div className="p-10 text-center" style={{ color: "var(--muted)" }}>Tidak ada catatan arus kas di filter ini.</div>
        ) : (
          <table className="pnl-table">
            <thead>
              <tr>
                <th>Tanggal</th><th>Keterangan</th><th>Channel</th><th>Akun</th><th>Jenis</th><th>Jumlah</th><th></th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr key={e.id} className="item">
                  <td style={{ paddingLeft: 12 }}>{fmtDate(e.entry_date)}</td>
                  <td style={{ maxWidth: 240, whiteSpace: "normal" }}>{e.description}</td>
                  <td>{e.channel ?? <span style={{ color: "var(--muted)" }}>—</span>}</td>
                  <td>{e.account_name ?? <span style={{ color: "var(--muted)" }}>—</span>}</td>
                  <td>
                    <span className={`badge ${e.type === "in" ? "badge-pos" : "badge-neg"}`}>
                      {e.type === "in" ? <ArrowDownCircle size={12} /> : <ArrowUpCircle size={12} />}
                      {e.type === "in" ? "Masuk" : "Keluar"}
                    </span>
                  </td>
                  <td className="font-mono">{fmtRpFull(Number(e.amount))}</td>
                  <td>
                    <div className="flex gap-3 justify-end">
                      <Link href={`/cash-flow/${e.id}/edit`} className="text-xs" style={{ color: "var(--accent)" }}>Edit</Link>
                      <DeleteCashFlowBtn id={e.id} />
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
          <span style={{ color: "var(--muted)" }}>Halaman {page} dari {totalPages}</span>
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
  return <Link href={`/cash-flow?${q.toString()}`} className="btn-outline">{children}</Link>;
}
