"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteAccount } from "@/app/(app)/master-data/accounts/actions";

export function DeleteAccountBtn({ id, name }: { id: number; name: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      title="Hapus akun"
      style={{ color: "var(--neg)", opacity: pending ? 0.5 : 1 }}
      disabled={pending}
      onClick={() => {
        if (!confirm(`Hapus akun "${name}"? Aksi ini tidak bisa dibatalkan.`)) return;
        start(async () => { await deleteAccount(id); });
      }}
    >
      <Trash2 size={12} />
    </button>
  );
}
