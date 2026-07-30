"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { sql } from "@/lib/db";
import { getSession, verifyPassword } from "@/lib/session";
import type { AppUser } from "@/lib/database.types";

const LoginSchema = z.object({
  email: z.email(),
  password: z.string().min(6),
});

export async function login(formData: FormData) {
  const parsed = LoginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    redirect(`/login?error=${encodeURIComponent("Email atau password tidak valid.")}`);
  }

  const [user] = await sql<AppUser[]>`select * from users where email = ${parsed.data.email}`;
  if (!user || !verifyPassword(parsed.data.password, user.password_hash)) {
    const msg = encodeURIComponent("Email atau password salah.");
    const email = encodeURIComponent(parsed.data.email);
    redirect(`/login?error=${msg}&email=${email}`);
  }

  const activeBrandId =
    user.role === "super_admin"
      ? (await sql<{ id: number }[]>`select id from brands order by id limit 1`)[0]?.id
      : (
          await sql<{ brand_id: number }[]>`
            select brand_id from user_brands where user_id = ${user.id} order by brand_id limit 1
          `
        )[0]?.brand_id;

  const session = await getSession();
  session.userId = user.id;
  session.email = user.email;
  session.role = user.role;
  session.activeBrandId = activeBrandId;
  await session.save();

  revalidatePath("/", "layout");
  redirect("/");
}

export async function logout() {
  const session = await getSession();
  session.destroy();
  revalidatePath("/", "layout");
  redirect("/login");
}
