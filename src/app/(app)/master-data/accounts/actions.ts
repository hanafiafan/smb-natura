"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { sql } from "@/lib/db";
import { getSession, requireSuperAdmin } from "@/lib/session";

function fail(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

const AccountSchema = z.object({
  section: z.enum(["revenue", "cogs", "opex", "non_op_income", "non_op_expense", "tax"]),
  category: z
    .string()
    .trim()
    .max(50)
    .optional()
    .transform((v) => v || null),
  code: z.string().trim().min(1, "Kode wajib diisi"),
  name: z.string().trim().min(2, "Nama minimal 2 karakter"),
  sign: z.coerce.number().refine((v) => v === 1 || v === -1, "Sign tidak valid"),
});

function readForm(formData: FormData) {
  return AccountSchema.safeParse({
    section: formData.get("section"),
    category: formData.get("category"),
    code: formData.get("code"),
    name: formData.get("name"),
    sign: formData.get("sign"),
  });
}

export async function createAccount(formData: FormData) {
  await requireSuperAdmin();
  const session = await getSession();
  const brandId = session.activeBrandId!;
  const parsed = readForm(formData);
  if (!parsed.success) fail("/master-data/accounts", parsed.error.issues[0].message);
  const { section, category, code, name, sign } = parsed.data;

  try {
    const [{ max }] = await sql<{ max: number | null }[]>`
      select max(sort_order) as max from accounts where brand_id = ${brandId} and section = ${section}
    `;
    await sql`
      insert into accounts (brand_id, code, name, section, category, sign, sort_order)
      values (${brandId}, ${code}, ${name}, ${section}, ${category}, ${sign}, ${(max ?? 0) + 10})
    `;
  } catch (err) {
    if ((err as { code?: string }).code === "23505") fail("/master-data/accounts", `Kode "${code}" sudah dipakai di brand ini.`);
    throw err;
  }

  revalidatePath("/master-data/accounts");
  redirect("/master-data/accounts");
}

export async function updateAccount(id: number, formData: FormData) {
  await requireSuperAdmin();
  const session = await getSession();
  const brandId = session.activeBrandId!;
  const parsed = readForm(formData);
  if (!parsed.success) fail(`/master-data/accounts/${id}/edit`, parsed.error.issues[0].message);
  const { section, category, code, name, sign } = parsed.data;

  try {
    await sql`
      update accounts set section = ${section}, category = ${category}, code = ${code}, name = ${name}, sign = ${sign}
      where id = ${id} and brand_id = ${brandId}
    `;
  } catch (err) {
    if ((err as { code?: string }).code === "23505") fail(`/master-data/accounts/${id}/edit`, `Kode "${code}" sudah dipakai di brand ini.`);
    throw err;
  }

  revalidatePath("/master-data/accounts");
  redirect("/master-data/accounts");
}

export async function toggleAccountActive(id: number) {
  await requireSuperAdmin();
  const session = await getSession();
  await sql`update accounts set is_active = not is_active where id = ${id} and brand_id = ${session.activeBrandId!}`;
  revalidatePath("/master-data/accounts");
}

// accounts.id is referenced by transactions with ON DELETE RESTRICT — if it's already
// used, just tell the admin to deactivate instead of deleting.
export async function deleteAccount(id: number) {
  await requireSuperAdmin();
  const session = await getSession();
  try {
    await sql`delete from accounts where id = ${id} and brand_id = ${session.activeBrandId!}`;
  } catch (err) {
    if ((err as { code?: string }).code === "23503") {
      fail("/master-data/accounts", "Akun ini sudah dipakai di transaksi, tidak bisa dihapus. Nonaktifkan saja.");
    }
    throw err;
  }
  revalidatePath("/master-data/accounts");
}
