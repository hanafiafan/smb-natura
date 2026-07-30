import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SidebarProvider } from "@/context/SidebarContext";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppHeader } from "@/components/layout/app-header";
import { Backdrop } from "@/components/layout/backdrop";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <SidebarProvider>
      <div className="min-h-screen lg:flex bg-gray-50">
        <AppSidebar />
        <Backdrop />
        <div className="flex-1 flex flex-col min-w-0">
          <AppHeader email={user.email ?? null} />
          <main className="flex-1 p-4 md:p-6 max-w-[1536px] w-full mx-auto">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
