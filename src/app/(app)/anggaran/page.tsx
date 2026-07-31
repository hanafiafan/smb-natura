import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { sql } from "@/lib/db";
import { getSession } from "@/lib/session";
import { getAccessibleBrands } from "@/lib/brands";
import type { Account } from "@/lib/database.types";
import { buildPnL, type PnLRow } from "@/lib/pnl";
import { fmtRpFull, firstOfMonth, lastOfMonth } from "@/lib/format";
import { saveBudgetTargets } from "./actions";
import { BrandFilterCard } from "@/components/brand-filter";

export const metadata = { title: "Anggaran — SMB Natura" };

function achievementPct(target: number, actual: number): string {
  if (target === 0) return actual === 0 ? "0%" : "—";
  return `${((actual / target) * 100).toFixed(1)}%`;
}

export default async function AnggaranPage({
  searchParams,
}: {
  searchParams: Promise<{ start?: string; end?: string; ok?: string }>;
}) {
  const sp = await searchParams;
  const start = sp.start ?? firstOfMonth();
  const end = sp.end ?? lastOfMonth();

  const session = await getSession();
  const brandId = session.activeBrandId!;

  const [accounts, targets, txns, brands] = await Promise.all([
    sql<Account[]>`select * from accounts where brand_id = ${brandId} and is_active = true order by sort_order asc`,
    sql<{ account_id: number; target_amount: number }[]>`
      select account_id, target_amount from budget_targets
      where brand_id = ${brandId} and period_start = ${start} and period_end = ${end}
    `,
    sql<{ account_id: number; amount: number }[]>`
      select account_id, amount from transactions
      where brand_id = ${brandId} and txn_date >= ${start} and txn_date <= ${end}
    `,
    getAccessibleBrands(session.userId!, session.role!),
  ]);

  const targetMap = new Map(targets.map((t) => [t.account_id, Number(t.target_amount)]));
  const realisasiMap = new Map<number, number>();
  for (const t of txns) realisasiMap.set(t.account_id, (realisasiMap.get(t.account_id) ?? 0) + Number(t.amount));

  const aggs = accounts.map((a) => ({ account_id: a.id, a: targetMap.get(a.id) ?? 0, b: realisasiMap.get(a.id) ?? 0 }));
  const pnl = buildPnL(accounts, aggs);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold">Anggaran</h1>
          <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>Target vs Realisasi per akun untuk satu periode.</p>
        </div>
      </div>

      <BrandFilterCard brands={brands} activeBrandId={brandId} />

      {sp.ok && (
        <div className="rounded-xl px-4 py-3 text-sm font-medium flex items-center gap-2"
          style={{ color: "var(--pos)", background: "var(--pos-soft)", border: "1px solid var(--color-brand-100)" }}>
          <CheckCircle2 size={16} />
          <span>Target berhasil disimpan.</span>
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
        <div className="flex gap-2">
          <button type="submit" className="btn">Terapkan</button>
          <Link href="/anggaran" className="btn-outline">Reset</Link>
        </div>
      </form>

      <form action={saveBudgetTargets} className="card p-5 space-y-3">
        <input type="hidden" name="period_start" value={start} />
        <input type="hidden" name="period_end" value={end} />
        <h2 className="text-sm font-bold">Set Target per Akun</h2>
        <div className="overflow-x-auto">
          <table className="pnl-table">
            <thead><tr><th>Akun</th><th>Target</th></tr></thead>
            <tbody>
              {accounts.map((a) => (
                <tr key={a.id} className="item">
                  <td style={{ paddingLeft: 12 }}>{a.name}</td>
                  <td>
                    <input type="hidden" name="account_id" value={a.id} />
                    <input
                      type="number"
                      name={`target_${a.id}`}
                      className="input"
                      defaultValue={targetMap.get(a.id) ?? 0}
                      min="0"
                      step="1"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button type="submit" className="btn">Simpan Target</button>
      </form>

      <div className="card p-5 overflow-x-auto">
        <h2 className="text-sm font-bold mb-3">Target vs Realisasi</h2>
        <table className="pnl-table">
          <thead>
            <tr><th className="text-left">Deskripsi</th><th>Target</th><th>Realisasi</th><th>Capaian</th></tr>
          </thead>
          <tbody>{pnl.rows.map((r, i) => renderRow(r, i))}</tbody>
        </table>
      </div>
    </div>
  );
}

function renderRow(r: PnLRow, i: number) {
  if (r.kind === "section") {
    if (r.total) {
      return (
        <tr key={i} className="row-total">
          <td>{r.label}</td><td>{fmtRpFull(r.a)}</td><td>{fmtRpFull(r.b)}</td><td>{achievementPct(r.a, r.b)}</td>
        </tr>
      );
    }
    return <tr key={i} className="row-section"><td colSpan={4}>{r.label}</td></tr>;
  }
  if (r.kind === "category") {
    return (
      <tr key={i} className="row-category">
        <td>{r.label}</td><td>{fmtRpFull(r.a)}</td><td>{fmtRpFull(r.b)}</td><td>{achievementPct(r.a, r.b)}</td>
      </tr>
    );
  }
  if (r.kind === "subtotal") {
    return (
      <tr key={i} className="row-subtotal">
        <td>{r.label}</td><td>{fmtRpFull(r.a)}</td><td>{fmtRpFull(r.b)}</td><td>{achievementPct(r.a, r.b)}</td>
      </tr>
    );
  }
  return (
    <tr key={i} className="row-item">
      <td>{r.account.name}</td><td>{fmtRpFull(r.a)}</td><td>{fmtRpFull(r.b)}</td><td>{achievementPct(r.a, r.b)}</td>
    </tr>
  );
}
