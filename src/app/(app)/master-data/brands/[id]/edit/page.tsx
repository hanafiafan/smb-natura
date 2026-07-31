import Link from "next/link";
import { notFound } from "next/navigation";
import { sql } from "@/lib/db";
import { requireSuperAdmin } from "@/lib/session";
import { updateBrand } from "../../../actions";

export const metadata = { title: "Edit Brand — SMB Natura" };

export default async function EditBrandPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  await requireSuperAdmin();
  const { id } = await params;
  const { error } = await searchParams;

  const [[brand], companies] = await Promise.all([
    sql<{ id: number; company_id: number; name: string }[]>`select id, company_id, name from brands where id = ${id}`,
    sql<{ id: number; name: string }[]>`select id, name from companies order by name`,
  ]);
  if (!brand) notFound();

  const boundUpdate = updateBrand.bind(null, brand.id);

  return (
    <div className="space-y-4 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Edit Brand</h1>
        <Link href="/master-data" className="btn-ghost text-sm">← Kembali</Link>
      </div>
      <form action={boundUpdate} className="card p-5 space-y-4">
        <div>
          <label className="label" htmlFor="company_id">Perusahaan</label>
          <select id="company_id" name="company_id" className="select" defaultValue={brand.company_id} required>
            {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="name">Nama Brand</label>
          <input id="name" name="name" className="input" defaultValue={brand.name} required />
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
