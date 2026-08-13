import Link from "next/link";
import { notFound } from "next/navigation";
import { sql } from "@/lib/db";
import { getSession, requireSuperAdmin } from "@/lib/session";
import type { Account } from "@/lib/database.types";
import { categoriesBySection } from "@/lib/account-categories";
import { AccountForm } from "@/components/account-form";
import { SECTION_LABELS } from "../../page";
import { updateAccount } from "../../actions";

export const metadata = { title: "Edit Akun — SMB Natura" };

export default async function EditAccountPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  await requireSuperAdmin();
  const { id } = await params;
  const { error } = await searchParams;
  const session = await getSession();
  const brandId = session.activeBrandId!;

  const [[account], accounts] = await Promise.all([
    sql<Account[]>`select * from accounts where id = ${id} and brand_id = ${brandId}`,
    sql<Account[]>`select * from accounts where brand_id = ${brandId} order by section, sort_order`,
  ]);
  if (!account) notFound();

  const boundUpdate = updateAccount.bind(null, account.id);

  return (
    <div className="space-y-4 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Edit Akun</h1>
        <Link href="/master-data/accounts" className="btn-ghost text-sm">← Kembali</Link>
      </div>
      <div className="card p-5">
        <AccountForm
          action={boundUpdate}
          sectionLabels={SECTION_LABELS}
          categoriesBySection={categoriesBySection(accounts)}
          defaultValues={{ section: account.section, category: account.category, code: account.code, name: account.name, sign: account.sign }}
          submitLabel="Simpan Perubahan"
          error={error ? decodeURIComponent(error) : undefined}
        />
      </div>
    </div>
  );
}
