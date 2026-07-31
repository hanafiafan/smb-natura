import Link from "next/link";
import { createProduct } from "../actions";

export const metadata = { title: "Tambah Produk — SMB Natura" };

export default async function NewProductPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;

  return (
    <div className="space-y-4 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Tambah Produk</h1>
        <Link href="/products" className="btn-ghost text-sm">← Kembali</Link>
      </div>
      <form action={createProduct} className="card p-5 space-y-4">
        <div>
          <label className="label" htmlFor="sku">SKU</label>
          <input id="sku" name="sku" type="text" className="input" placeholder="mis. ATR-FNG-BAK1" required />
        </div>
        <div>
          <label className="label" htmlFor="name">Nama Barang</label>
          <input id="name" name="name" type="text" className="input" required />
        </div>
        <div>
          <label className="label" htmlFor="size_label">Ukuran <span className="text-gray-400 font-normal normal-case">(opsional)</span></label>
          <input id="size_label" name="size_label" type="text" className="input" placeholder="mis. 500 ml" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label" htmlFor="price">Harga Jual</label>
            <input id="price" name="price" type="number" step="1" min="0" className="input" defaultValue={0} required />
          </div>
          <div>
            <label className="label" htmlFor="cogs">HPP Bahan Baku</label>
            <input id="cogs" name="cogs" type="number" step="1" min="0" className="input" defaultValue={0} required />
          </div>
        </div>
        {error && (
          <div className="rounded-xl px-3 py-2 text-xs" style={{ background: "var(--neg-soft)", color: "var(--neg)" }}>
            {decodeURIComponent(error)}
          </div>
        )}
        <button type="submit" className="btn w-full">Simpan Produk</button>
      </form>
    </div>
  );
}
