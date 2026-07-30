import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getAccessibleBrands } from "@/lib/brands";
import { SidebarProvider } from "@/context/SidebarContext";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppHeader } from "@/components/layout/app-header";
import { Backdrop } from "@/components/layout/backdrop";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  // userId/role didn't exist on sessions created before multi-user login shipped —
  // treat those as logged out so they re-authenticate under the new session shape.
  if (!session.email || !session.userId || !session.role) redirect("/login");

  const brands = await getAccessibleBrands(session.userId, session.role);
  const activeBrand = brands.find((b) => b.id === session.activeBrandId);

  return (
    <SidebarProvider>
      <div className="min-h-screen lg:flex bg-gray-50">
        <AppSidebar
          companyName={activeBrand?.company_name}
          brandName={activeBrand?.name}
          isSuperAdmin={session.role === "super_admin"}
        />
        <Backdrop />
        <div className="flex-1 flex flex-col min-w-0">
          <AppHeader email={session.email} brands={brands} activeBrandId={session.activeBrandId} />
          <main className="flex-1 p-4 md:p-6 max-w-[1536px] w-full mx-auto">
            {activeBrand ? children : (
              <div className="card p-12 text-center max-w-lg mx-auto mt-10">
                <p className="mb-2 text-lg font-semibold">Belum ada brand yang bisa diakses</p>
                <p className="text-sm" style={{ color: "var(--muted)" }}>
                  {session.role === "super_admin"
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
