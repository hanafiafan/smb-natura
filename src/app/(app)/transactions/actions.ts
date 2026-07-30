"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { sql } from "@/lib/db";
import { getSession } from "@/lib/session";

const TxnSchema = z.object({
  txn_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Tanggal tidak valid"),
  account_id: z.coerce.number().int().positive("Pilih akun"),
  amount: z.coerce.number().finite().nonnegative("Jumlah harus >= 0"),
  description: z.string().max(500).optional().transform((v) => v?.trim() || null),
  reference: z.string().max(100).optional().transform((v) => v?.trim() || null),
});

export type ActionState = { error?: string; fieldErrors?: Record<string, string[]> } | null;

async function parseAndPack(formData: FormData) {
  // Strip Indonesian thousand separators (dot) + all non-digits — form input allows "Rp 1.500.000"
  const rawAmount = String(formData.get("amount") ?? "").replace(/[^\d]/g, "");
  const parsed = TxnSchema.safeParse({
    txn_date: formData.get("txn_date"),
    account_id: formData.get("account_id"),
    amount: rawAmount,
    description: formData.get("description") ?? "",
    reference: formData.get("reference") ?? "",
  });
  if (!parsed.success) {
    return { error: null as string | null, fieldErrors: parsed.error.flatten().fieldErrors, data: null };
  }
  return { error: null, fieldErrors: null, data: parsed.data };
}

export async function createTransaction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { fieldErrors, data } = await parseAndPack(formData);
  if (!data) return { fieldErrors: fieldErrors ?? undefined, error: "Cek isian form." };

  const session = await getSession();
  await sql`
    insert into transactions ${sql({ ...data, brand_id: session.activeBrandId! }, "brand_id", "txn_date", "account_id", "amount", "description", "reference")}
  `;

  revalidatePath("/transactions");
  revalidatePath("/", "layout");
  redirect("/transactions?ok=created");
}

export async function updateTransaction(id: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  const { fieldErrors, data } = await parseAndPack(formData);
  if (!data) return { fieldErrors: fieldErrors ?? undefined, error: "Cek isian form." };

  const session = await getSession();
  await sql`
    update transactions set ${sql(data, "txn_date", "account_id", "amount", "description", "reference")}
    where id = ${id} and brand_id = ${session.activeBrandId!}
  `;

  revalidatePath("/transactions");
  revalidatePath("/", "layout");
  redirect("/transactions?ok=updated");
}

export async function deleteTransaction(id: string) {
  const session = await getSession();
  await sql`delete from transactions where id = ${id} and brand_id = ${session.activeBrandId!}`;

  revalidatePath("/transactions");
  revalidatePath("/", "layout");
}
