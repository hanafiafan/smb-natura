import Link from "next/link";
import { notFound } from "next/navigation";
import { sql } from "@/lib/db";
import { requireSuperAdmin } from "@/lib/session";
import { updateCompany } from "../../../actions";

export const metadata = { title: "Edit Perusahaan — SMB Natura" };

export default async function EditCompanyPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  await requireSuperAdmin();
  const { id } = await params;
  const { error } = await searchParams;

  const [company] = await sql<{ id: number; name: string }[]>`select id, name from companies where id = ${id}`;
  if (!company) notFound();

  const boundUpdate = updateCompany.bind(null, company.id);

  return (
    <div className="space-y-4 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Edit Perusahaan</h1>
        <Link href="/master-data" className="btn-ghost text-sm">← Kembali</Link>
      </div>
      <form action={boundUpdate} className="card p-5 space-y-4">
        <div>
          <label className="label" htmlFor="name">Nama Perusahaan (CV/PT)</label>
          <input id="name" name="name" className="input" defaultValue={company.name} required />
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
