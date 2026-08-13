"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { sql } from "@/lib/db";
import { getSession } from "@/lib/session";

function fail(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

const ProductSchema = z.object({
  sku: z.string().trim().min(1, "SKU wajib diisi").max(50).transform((v) => v.toUpperCase()),
  name: z.string().trim().min(1, "Nama barang wajib diisi").max(200),
  size_label: z.string().trim().max(50).optional().transform((v) => v?.trim() || null),
  price: z.coerce.number().finite().min(0, "Harga jual tidak boleh negatif"),
  cogs: z.coerce.number().finite().min(0, "HPP tidak boleh negatif"),
}).refine((d) => d.cogs <= d.price, { message: "HPP tidak boleh lebih besar dari harga jual", path: ["cogs"] });

export async function createProduct(formData: FormData) {
  const session = await getSession();
  const parsed = ProductSchema.safeParse({
    sku: formData.get("sku"),
    name: formData.get("name"),
    size_label: formData.get("size_label") ?? "",
    price: formData.get("price"),
    cogs: formData.get("cogs"),
  });
  if (!parsed.success) fail("/products/new", parsed.error.issues[0].message);

  try {
    await sql`
      insert into products ${sql({ ...parsed.data, brand_id: session.activeBrandId! }, "brand_id", "sku", "name", "size_label", "price", "cogs")}
    `;
  } catch (err) {
    if ((err as { code?: string }).code === "23505") fail("/products/new", "SKU sudah dipakai produk lain di brand ini.");
    fail("/products/new", "Gagal menyimpan produk. Coba lagi.");
  }

  revalidatePath("/products");
  redirect("/products");
}

export async function updateProduct(id: number, formData: FormData) {
  const session = await getSession();
  const parsed = ProductSchema.safeParse({
    sku: formData.get("sku"),
    name: formData.get("name"),
    size_label: formData.get("size_label") ?? "",
    price: formData.get("price"),
    cogs: formData.get("cogs"),
  });
  if (!parsed.success) fail(`/products/${id}/edit`, parsed.error.issues[0].message);

  try {
    await sql`
      update products set ${sql(parsed.data, "sku", "name", "size_label", "price", "cogs")}
      where id = ${id} and brand_id = ${session.activeBrandId!}
    `;
  } catch (err) {
    if ((err as { code?: string }).code === "23505") fail(`/products/${id}/edit`, "SKU sudah dipakai produk lain di brand ini.");
    fail(`/products/${id}/edit`, "Gagal menyimpan perubahan. Coba lagi.");
  }

  revalidatePath("/products");
  redirect("/products");
}

export async function toggleProductActive(id: number) {
  const session = await getSession();
  await sql`
    update products set is_active = not is_active
    where id = ${id} and brand_id = ${session.activeBrandId!}
  `;
  revalidatePath("/products");
}
