"use client";

import { useTransition } from "react";
import { deleteUser } from "@/app/(app)/master-data/actions";

export function DeleteUserBtn({ id, email }: { id: string; email: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      className="text-xs"
      style={{ color: "var(--neg)", opacity: pending ? 0.5 : 1 }}
      disabled={pending}
      onClick={() => {
        if (!confirm(`Hapus pengguna "${email}"? Aksi ini tidak bisa dibatalkan.`)) return;
        start(async () => { await deleteUser(id); });
      }}
    >
      Hapus
    </button>
  );
}
