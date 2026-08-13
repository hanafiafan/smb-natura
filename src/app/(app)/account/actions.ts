"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { sql } from "@/lib/db";
import { getSession, hashPassword, verifyPassword } from "@/lib/session";
import { isLocked, minutesRemaining, afterFailedAttempt, RESET_STATE } from "@/lib/login-lockout";
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
  if (!user) redirect("/login");

  // Same lockout counters as login — this endpoint is otherwise an unthrottled password
  // oracle for anyone holding a valid session cookie.
  if (isLocked(user)) {
    fail(`Terlalu banyak percobaan salah. Coba lagi dalam ${minutesRemaining(user)} menit.`);
  }
  if (!verifyPassword(parsed.data.current_password, user.password_hash)) {
    const next = afterFailedAttempt(user);
    await sql`update users set failed_attempts = ${next.failed_attempts}, locked_until = ${next.locked_until} where id = ${user.id}`;
    fail(next.locked_until ? `Terlalu banyak percobaan salah. Coba lagi dalam ${minutesRemaining(next)} menit.` : "Password saat ini salah.");
  }
  if (user.failed_attempts > 0 || user.locked_until) {
    await sql`update users set failed_attempts = ${RESET_STATE.failed_attempts}, locked_until = ${RESET_STATE.locked_until} where id = ${user.id}`;
  }

  const passwordHash = hashPassword(parsed.data.new_password);
  await sql`update users set password_hash = ${passwordHash} where id = ${session.userId}`;

  redirect("/account?ok=1");
}
