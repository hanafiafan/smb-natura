"use client";
import Link from "next/link";
import { Menu, X, LogOut } from "lucide-react";
import { useSidebar } from "@/context/SidebarContext";
import { logout } from "@/app/login/actions";
import { switchBrand } from "@/app/(app)/brand-actions";
import type { AccessibleBrand } from "@/lib/brands";

export function AppHeader({
  email,
  brands,
  activeBrandId,
}: {
  email: string | null;
  brands: AccessibleBrand[];
  activeBrandId?: number;
}) {
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
        {brands.length > 1 ? (
          <form action={switchBrand}>
            <select
              name="brand_id"
              defaultValue={activeBrandId}
              onChange={(e) => e.currentTarget.form?.requestSubmit()}
              className="select h-10 text-xs font-semibold"
              aria-label="Pilih brand aktif"
            >
              {brands.map((b) => (
                <option key={b.id} value={b.id}>{b.company_name} — {b.name}</option>
              ))}
            </select>
          </form>
        ) : brands.length === 1 ? (
          <div className="hidden md:block text-right">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Brand</div>
            <div className="text-sm font-semibold text-gray-800">{brands[0].company_name} — {brands[0].name}</div>
          </div>
        ) : null}
        <Link
          href="/account"
          title="Akun Saya / Ganti Password"
          className="w-9 h-9 rounded-full grid place-items-center text-white font-bold text-sm shrink-0 shadow-brand-sm"
          style={{ background: "linear-gradient(135deg, var(--color-brand-500), var(--color-brand-700))" }}
        >
          {initial}
        </Link>
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
