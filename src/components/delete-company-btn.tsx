"use client";

import { useTransition } from "react";
import { deleteCompany } from "@/app/(app)/master-data/actions";

export function DeleteCompanyBtn({ id, name }: { id: number; name: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      className="text-xs"
      style={{ color: "var(--neg)", opacity: pending ? 0.5 : 1 }}
      disabled={pending}
      onClick={() => {
        if (!confirm(`Hapus perusahaan "${name}"? Aksi ini tidak bisa dibatalkan.`)) return;
        start(async () => { await deleteCompany(id); });
      }}
    >
      Hapus
    </button>
  );
}
