"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { sql } from "@/lib/db";
import { getSession } from "@/lib/session";

function fail(message: string): never {
  redirect(`/cash-flow/accounts?error=${encodeURIComponent(message)}`);
}

const CashAccountSchema = z.object({ name: z.string().trim().min(2, "Nama rekening minimal 2 karakter") });

export async function createCashAccount(formData: FormData) {
  const session = await getSession();
  const parsed = CashAccountSchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) fail(parsed.error.issues[0].message);

  await sql`insert into cash_accounts (brand_id, name) values (${session.activeBrandId!}, ${parsed.data.name})`;

  revalidatePath("/cash-flow/accounts");
  redirect("/cash-flow/accounts");
}

export async function toggleCashAccountActive(id: number) {
  const session = await getSession();
  await sql`
    update cash_accounts set is_active = not is_active
    where id = ${id} and brand_id = ${session.activeBrandId!}
  `;
  revalidatePath("/cash-flow/accounts");
}
