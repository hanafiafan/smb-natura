import Link from "next/link";
import { sql } from "@/lib/db";
import { requireSuperAdmin } from "@/lib/session";
import { createBrand } from "../../actions";

export const metadata = { title: "Tambah Brand — SMB Natura" };

export default async function NewBrandPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; company_id?: string }>;
}) {
  await requireSuperAdmin();
  const { error, company_id } = await searchParams;
  const companies = await sql<{ id: number; name: string }[]>`select id, name from companies order by name`;

  return (
    <div className="space-y-4 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Tambah Brand</h1>
        <Link href="/master-data" className="btn-ghost text-sm">← Kembali</Link>
      </div>
      {companies.length === 0 ? (
        <div className="card p-5 text-sm text-center" style={{ color: "var(--muted)" }}>
          Buat perusahaan dulu sebelum menambah brand.{" "}
          <Link href="/master-data/companies/new" className="text-brand-600 font-medium">Tambah Perusahaan</Link>
        </div>
      ) : (
        <form action={createBrand} className="card p-5 space-y-4">
          <div>
            <label className="label" htmlFor="company_id">Perusahaan</label>
            <select id="company_id" name="company_id" className="select" defaultValue={company_id ?? ""} required>
              <option value="" disabled>Pilih perusahaan</option>
              {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="name">Nama Brand</label>
            <input id="name" name="name" className="input" placeholder="Contoh: Natura" required />
          </div>
          <p className="text-[11px] text-gray-500">
            Chart of Accounts standar (mengikuti template Natura) otomatis dibuat untuk brand baru.
          </p>
          {error && (
            <div className="rounded-xl px-3 py-2 text-xs" style={{ background: "var(--neg-soft)", color: "var(--neg)" }}>
              {decodeURIComponent(error)}
            </div>
          )}
          <button type="submit" className="btn w-full">Simpan Brand</button>
        </form>
      )}
    </div>
  );
}
