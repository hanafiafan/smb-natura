"use client";
import { useSidebar } from "@/context/SidebarContext";

export function Backdrop() {
  const { isMobileOpen, toggleMobileSidebar } = useSidebar();
  if (!isMobileOpen) return null;
  return (
    <div
      className="fixed inset-0 z-40 bg-gray-900/40 lg:hidden"
      onClick={toggleMobileSidebar}
      aria-hidden="true"
    />
  );
}
