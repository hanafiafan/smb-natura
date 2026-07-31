"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ReceiptText, FileBarChart, Sparkles, MoreHorizontal, Leaf, Building2, Wallet, BookOpen, Package, Target } from "lucide-react";
import { useSidebar } from "@/context/SidebarContext";
import { cn } from "@/lib/utils";

type NavItem = { name: string; path: string; icon: React.ReactNode };

const NAV_MAIN: NavItem[] = [
  { name: "Dashboard", path: "/", icon: <LayoutDashboard size={20} /> },
  { name: "Transaksi", path: "/transactions", icon: <ReceiptText size={20} /> },
  { name: "Arus Kas", path: "/cash-flow", icon: <Wallet size={20} /> },
  { name: "Produk", path: "/products", icon: <Package size={20} /> },
  { name: "Anggaran", path: "/anggaran", icon: <Target size={20} /> },
  { name: "Laporan L/R", path: "/report", icon: <FileBarChart size={20} /> },
];

const NAV_QUICK: NavItem[] = [
  { name: "Catat Baru", path: "/transactions/new", icon: <Sparkles size={20} /> },
];

const NAV_ADMIN: NavItem[] = [
  { name: "Master Data", path: "/master-data", icon: <Building2 size={20} /> },
];

const NAV_HELP: NavItem[] = [
  { name: "Panduan", path: "/panduan", icon: <BookOpen size={20} /> },
];

export function AppSidebar({
  companyName,
  brandName,
  isSuperAdmin,
}: {
  companyName?: string;
  brandName?: string;
  isSuperAdmin?: boolean;
}) {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const pathname = usePathname();

  const expanded = isExpanded || isHovered || isMobileOpen;

  const isActive = (path: string) =>
    path === "/" ? pathname === "/" : pathname === path || pathname.startsWith(`${path}/`);

  const renderGroup = (title: string, items: NavItem[]) => (
    <div>
      <h2 className={cn(
        "mb-3 text-[10px] uppercase flex leading-5 text-gray-400 tracking-[0.14em] font-bold",
        expanded ? "justify-start px-2" : "lg:justify-center",
      )}>
        {expanded ? title : <MoreHorizontal size={16} />}
      </h2>
      <ul className="flex flex-col gap-1">
        {items.map((item) => {
          const active = isActive(item.path);
          return (
            <li key={item.path}>
              <Link
                href={item.path}
                className={cn(
                  "menu-item group",
                  active ? "menu-item-active" : "menu-item-inactive",
                  !expanded && "lg:justify-center",
                )}
                title={item.name}
              >
                <span className={active ? "menu-item-icon-active" : "menu-item-icon-inactive"}>
                  {item.icon}
                </span>
                {expanded && <span>{item.name}</span>}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );

  return (
    <aside
      className={cn(
        "fixed lg:sticky top-0 left-0 flex flex-col h-screen px-4 py-6 bg-white border-r border-gray-100 z-50 transition-all duration-300 ease-in-out shadow-theme-xs",
        expanded ? "w-[264px]" : "w-[88px]",
        isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
      )}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link href="/" className={cn("flex items-center gap-3 mb-8 shrink-0 px-1", !expanded && "lg:justify-center lg:px-0")}>
        <div className="w-10 h-10 rounded-xl grid place-items-center shrink-0 shadow-brand-sm text-white"
          style={{ background: "linear-gradient(135deg, var(--color-brand-500), var(--color-brand-700))" }}>
          <Leaf size={20} strokeWidth={2.5} />
        </div>
        {expanded && (
          <div className="min-w-0">
            <div className="font-bold text-[15px] leading-tight text-gray-900">{brandName ?? "SMB Natura"}</div>
            <div className="text-[11px] text-gray-500 truncate">{companyName ?? "CV Loka Bumi Persada"}</div>
          </div>
        )}
      </Link>

      <nav className="flex flex-col gap-6 overflow-y-auto no-scrollbar flex-1">
        {renderGroup("Menu", NAV_MAIN)}
        {renderGroup("Cepat", NAV_QUICK)}
        {isSuperAdmin && renderGroup("Admin", NAV_ADMIN)}
        {renderGroup("Bantuan", NAV_HELP)}
      </nav>

      {expanded && (
        <div className="mt-auto pt-4">
          <div className="rounded-xl p-3.5 text-xs relative overflow-hidden"
            style={{ background: "linear-gradient(135deg, var(--color-brand-600), var(--color-brand-800))" }}>
            <div className="absolute -right-3 -bottom-3 opacity-15">
              <Leaf size={60} className="text-white" />
            </div>
            <div className="relative">
              <div className="text-white/70 text-[10px] font-semibold uppercase tracking-wider mb-1">Tips</div>
              <div className="text-white text-[12px] leading-snug">
                Catat transaksi harian untuk laporan yang akurat.
              </div>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
