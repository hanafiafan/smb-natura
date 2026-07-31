"use client";

import { useTransition } from "react";
import { deleteCashFlowEntry } from "@/app/(app)/cash-flow/actions";

export function DeleteCashFlowBtn({ id }: { id: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      className="text-xs"
      style={{ color: "var(--neg)", opacity: pending ? 0.5 : 1 }}
      disabled={pending}
      onClick={() => {
        if (!confirm("Hapus catatan arus kas ini? Aksi tidak bisa dibatalkan.")) return;
        start(async () => { await deleteCashFlowEntry(id); });
      }}
    >
      {pending ? "Menghapus…" : "Hapus"}
    </button>
  );
}
