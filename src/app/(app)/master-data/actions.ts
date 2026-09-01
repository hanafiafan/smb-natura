"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { sql } from "@/lib/db";
import { hashPassword, requireSuperAdmin } from "@/lib/session";
import { COA_TEMPLATE } from "@/lib/coa-template";

function fail(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

const CompanySchema = z.object({ name: z.string().trim().min(2, "Nama perusahaan minimal 2 karakter") });

export async function createCompany(formData: FormData) {
  await requireSuperAdmin();
  const parsed = CompanySchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) fail("/master-data/companies/new", parsed.error.issues[0].message);

  await sql`insert into companies (name) values (${parsed.data.name})`;
  revalidatePath("/master-data");
  redirect("/master-data");
}

export async function updateCompany(id: number, formData: FormData) {
  await requireSuperAdmin();
  const parsed = CompanySchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) fail(`/master-data/companies/${id}/edit`, parsed.error.issues[0].message);

  await sql`update companies set name = ${parsed.data.name} where id = ${id}`;
  revalidatePath("/master-data");
  redirect("/master-data");
}

const BrandSchema = z.object({
  company_id: z.coerce.number().int().positive("Pilih perusahaan"),
  name: z.string().trim().min(2, "Nama brand minimal 2 karakter"),
});

export async function createBrand(formData: FormData) {
  await requireSuperAdmin();
  const parsed = BrandSchema.safeParse({
    company_id: formData.get("company_id"),
    name: formData.get("name"),
  });
  if (!parsed.success) fail("/master-data/brands/new", parsed.error.issues[0].message);

  const [brand] = await sql<{ id: number }[]>`
    insert into brands (company_id, name) values (${parsed.data.company_id}, ${parsed.data.name}) returning id
  `;

  // Give every new brand its own starter Chart of Accounts. Uses a static template (not a
  // copy of some other brand's live rows) so deleting/renaming any brand — Natura included —
  // can never break COA seeding for brands created afterward.
  const rows = COA_TEMPLATE.map((r) => ({ ...r, brand_id: brand.id, is_active: true }));
  await sql`
    insert into accounts ${sql(rows, "brand_id", "code", "name", "section", "category", "sign", "sort_order", "is_active")}
  `;

  revalidatePath("/master-data");
  redirect("/master-data");
}

export async function updateBrand(id: number, formData: FormData) {
  await requireSuperAdmin();
  const parsed = BrandSchema.safeParse({
    company_id: formData.get("company_id"),
    name: formData.get("name"),
  });
  if (!parsed.success) fail(`/master-data/brands/${id}/edit`, parsed.error.issues[0].message);

  await sql`update brands set company_id = ${parsed.data.company_id}, name = ${parsed.data.name} where id = ${id}`;
  revalidatePath("/master-data");
  redirect("/master-data");
}

export async function toggleBrandActive(brandId: number) {
  await requireSuperAdmin();
  await sql`update brands set is_active = not is_active where id = ${brandId}`;
  revalidatePath("/master-data");
}

// Cascades to accounts, transactions, cash_flow_entries, cash_accounts, products,
// budget_targets, and user_brands for this brand — all FKs are ON DELETE CASCADE.
export async function deleteBrand(brandId: number) {
  await requireSuperAdmin();
  await sql`delete from brands where id = ${brandId}`;
  revalidatePath("/master-data");
}

// companies.brands is ON DELETE RESTRICT — the UI only shows this action once a
// company has zero brands left, so this should always succeed; the try/catch is just
// a safety net against a race (a brand added in another tab between page load and click).
export async function deleteCompany(companyId: number) {
  await requireSuperAdmin();
  try {
    await sql`delete from companies where id = ${companyId}`;
  } catch (err) {
    if ((err as { code?: string }).code === "23503") {
      fail("/master-data", "Perusahaan ini masih punya brand — hapus brand-nya dulu.");
    }
    throw err;
  }
  revalidatePath("/master-data");
}

const UserSchema = z.object({
  email: z.email(),
  password: z.string().min(6, "Password minimal 6 karakter"),
  role: z.enum(["super_admin", "brand_admin", "viewer"]),
  brand_ids: z.array(z.coerce.number().int()).optional(),
});

