import Link from "next/link";
import { Building2, Tag, Users, CheckCircle2, XCircle, Pencil } from "lucide-react";
import { sql } from "@/lib/db";
import { requireSuperAdmin } from "@/lib/session";
import { toggleBrandActive, deleteUser } from "./actions";

export const metadata = { title: "Master Data — SMB Natura" };

type CompanyWithBrands = {
  id: number;
  name: string;
  brands: { id: number; name: string; is_active: boolean }[];
};

type UserRow = {
  id: string;
  email: string;
  role: "super_admin" | "brand_admin";
  brand_names: string[];
};

export default async function MasterDataPage() {
  await requireSuperAdmin();

  const [companyRows, userRows] = await Promise.all([
    sql<{ id: number; name: string; brand_id: number | null; brand_name: string | null; brand_active: boolean | null }[]>`
      select c.id, c.name, b.id as brand_id, b.name as brand_name, b.is_active as brand_active
      from companies c
      left join brands b on b.company_id = c.id
      order by c.name, b.name
    `,
    sql<{ id: string; email: string; role: "super_admin" | "brand_admin"; brand_name: string | null }[]>`
      select u.id, u.email, u.role, b.name as brand_name
      from users u
      left join user_brands ub on ub.user_id = u.id
      left join brands b on b.id = ub.brand_id
      order by u.email
    `,
  ]);

  const companies: CompanyWithBrands[] = [];
  for (const row of companyRows) {
    let company = companies.find((c) => c.id === row.id);
    if (!company) {
      company = { id: row.id, name: row.name, brands: [] };
      companies.push(company);
    }
    if (row.brand_id) company.brands.push({ id: row.brand_id, name: row.brand_name!, is_active: row.brand_active! });
  }

  const users: UserRow[] = [];
  for (const row of userRows) {
    let user = users.find((u) => u.id === row.id);
    if (!user) {
      user = { id: row.id, email: row.email, role: row.role, brand_names: [] };
      users.push(user);
    }
    if (row.brand_name) user.brand_names.push(row.brand_name);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">Master Data</h1>
        <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
          Kelola perusahaan, brand, dan akun pengguna.
        </p>
      </div>

      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold flex items-center gap-2"><Building2 size={16} /> Perusahaan & Brand</h2>
          <div className="flex gap-2">
            <Link href="/master-data/brands/new" className="btn-outline text-xs"><Tag size={14} /> Tambah Brand</Link>
            <Link href="/master-data/companies/new" className="btn text-xs"><Building2 size={14} /> Tambah Perusahaan</Link>
          </div>
        </div>

        {companies.length === 0 ? (
          <p className="text-sm text-center py-6" style={{ color: "var(--muted)" }}>Belum ada perusahaan.</p>
        ) : (
          <div className="space-y-4">
            {companies.map((c) => (
              <div key={c.id} className="rounded-xl border border-gray-200 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="font-semibold text-sm text-gray-900">{c.name}</div>
                  <Link href={`/master-data/companies/${c.id}/edit`} className="text-xs" style={{ color: "var(--accent)" }}>
                    Edit
                  </Link>
                </div>
                {c.brands.length === 0 ? (
                  <p className="text-xs" style={{ color: "var(--muted)" }}>Belum ada brand.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {c.brands.map((b) => (
                      <div key={b.id} className="chip" style={!b.is_active ? { opacity: 0.5 } : undefined}>
                        {b.name}
                        <Link href={`/master-data/brands/${b.id}/edit`} title="Edit brand">
                          <Pencil size={12} />
                        </Link>
                        <form action={toggleBrandActive.bind(null, b.id)}>
                          <button type="submit" title={b.is_active ? "Nonaktifkan brand" : "Aktifkan brand"}>
                            {b.is_active ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                          </button>
                        </form>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold flex items-center gap-2"><Users size={16} /> Pengguna</h2>
          <Link href="/master-data/users/new" className="btn text-xs"><Users size={14} /> Tambah Pengguna</Link>
        </div>

        {users.length === 0 ? (
          <p className="text-sm text-center py-6" style={{ color: "var(--muted)" }}>Belum ada pengguna.</p>
        ) : (
          <table className="pnl-table">
            <thead><tr><th>Email</th><th>Role</th><th>Brand</th><th></th></tr></thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="item">
                  <td style={{ paddingLeft: 12 }}>{u.email}</td>
                  <td>{u.role === "super_admin" ? "Super Admin" : "Admin Brand"}</td>
                  <td>{u.brand_names.join(", ") || "—"}</td>
                  <td>
                    <div className="flex gap-3 justify-end">
                      <Link href={`/master-data/users/${u.id}/edit`} className="text-xs" style={{ color: "var(--accent)" }}>Edit</Link>
                      <form action={deleteUser.bind(null, u.id)}>
                        <button type="submit" className="text-xs" style={{ color: "var(--neg)" }}>Hapus</button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
