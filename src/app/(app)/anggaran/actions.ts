"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { sql } from "@/lib/db";
import { getSession } from "@/lib/session";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const PeriodSchema = z.object({
  period_start: z.string().regex(DATE_RE, "Tanggal mulai tidak valid"),
  period_end: z.string().regex(DATE_RE, "Tanggal akhir tidak valid"),
});
const AmountSchema = z.coerce.number().finite().min(0, "Target tidak boleh negatif");

function fail(periodStart: string | null, periodEnd: string | null, message: string): never {
  const period = periodStart && periodEnd ? `start=${periodStart}&end=${periodEnd}&` : "";
  redirect(`/anggaran?${period}error=${encodeURIComponent(message)}`);
}

export async function saveBudgetTargets(formData: FormData) {
  const session = await getSession();
  const brandId = session.activeBrandId!;

  const periodParsed = PeriodSchema.safeParse({
    period_start: formData.get("period_start"),
    period_end: formData.get("period_end"),
  });
  if (!periodParsed.success) fail(null, null, periodParsed.error.issues[0].message);
  const { period_start: periodStart, period_end: periodEnd } = periodParsed.data;

  const submittedIds = formData.getAll("account_id").map((v) => Number(v)).filter(Number.isFinite);
  // Only accept accounts that actually belong to this brand and are still active — a
  // submitted account_id for another brand (or a deactivated one) is silently dropped
  // instead of writing a cross-tenant or stale row.
  const validAccounts = submittedIds.length
    ? await sql<{ id: number }[]>`select id from accounts where brand_id = ${brandId} and is_active = true and id in ${sql(submittedIds)}`
    : [];

  const rows: { accountId: number; amount: number }[] = [];
  for (const { id: accountId } of validAccounts) {
    const parsedAmount = AmountSchema.safeParse(formData.get(`target_${accountId}`) ?? 0);
    if (!parsedAmount.success) fail(periodStart, periodEnd, parsedAmount.error.issues[0].message);
    rows.push({ accountId, amount: parsedAmount.data });
  }

  try {
    for (const { accountId, amount } of rows) {
      await sql`
        insert into budget_targets (brand_id, account_id, period_start, period_end, target_amount)
        values (${brandId}, ${accountId}, ${periodStart}, ${periodEnd}, ${amount})
        on conflict (brand_id, account_id, period_start, period_end)
        do update set target_amount = excluded.target_amount
      `;
    }
  } catch {
    fail(periodStart, periodEnd, "Gagal menyimpan target. Coba lagi.");
  }

  revalidatePath("/anggaran");
  redirect(`/anggaran?start=${periodStart}&end=${periodEnd}&ok=1`);
}
