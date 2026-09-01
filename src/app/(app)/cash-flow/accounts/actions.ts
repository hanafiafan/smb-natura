"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { sql } from "@/lib/db";
import { assertCanWrite, getSession } from "@/lib/session";

function fail(message: string): never {
  redirect(`/cash-flow/accounts?error=${encodeURIComponent(message)}`);
}

const CashAccountSchema = z.object({ name: z.string().trim().min(2, "Nama rekening minimal 2 karakter") });

async function nameTaken(brandId: number, name: string, excludeId?: number): Promise<boolean> {
  const [row] = await sql<{ id: number }[]>`
    select id from cash_accounts
    where brand_id = ${brandId} and lower(name) = lower(${name}) ${excludeId ? sql`and id != ${excludeId}` : sql``}
  `;
  return !!row;
}

export async function createCashAccount(formData: FormData) {
  const session = await getSession();
  assertCanWrite(session);
  const brandId = session.activeBrandId!;
  const parsed = CashAccountSchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) fail(parsed.error.issues[0].message);

  if (await nameTaken(brandId, parsed.data.name)) fail(`Rekening "${parsed.data.name}" sudah ada.`);

  await sql`insert into cash_accounts (brand_id, name) values (${brandId}, ${parsed.data.name})`;

  revalidatePath("/cash-flow/accounts");
  redirect("/cash-flow/accounts");
}

export async function updateCashAccount(id: number, formData: FormData) {
  const session = await getSession();
  assertCanWrite(session);
  const brandId = session.activeBrandId!;
  const parsed = CashAccountSchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) redirect(`/cash-flow/accounts/${id}/edit?error=${encodeURIComponent(parsed.error.issues[0].message)}`);

  if (await nameTaken(brandId, parsed.data.name, id)) {
    redirect(`/cash-flow/accounts/${id}/edit?error=${encodeURIComponent(`Rekening "${parsed.data.name}" sudah ada.`)}`);
  }

  await sql`update cash_accounts set name = ${parsed.data.name} where id = ${id} and brand_id = ${brandId}`;

  revalidatePath("/cash-flow/accounts");
  redirect("/cash-flow/accounts");
}

export async function toggleCashAccountActive(id: number) {
  const session = await getSession();
  assertCanWrite(session);
  await sql`
    update cash_accounts set is_active = not is_active
    where id = ${id} and brand_id = ${session.activeBrandId!}
  `;
  revalidatePath("/cash-flow/accounts");
}
