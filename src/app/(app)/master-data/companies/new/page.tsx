import Link from "next/link";
import { requireSuperAdmin } from "@/lib/session";
import { createCompany } from "../../actions";

export const metadata = { title: "Tambah Perusahaan — SMB Natura" };

export default async function NewCompanyPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await requireSuperAdmin();
  const { error } = await searchParams;

  return (
    <div className="space-y-4 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Tambah Perusahaan</h1>
        <Link href="/master-data" className="btn-ghost text-sm">← Kembali</Link>
      </div>
      <form action={createCompany} className="card p-5 space-y-4">
        <div>
          <label className="label" htmlFor="name">Nama Perusahaan (CV/PT)</label>
          <input id="name" name="name" className="input" placeholder="Contoh: CV Loka Bumi Persada" required />
        </div>
        {error && (
          <div className="rounded-xl px-3 py-2 text-xs" style={{ background: "var(--neg-soft)", color: "var(--neg)" }}>
            {decodeURIComponent(error)}
          </div>
        )}
        <button type="submit" className="btn w-full">Simpan Perusahaan</button>
      </form>
    </div>
  );
}
