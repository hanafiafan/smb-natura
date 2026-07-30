import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SMB Natura — Dashboard Keuangan",
  description: "Dashboard operasional & Laporan Laba/Rugi CV Loka Bumi Persada",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id" className="antialiased">
      <body>{children}</body>
    </html>
  );
}
