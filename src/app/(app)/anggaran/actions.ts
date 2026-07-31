"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { sql } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function saveBudgetTargets(formData: FormData) {
  const session = await getSession();
  const brandId = session.activeBrandId!;
  const periodStart = String(formData.get("period_start"));
  const periodEnd = String(formData.get("period_end"));

  const submittedIds = formData.getAll("account_id").map((v) => Number(v));
  // Only accept accounts that actually belong to this brand — a submitted account_id
  // for another brand is silently dropped instead of writing a cross-tenant row.
  const validAccounts = submittedIds.length
    ? await sql<{ id: number }[]>`select id from accounts where brand_id = ${brandId} and id in ${sql(submittedIds)}`
    : [];
  const accountIds = validAccounts.map((a) => a.id);

  for (const accountId of accountIds) {
    // target_amount has a DB check (>= 0); clamp here so a tampered negative value
    // doesn't crash the action with an unhandled constraint violation.
    const amount = Math.max(0, Number(formData.get(`target_${accountId}`)) || 0);
    await sql`
      insert into budget_targets (brand_id, account_id, period_start, period_end, target_amount)
      values (${brandId}, ${accountId}, ${periodStart}, ${periodEnd}, ${amount})
      on conflict (brand_id, account_id, period_start, period_end)
      do update set target_amount = excluded.target_amount
    `;
  }

  revalidatePath("/anggaran");
  redirect(`/anggaran?start=${periodStart}&end=${periodEnd}&ok=1`);
}
