import Link from "next/link";
import { CheckCircle2, XCircle, Package } from "lucide-react";
import { sql } from "@/lib/db";
import { getSession } from "@/lib/session";
import { getAccessibleBrands } from "@/lib/brands";
import type { Product } from "@/lib/database.types";
import { fmtRpFull } from "@/lib/format";
import { toggleProductActive } from "./actions";
import { BrandFilterCard } from "@/components/brand-filter";

export const metadata = { title: "Produk — SMB Natura" };

export default async function ProductsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const sp = await searchParams;
  const q = sp.q?.trim();
  const session = await getSession();
  const brandId = session.activeBrandId!;

  const [products, brands] = await Promise.all([
    q
      ? sql<Product[]>`
          select * from products where brand_id = ${brandId} and (name ilike ${"%" + q + "%"} or sku ilike ${"%" + q + "%"})
          order by name
        `
      : sql<Product[]>`select * from products where brand_id = ${brandId} order by name`,
    getAccessibleBrands(session.userId!, session.role!),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold">Produk</h1>
          <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
            Master SKU, harga jual, dan HPP bahan baku.
          </p>
        </div>
        <Link href="/products/new" className="btn">+ Tambah Produk</Link>
      </div>

      <BrandFilterCard brands={brands} activeBrandId={brandId} />

      <form className="card p-4 flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[200px]">
          <label className="label" htmlFor="q">Cari</label>
          <input type="text" id="q" name="q" defaultValue={q ?? ""} className="input" placeholder="nama atau SKU" />
        </div>
        <div className="flex gap-2">
          <button type="submit" className="btn">Cari</button>
          <Link href="/products" className="btn-outline">Reset</Link>
        </div>
      </form>

      <div className="card overflow-x-auto">
        {products.length === 0 ? (
          <div className="p-10 text-center" style={{ color: "var(--muted)" }}>Belum ada produk.</div>
        ) : (
          <table className="pnl-table">
            <thead>
              <tr>
                <th>SKU</th><th>Nama Barang</th><th>Ukuran</th><th>Harga Jual</th><th>HPP</th><th></th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="item" style={!p.is_active ? { opacity: 0.5 } : undefined}>
                  <td style={{ paddingLeft: 12 }} className="font-mono text-xs">{p.sku}</td>
                  <td className="inline-flex items-center gap-1.5"><Package size={13} /> {p.name}</td>
                  <td>{p.size_label ?? <span style={{ color: "var(--muted)" }}>—</span>}</td>
                  <td className="font-mono">{fmtRpFull(Number(p.price))}</td>
                  <td className="font-mono">{fmtRpFull(Number(p.cogs))}</td>
                  <td>
                    <div className="flex gap-3 justify-end items-center">
                      <Link href={`/products/${p.id}/edit`} className="text-xs" style={{ color: "var(--accent)" }}>Edit</Link>
                      <form action={toggleProductActive.bind(null, p.id)}>
                        <button type="submit" className="text-xs inline-flex items-center gap-1" style={{ color: p.is_active ? "var(--neg)" : "var(--pos)" }}>
                          {p.is_active ? <><XCircle size={13} /> Nonaktifkan</> : <><CheckCircle2 size={13} /> Aktifkan</>}
                        </button>
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
