"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteBrand } from "@/app/(app)/master-data/actions";

export function DeleteBrandBtn({ id, name }: { id: number; name: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      title="Hapus brand"
      style={{ color: "var(--neg)", opacity: pending ? 0.5 : 1 }}
      disabled={pending}
      onClick={() => {
        if (
          !confirm(
            `Hapus brand "${name}"? SEMUA data brand ini akan ikut terhapus permanen: Chart of Accounts, Transaksi, Arus Kas, Produk, dan Anggaran. Aksi ini tidak bisa dibatalkan.`,
          )
        ) return;
        start(async () => { await deleteBrand(id); });
      }}
    >
      <Trash2 size={12} />
    </button>
  );
}
