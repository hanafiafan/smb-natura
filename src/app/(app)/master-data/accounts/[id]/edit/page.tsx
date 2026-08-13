import Link from "next/link";
import { notFound } from "next/navigation";
import { sql } from "@/lib/db";
import { getSession, requireSuperAdmin } from "@/lib/session";
import type { Account } from "@/lib/database.types";
import { SECTION_LABELS } from "../../page";
import { updateAccount } from "../../actions";

export const metadata = { title: "Edit Akun — SMB Natura" };

export default async function EditAccountPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  await requireSuperAdmin();
  const { id } = await params;
  const { error } = await searchParams;
  const session = await getSession();

  const [account] = await sql<Account[]>`select * from accounts where id = ${id} and brand_id = ${session.activeBrandId!}`;
  if (!account) notFound();

  const boundUpdate = updateAccount.bind(null, account.id);

  return (
    <div className="space-y-4 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Edit Akun</h1>
        <Link href="/master-data/accounts" className="btn-ghost text-sm">← Kembali</Link>
      </div>
      <form action={boundUpdate} className="card p-5 space-y-4">
        <div>
          <label className="label" htmlFor="section">Jenis</label>
          <select id="section" name="section" className="select" defaultValue={account.section} required>
            {Object.entries(SECTION_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="category">Kategori</label>
          <input id="category" name="category" className="input" defaultValue={account.category ?? ""} />
        </div>
        <div>
          <label className="label" htmlFor="code">Kode</label>
          <input id="code" name="code" className="input" defaultValue={account.code} required />
        </div>
        <div>
          <label className="label" htmlFor="sign">Tipe Nilai</label>
          <select id="sign" name="sign" className="select" defaultValue={String(account.sign)}>
            <option value="1">Normal (+)</option>
            <option value="-1">Pengurang (-)</option>
          </select>
        </div>
        <div>
          <label className="label" htmlFor="name">Nama</label>
          <input id="name" name="name" className="input" defaultValue={account.name} required />
        </div>
        {error && (
          <div className="rounded-xl px-3 py-2 text-xs" style={{ background: "var(--neg-soft)", color: "var(--neg)" }}>
            {decodeURIComponent(error)}
          </div>
        )}
        <button type="submit" className="btn w-full">Simpan Perubahan</button>
      </form>
    </div>
  );
}
