import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { SidebarProvider } from "@/context/SidebarContext";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppHeader } from "@/components/layout/app-header";
import { Backdrop } from "@/components/layout/backdrop";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session.email) redirect("/login");

  return (
    <SidebarProvider>
      <div className="min-h-screen lg:flex bg-gray-50">
        <AppSidebar />
        <Backdrop />
        <div className="flex-1 flex flex-col min-w-0">
          <AppHeader email={session.email} />
          <main className="flex-1 p-4 md:p-6 max-w-[1536px] w-full mx-auto">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