export async function createUser(formData: FormData) {
  await requireSuperAdmin();
  const parsed = UserSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role"),
    brand_ids: formData.getAll("brand_ids"),
  });
  if (!parsed.success) fail("/master-data/users/new", parsed.error.issues[0].message);
  if (parsed.data.role !== "super_admin" && !parsed.data.brand_ids?.length) {
    fail("/master-data/users/new", "Pilih minimal 1 brand.");
  }

  const passwordHash = hashPassword(parsed.data.password);
  let userId: string;
  try {
    const [user] = await sql<{ id: string }[]>`
      insert into users (email, password_hash, role)
      values (${parsed.data.email}, ${passwordHash}, ${parsed.data.role})
      returning id
    `;
    userId = user.id;
  } catch (err) {
    if ((err as { code?: string }).code === "23505") fail("/master-data/users/new", "Email sudah dipakai akun lain.");
    fail("/master-data/users/new", "Gagal membuat pengguna. Coba lagi.");
  }

  if (parsed.data.role !== "super_admin" && parsed.data.brand_ids?.length) {
    for (const brandId of parsed.data.brand_ids) {
      await sql`insert into user_brands (user_id, brand_id) values (${userId}, ${brandId})`;
    }
  }

  revalidatePath("/master-data");
  redirect("/master-data");
}

const UserUpdateSchema = z.object({
  email: z.email(),
  password: z.union([z.string().length(0), z.string().min(6, "Password minimal 6 karakter")]),
  role: z.enum(["super_admin", "brand_admin", "viewer"]),
  brand_ids: z.array(z.coerce.number().int()).optional(),
});

// Below this many, refuse to demote/delete a super_admin so the tenant never ends up
// with zero accounts able to reach Master Data.
const MIN_SUPER_ADMINS = 1;

async function superAdminCount(): Promise<number> {
  const [{ count }] = await sql<{ count: number }[]>`select count(*)::int as count from users where role = 'super_admin'`;
  return count;
}

export async function updateUser(id: string, formData: FormData) {
  await requireSuperAdmin();
  const parsed = UserUpdateSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password") ?? "",
    role: formData.get("role"),
    brand_ids: formData.getAll("brand_ids"),
  });
  if (!parsed.success) fail(`/master-data/users/${id}/edit`, parsed.error.issues[0].message);
  if (parsed.data.role !== "super_admin" && !parsed.data.brand_ids?.length) {
    fail(`/master-data/users/${id}/edit`, "Pilih minimal 1 brand.");
  }

  const [current] = await sql<{ role: string }[]>`select role from users where id = ${id}`;
  if (current?.role === "super_admin" && parsed.data.role !== "super_admin" && (await superAdminCount()) <= MIN_SUPER_ADMINS) {
    fail(`/master-data/users/${id}/edit`, "Tidak bisa menurunkan role Super Admin terakhir.");
  }

  try {
    if (parsed.data.password) {
      const passwordHash = hashPassword(parsed.data.password);
      await sql`update users set email = ${parsed.data.email}, role = ${parsed.data.role}, password_hash = ${passwordHash} where id = ${id}`;
    } else {
      await sql`update users set email = ${parsed.data.email}, role = ${parsed.data.role} where id = ${id}`;
    }
  } catch (err) {
    if ((err as { code?: string }).code === "23505") fail(`/master-data/users/${id}/edit`, "Email sudah dipakai akun lain.");
    fail(`/master-data/users/${id}/edit`, "Gagal menyimpan perubahan. Coba lagi.");
  }

  await sql`delete from user_brands where user_id = ${id}`;
  if (parsed.data.role !== "super_admin" && parsed.data.brand_ids?.length) {
    for (const brandId of parsed.data.brand_ids) {
      await sql`insert into user_brands (user_id, brand_id) values (${id}, ${brandId})`;
    }
  }

  revalidatePath("/master-data");
  redirect("/master-data");
}

export async function deleteUser(userId: string) {
  const session = await requireSuperAdmin();
  if (userId === session.userId) fail("/master-data", "Tidak bisa menghapus akun Anda sendiri.");

  const [target] = await sql<{ role: string }[]>`select role from users where id = ${userId}`;
  if (target?.role === "super_admin" && (await superAdminCount()) <= MIN_SUPER_ADMINS) {
    fail("/master-data", "Tidak bisa menghapus Super Admin terakhir.");
  }

  await sql`delete from users where id = ${userId}`;
  revalidatePath("/master-data");
}
