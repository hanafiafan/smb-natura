"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { sql } from "@/lib/db";

const TxnSchema = z.object({
  txn_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Tanggal tidak valid"),
  account_id: z.coerce.number().int().positive("Pilih akun"),
  branch_id: z.coerce.number().int().positive("Pilih cabang"),
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
    branch_id: formData.get("branch_id"),
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

  await sql`
    insert into transactions ${sql(data, "txn_date", "account_id", "branch_id", "amount", "description", "reference")}
  `;

  revalidatePath("/transactions");
  revalidatePath("/", "layout");
  redirect("/transactions?ok=created");
}

export async function updateTransaction(id: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  const { fieldErrors, data } = await parseAndPack(formData);
  if (!data) return { fieldErrors: fieldErrors ?? undefined, error: "Cek isian form." };

  await sql`
    update transactions set ${sql(data, "txn_date", "account_id", "branch_id", "amount", "description", "reference")}
    where id = ${id}
  `;

  revalidatePath("/transactions");
  revalidatePath("/", "layout");
  redirect("/transactions?ok=updated");
}

export async function deleteTransaction(id: string) {
  await sql`delete from transactions where id = ${id}`;

  revalidatePath("/transactions");
  revalidatePath("/", "layout");
}
