"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { sql } from "@/lib/db";
import { getSession, hashPassword, verifyPassword } from "@/lib/session";
import type { AppUser } from "@/lib/database.types";

function fail(message: string): never {
  redirect(`/account?error=${encodeURIComponent(message)}`);
}

const ChangePasswordSchema = z.object({
  current_password: z.string().min(1, "Password saat ini wajib diisi"),
  new_password: z.string().min(6, "Password baru minimal 6 karakter"),
  confirm_password: z.string(),
});

export async function changeOwnPassword(formData: FormData) {
  const session = await getSession();
  if (!session.userId) redirect("/login");

  const parsed = ChangePasswordSchema.safeParse({
    current_password: formData.get("current_password"),
    new_password: formData.get("new_password"),
    confirm_password: formData.get("confirm_password"),
  });
  if (!parsed.success) fail(parsed.error.issues[0].message);
  if (parsed.data.new_password !== parsed.data.confirm_password) fail("Konfirmasi password baru tidak cocok.");

  const [user] = await sql<AppUser[]>`select * from users where id = ${session.userId}`;
  if (!user || !verifyPassword(parsed.data.current_password, user.password_hash)) {
    fail("Password saat ini salah.");
  }

  const passwordHash = hashPassword(parsed.data.new_password);
  await sql`update users set password_hash = ${passwordHash} where id = ${session.userId}`;

  redirect("/account?ok=1");
}
