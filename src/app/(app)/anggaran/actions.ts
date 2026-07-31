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

  const accountIds = formData.getAll("account_id").map((v) => Number(v));
  for (const accountId of accountIds) {
    const amount = Number(formData.get(`target_${accountId}`)) || 0;
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
