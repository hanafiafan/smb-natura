"use client";

import { useTransition } from "react";
import { deleteTransaction } from "@/app/(app)/transactions/actions";

export function DeleteBtn({ id }: { id: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      className="text-xs"
      style={{ color: "var(--neg)", opacity: pending ? 0.5 : 1 }}
      disabled={pending}
      onClick={() => {
        if (!confirm("Hapus transaksi ini? Aksi tidak bisa dibatalkan.")) return;
        start(async () => {
          try {
            await deleteTransaction(id);
          } catch {
            alert("Gagal menghapus transaksi. Coba lagi.");
          }
        });
      }}
    >
      {pending ? "Menghapus…" : "Hapus"}
    </button>
  );
}
