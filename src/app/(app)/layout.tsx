import { redirect } from "next/navigation";
import { sql } from "@/lib/db";
import { getSession } from "@/lib/session";
import { getAccessibleBrands } from "@/lib/brands";
import type { UserRole } from "@/lib/database.types";
import { SidebarProvider } from "@/context/SidebarContext";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppHeader } from "@/components/layout/app-header";
import { Backdrop } from "@/components/layout/backdrop";
import { switchBrand } from "./brand-actions";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  // userId/role didn't exist on sessions created before multi-user login shipped —
  // treat those as logged out so they re-authenticate under the new session shape.
  if (!session.email || !session.userId || !session.role) redirect("/login");

  // Re-check against the DB on every request — a session cookie lasts 30 days, so
  // without this a deleted account would keep rendering as logged-in until the
  // cookie naturally expires. Can't rewrite the cookie here to also fix a *demoted*
  // account's stale role — Next only allows setting cookies from a Server Action or
  // Route Handler, not a layout render — so every write-gating check re-reads the
  // DB directly instead of trusting session.role (see requireSuperAdmin/assertCanWrite
  // in src/lib/session.ts).
  const [dbUser] = await sql<{ role: UserRole }[]>`select role from users where id = ${session.userId}`;
  if (!dbUser) redirect("/login");
  const role = dbUser.role;

  const brands = await getAccessibleBrands(session.userId, role);
  const activeBrand = brands.find((b) => b.id === session.activeBrandId);

  return (
    <SidebarProvider>
      <div className="min-h-screen lg:flex bg-gray-50">
        <AppSidebar
          companyName={activeBrand?.company_name}
          brandName={activeBrand?.name}
          isSuperAdmin={role === "super_admin"}
        />
        <Backdrop />
        <div className="flex-1 flex flex-col min-w-0">
          <AppHeader email={session.email} brands={brands} activeBrandId={session.activeBrandId} />
          <main className="flex-1 p-4 md:p-6 max-w-[1536px] w-full mx-auto">
            {activeBrand ? children : brands.length > 0 ? (
              // Session's activeBrandId points at a brand that's gone/inactive/unassigned —
              // this can't rely on the header switcher, which hides itself when there's only
              // one brand to pick (it assumes that one is already active).
              <div className="card p-12 text-center max-w-lg mx-auto mt-10">
                <p className="mb-2 text-lg font-semibold">Pilih brand yang ingin dilihat</p>
                <p className="text-sm mb-6" style={{ color: "var(--muted)" }}>
                  Brand yang tadinya aktif sudah tidak tersedia lagi.
                </p>
                <div className="flex flex-col gap-2 max-w-xs mx-auto">
                  {brands.map((b) => (
                    <form key={b.id} action={switchBrand}>
                      <input type="hidden" name="brand_id" value={b.id} />
                      <button type="submit" className="btn-outline w-full">{b.company_name} — {b.name}</button>
                    </form>
                  ))}
                </div>
              </div>
            ) : (
              <div className="card p-12 text-center max-w-lg mx-auto mt-10">
                <p className="mb-2 text-lg font-semibold">Belum ada brand yang bisa diakses</p>
                <p className="text-sm" style={{ color: "var(--muted)" }}>
                  {role === "super_admin"
                    ? "Buat perusahaan & brand dulu lewat Master Data."
                    : "Hubungi Super Admin untuk ditautkan ke sebuah brand."}
                </p>
              </div>
            )}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
