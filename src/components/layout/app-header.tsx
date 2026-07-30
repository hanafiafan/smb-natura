"use client";
import { Menu, X, LogOut } from "lucide-react";
import { useSidebar } from "@/context/SidebarContext";
import { logout } from "@/app/login/actions";

export function AppHeader({ email }: { email: string | null }) {
  const { isMobileOpen, toggleSidebar, toggleMobileSidebar } = useSidebar();

  const handleToggle = () => {
    if (typeof window !== "undefined" && window.innerWidth >= 1024) toggleSidebar();
    else toggleMobileSidebar();
  };

  const initial = (email ?? "?")[0]?.toUpperCase();

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between gap-4 px-4 lg:px-6 h-16 no-print"
      style={{ background: "rgba(255, 255, 255, 0.85)", backdropFilter: "blur(12px)", borderBottom: "1px solid var(--color-gray-100)" }}>
      <div className="flex items-center gap-3">
        <button
          onClick={handleToggle}
          aria-label="Toggle Sidebar"
          className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-brand-25 hover:text-brand-700 hover:border-brand-200 transition-colors"
        >
          {isMobileOpen ? <X size={20} /> : <Menu size={18} />}
        </button>
        <div className="hidden sm:block">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-brand-600">Selamat datang</div>
          <div className="text-sm font-semibold text-gray-800 leading-tight">{email ?? "Owner"}</div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden md:block text-right">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Hari ini</div>
          <div className="text-sm font-semibold text-gray-800">
            {new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </div>
        </div>
        <div className="w-9 h-9 rounded-full grid place-items-center text-white font-bold text-sm shrink-0 shadow-brand-sm"
          style={{ background: "linear-gradient(135deg, var(--color-brand-500), var(--color-brand-700))" }}>
          {initial}
        </div>
        <form action={logout}>
          <button type="submit" className="btn-outline text-xs h-10 px-3.5" title="Keluar">
            <LogOut size={14} />
            <span className="hidden sm:inline">Keluar</span>
          </button>
        </form>
      </div>
    </header>
  );
}
