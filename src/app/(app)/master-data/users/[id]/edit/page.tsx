import Link from "next/link";
import { notFound } from "next/navigation";
import { sql } from "@/lib/db";
import { requireSuperAdmin } from "@/lib/session";
import { updateUser } from "../../../actions";

export const metadata = { title: "Edit Pengguna — SMB Natura" };

export default async function EditUserPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  await requireSuperAdmin();
  const { id } = await params;
  const { error } = await searchParams;

  const [[user], brands, assigned] = await Promise.all([
    sql<{ id: string; email: string; role: "super_admin" | "brand_admin" | "viewer" }[]>`
      select id, email, role from users where id = ${id}
    `,
    sql<{ id: number; name: string; company_name: string }[]>`
      select b.id, b.name, c.name as company_name
      from brands b join companies c on c.id = b.company_id
      where b.is_active
      order by c.name, b.name
    `,
    sql<{ brand_id: number }[]>`select brand_id from user_brands where user_id = ${id}`,
  ]);
  if (!user) notFound();

  const assignedIds = new Set(assigned.map((a) => a.brand_id));
  const boundUpdate = updateUser.bind(null, user.id);

  return (
    <div className="space-y-4 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Edit Pengguna</h1>
        <Link href="/master-data" className="btn-ghost text-sm">← Kembali</Link>
      </div>
      <form action={boundUpdate} className="card p-5 space-y-4">
        <div>
          <label className="label" htmlFor="email">Email</label>
          <input id="email" name="email" type="email" className="input" defaultValue={user.email} required />
        </div>
        <div>
          <label className="label" htmlFor="password">Password baru <span className="text-gray-400 font-normal normal-case">(opsional)</span></label>
          <input id="password" name="password" type="password" className="input" minLength={6} placeholder="Kosongkan jika tidak ingin ganti password" />
        </div>
        <div>
          <label className="label" htmlFor="role">Role</label>
          <select id="role" name="role" className="select" defaultValue={user.role}>
            <option value="brand_admin">Admin Brand — akses brand tertentu saja</option>
            <option value="viewer">View Only — lihat saja, tidak bisa ubah data</option>
            <option value="super_admin">Super Admin — akses semua perusahaan & brand</option>
          </select>
        </div>
        <div>
          <label className="label">Brand yang bisa diakses <span className="text-gray-400 font-normal normal-case">(khusus role Admin Brand & View Only)</span></label>
          {brands.length === 0 ? (
            <p className="text-xs" style={{ color: "var(--muted)" }}>Belum ada brand — buat brand dulu.</p>
          ) : (
            <div className="space-y-1.5">
              {brands.map((b) => (
                <label key={b.id} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="brand_ids" value={b.id} defaultChecked={assignedIds.has(b.id)} />
                  {b.company_name} — {b.name}
                </label>
              ))}
            </div>
          )}
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
