import { cache } from "react";
import { getIronSession, type IronSession, type SessionOptions } from "iron-session";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { sql } from "@/lib/db";
import type { UserRole } from "@/lib/database.types";

export type SessionData = {
  userId?: string;
  email?: string;
  role?: UserRole;
  activeBrandId?: number;
};

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET!,
  cookieName: "smb_natura_session",
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  },
};

export async function getSession(): Promise<IronSession<SessionData>> {
  return getIronSession<SessionData>(await cookies(), sessionOptions);
}

/** Looks up the caller's role straight from the DB — a session cookie can only be
 * rewritten from a Server Action/Route Handler, not from the page render that reads
 * it, so the cookie's cached role can go stale the moment an admin is demoted. Every
 * write-gating check re-reads the DB instead of trusting session.role.
 * cache()'d so a page that gates several controls on the role only hits the DB once. */
const currentRole = cache(async (userId: string | undefined): Promise<UserRole | null> => {
  if (!userId) return null;
  const [row] = await sql<{ role: UserRole }[]>`select role from users where id = ${userId}`;
  return row?.role ?? null;
});

/** The caller's live role, for UI that needs to hide controls it isn't allowed to use. */
export async function getCurrentRole(): Promise<UserRole | null> {
  return currentRole((await getSession()).userId);
}

/** session.activeBrandId is only validated when it's set (login / switchBrand), so a
 * brand whose access got revoked mid-session — user_brands row deleted, brand
 * deactivated, super_admin demoted — stays in the cookie for up to 30 days. The app
 * layout filters it out for page renders, but Server Actions run *before* that layout
 * renders and Route Handlers skip it entirely, so both re-check here. */
async function accessibleBrandId(session: SessionData, role: UserRole): Promise<number | null> {
  const brandId = session.activeBrandId;
  if (!brandId) return null;
  const [ok] = role === "super_admin"
    ? await sql`select 1 from brands where id = ${brandId} and is_active`
    : await sql`
        select 1 from brands b
        join user_brands ub on ub.brand_id = b.id
        where b.id = ${brandId} and ub.user_id = ${session.userId!} and b.is_active
      `;
  return ok ? brandId : null;
}

/** Read-only brand guard for Route Handlers (the CSV exports). */
export async function getAccessibleBrandId(session: SessionData): Promise<number | null> {
  const role = await currentRole(session.userId);
  return role ? accessibleBrandId(session, role) : null;
}

/** Redirects to /login if not authenticated, or to /master-data-only notice if not super admin. */
export async function requireSuperAdmin(): Promise<IronSession<SessionData>> {
  const session = await getSession();
  if (!session.email) redirect("/login");
  if ((await currentRole(session.userId)) !== "super_admin") redirect("/");
  return session;
}

/** Page-level twin of requireWriteAccess: bounces viewers off create/edit form pages
 * instead of rendering a form whose submit can only ever throw. */
export async function requireWritePage(): Promise<void> {
  if ((await getCurrentRole()) === "viewer") redirect("/");
}

/** Role + brand guard for every create/update/delete server action: blocks viewers and
 * re-checks that the active brand is still reachable. Returns the verified brand id so
 * callers stop reading session.activeBrandId directly. Call right after getSession(). */
export async function requireWriteAccess(session: SessionData): Promise<number> {
  const role = await currentRole(session.userId);
  if (!role) throw new Error("Sesi tidak valid. Silakan login ulang.");
  if (role === "viewer") throw new Error("Akun view-only tidak bisa mengubah data.");

  const brandId = await accessibleBrandId(session, role);
  if (!brandId) throw new Error("Brand ini sudah tidak bisa kamu akses.");
  return brandId;
}

/** password_hash format: "<saltHex>:<hashHex>", generated via scryptSync. */
export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, 64);
  return `${salt.toString("hex")}:${hash.toString("hex")}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const [saltHex, hashHex] = storedHash.split(":");
  if (!saltHex || !hashHex) return false;

  const expected = Buffer.from(hashHex, "hex");
  const actual = scryptSync(password, Buffer.from(saltHex, "hex"), expected.length);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
