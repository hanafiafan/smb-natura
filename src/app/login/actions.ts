"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSession, verifyPassword } from "@/lib/session";

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

  const validEmail = parsed.data.email === process.env.ADMIN_EMAIL;
  if (!validEmail || !verifyPassword(parsed.data.password)) {
    const msg = encodeURIComponent("Email atau password salah.");
    const email = encodeURIComponent(parsed.data.email);
    redirect(`/login?error=${msg}&email=${email}`);
  }

  const session = await getSession();
  session.email = parsed.data.email;
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
