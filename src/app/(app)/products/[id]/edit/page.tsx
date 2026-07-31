import Link from "next/link";
import { notFound } from "next/navigation";
import { sql } from "@/lib/db";
import { getSession } from "@/lib/session";
import type { Product } from "@/lib/database.types";
import { updateProduct } from "../../actions";

export const metadata = { title: "Edit Produk — SMB Natura" };

export default async function EditProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const session = await getSession();

  const [product] = await sql<Product[]>`
    select * from products where id = ${id} and brand_id = ${session.activeBrandId!}
  `;
  if (!product) notFound();

  const boundUpdate = updateProduct.bind(null, product.id);

  return (
    <div className="space-y-4 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Edit Produk</h1>
        <Link href="/products" className="btn-ghost text-sm">← Kembali</Link>
      </div>
      <form action={boundUpdate} className="card p-5 space-y-4">
        <div>
          <label className="label" htmlFor="sku">SKU</label>
          <input id="sku" name="sku" type="text" className="input" defaultValue={product.sku} required />
        </div>
        <div>
          <label className="label" htmlFor="name">Nama Barang</label>
          <input id="name" name="name" type="text" className="input" defaultValue={product.name} required />
        </div>
        <div>
          <label className="label" htmlFor="size_label">Ukuran <span className="text-gray-400 font-normal normal-case">(opsional)</span></label>
          <input id="size_label" name="size_label" type="text" className="input" defaultValue={product.size_label ?? ""} placeholder="mis. 500 ml" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label" htmlFor="price">Harga Jual</label>
            <input id="price" name="price" type="number" step="1" min="0" className="input" defaultValue={product.price} required />
          </div>
          <div>
            <label className="label" htmlFor="cogs">HPP Bahan Baku</label>
            <input id="cogs" name="cogs" type="number" step="1" min="0" className="input" defaultValue={product.cogs} required />
          </div>
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
