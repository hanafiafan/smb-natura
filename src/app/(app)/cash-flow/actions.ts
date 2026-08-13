"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { sql } from "@/lib/db";
import { getSession } from "@/lib/session";

const CashFlowSchema = z.object({
  entry_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Tanggal tidak valid"),
  description: z.string().trim().min(1, "Keterangan wajib diisi").max(500),
  channel: z.string().max(200).optional().transform((v) => v?.trim() || null),
  account_id: z.string().optional().transform((v) => (v && v.trim() ? Number(v) : null)),
  type: z.enum(["in", "out"]),
  amount: z.coerce.number().finite().positive("Jumlah harus lebih dari 0"),
});

export type ActionState = { error?: string; fieldErrors?: Record<string, string[]> } | null;

async function parseAndPack(formData: FormData) {
  // Strip Indonesian thousand separators (dot) + all non-digits — form input allows "Rp 1.500.000"
  const rawAmount = String(formData.get("amount") ?? "").replace(/[^\d]/g, "");
  const parsed = CashFlowSchema.safeParse({
    entry_date: formData.get("entry_date"),
    description: formData.get("description"),
    channel: formData.get("channel") ?? "",
    account_id: formData.get("account_id") ?? "",
    type: formData.get("type"),
    amount: rawAmount,
  });
  if (!parsed.success) {
    return { error: null as string | null, fieldErrors: parsed.error.flatten().fieldErrors, data: null };
  }
  return { error: null, fieldErrors: null, data: parsed.data };
}

/** requireActive=false lets an update keep an entry's existing (now-deactivated)
 * account — only a genuinely new account choice must still be active. */
async function cashAccountBelongsToBrand(accountId: number, brandId: number, requireActive: boolean): Promise<boolean> {
  const [account] = await sql<{ id: number }[]>`
    select id from cash_accounts where id = ${accountId} and brand_id = ${brandId} ${requireActive ? sql`and is_active` : sql``}
  `;
  return !!account;
}

export async function createCashFlowEntry(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { fieldErrors, data } = await parseAndPack(formData);
  if (!data) return { fieldErrors: fieldErrors ?? undefined, error: "Cek isian form." };

  const session = await getSession();
  const brandId = session.activeBrandId!;
  if (data.account_id && !(await cashAccountBelongsToBrand(data.account_id, brandId, true))) {
    return { error: "Rekening tidak ditemukan atau sudah nonaktif di brand ini." };
  }

  try {
    await sql`
      insert into cash_flow_entries ${sql(
        { ...data, brand_id: brandId },
        "brand_id", "entry_date", "description", "channel", "account_id", "type", "amount",
      )}
    `;
  } catch {
    return { error: "Gagal menyimpan catatan. Coba lagi." };
  }

  revalidatePath("/cash-flow");
  redirect("/cash-flow?ok=created");
}

export async function updateCashFlowEntry(id: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  const { fieldErrors, data } = await parseAndPack(formData);
  if (!data) return { fieldErrors: fieldErrors ?? undefined, error: "Cek isian form." };

  const session = await getSession();
  const brandId = session.activeBrandId!;

  const [existing] = await sql<{ account_id: number | null }[]>`
    select account_id from cash_flow_entries where id = ${id} and brand_id = ${brandId}
  `;
  if (!existing) return { error: "Catatan tidak ditemukan." };

  const requireActive = !!data.account_id && data.account_id !== existing.account_id;
  if (data.account_id && !(await cashAccountBelongsToBrand(data.account_id, brandId, requireActive))) {
    return { error: "Rekening tidak ditemukan atau sudah nonaktif di brand ini." };
  }

  try {
    await sql`
      update cash_flow_entries set ${sql(data, "entry_date", "description", "channel", "account_id", "type", "amount")}
      where id = ${id} and brand_id = ${brandId}
    `;
  } catch {
    return { error: "Gagal menyimpan perubahan. Coba lagi." };
  }

  revalidatePath("/cash-flow");
  redirect("/cash-flow?ok=updated");
}

export async function deleteCashFlowEntry(id: string) {
  const session = await getSession();
  await sql`delete from cash_flow_entries where id = ${id} and brand_id = ${session.activeBrandId!}`;

  revalidatePath("/cash-flow");
}
