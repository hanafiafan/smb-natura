"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { sql } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function switchBrand(formData: FormData) {
  const session = await getSession();
  if (!session.email || !session.userId || !session.role) redirect("/login");

  const brandId = Number(formData.get("brand_id"));
  if (session.role !== "super_admin") {
    const [allowed] = await sql`
      select 1 from user_brands where user_id = ${session.userId} and brand_id = ${brandId}
    `;
    if (!allowed) return;
  } else {
    const [exists] = await sql`select 1 from brands where id = ${brandId} and is_active`;
    if (!exists) return;
  }

  session.activeBrandId = brandId;
  await session.save();
  revalidatePath("/", "layout");

  const redirectTo = String(formData.get("redirect_to") ?? "/");
  // Only allow same-origin relative paths — never let this become an open redirect.
  // Backslashes are rejected too: browsers treat "/\evil.com" as scheme-relative,
  // the same bypass "//evil.com" already guards against.
  const isSafeRedirect = redirectTo.startsWith("/") && !redirectTo.startsWith("//") && !redirectTo.includes("\\");
  redirect(isSafeRedirect ? redirectTo : "/");
}
