import { getSession } from "@/lib/session";
import {
  BookOpen, LayoutDashboard, ReceiptText, Wallet, FileBarChart, Building2,
  ArrowLeftRight, FileSpreadsheet,
} from "lucide-react";

export const metadata = { title: "Panduan Penggunaan — SMB Natura" };

type Section = { id: string; icon: React.ReactNode; title: string; body: React.ReactNode; superAdminOnly?: boolean };

const SECTIONS: Section[] = [
  {
    id: "konsep",
    icon: <Building2 size={16} />,
    title: "Konsep Perusahaan & Brand",
    body: (
      <>
        <p>
          Sistem ini menampung banyak perusahaan (CV/PT), dan tiap perusahaan bisa punya beberapa brand.
          Setiap brand punya Chart of Accounts, Transaksi, Arus Kas, dan Laporan L/R sendiri —
          <strong> data antar brand terpisah total</strong>, tidak tercampur.
        </p>
        <p>
          Ganti brand yang sedang aktif lewat dropdown <strong>Perusahaan — Brand</strong> di bagian atas halaman.
          Semua menu (Dashboard, Transaksi, Arus Kas, Laporan) otomatis mengikuti brand yang sedang dipilih.
        </p>
      </>
    ),
  },
  {
    id: "dashboard",
    icon: <LayoutDashboard size={16} />,
    title: "Dashboard",
    body: (
      <>
        <p>Ringkasan kinerja brand aktif untuk periode yang dipilih: Omset, Laba Kotor, Laba Operasional, dan Laba Bersih.</p>
        <p>Ada juga komposisi beban (donut chart), 10 kategori beban terbesar, dan perbandingan bulan-ke-bulan (MoM) per kategori. Gunakan pemilih periode di atas untuk membandingkan dua rentang tanggal.</p>
      </>
    ),
  },
  {
    id: "transaksi",
    icon: <ReceiptText size={16} />,
    title: "Transaksi",
    body: (
      <>
        <p>Catat transaksi Pendapatan/HPP/Beban harian di menu <strong>Transaksi</strong>. Tiap transaksi ditautkan ke satu akun dari Chart of Accounts brand aktif.</p>
        <p>Gunakan filter tanggal, akun, kategori, atau kata kunci untuk mencari transaksi. Klik <strong>Edit</strong>/<strong>Hapus</strong> pada baris untuk mengubah/menghapus, atau <strong>+ Catat Transaksi</strong> untuk menambah baru.</p>
      </>
    ),
  },
  {
    id: "arus-kas",
    icon: <Wallet size={16} />,
    title: "Arus Kas",
    body: (
      <>
        <p>
          Buku kas per brand — mencatat pemasukan/pengeluaran kas riil (mis. tarik dana dari marketplace, top up e-wallet,
          transfer antar rekening), terpisah dari Transaksi berbasis Chart of Accounts.
        </p>
        <p>
          Kartu <strong>Kas Saat Ini</strong> di bagian atas menunjukkan saldo kas keseluruhan (Kas Masuk − Kas Keluar),
          selalu dihitung dari semua catatan — tidak terpengaruh filter tanggal di bawahnya.
        </p>
      </>
    ),
  },
  {
    id: "laporan",
    icon: <FileBarChart size={16} />,
    title: "Laporan L/R",
    body: (
      <>
        <p>Laporan Laba/Rugi format cetak, membandingkan dua periode (Periode A vs Periode B) lengkap dengan persentase dan variance. Judul laporan mengikuti nama perusahaan & brand yang sedang aktif.</p>
        <p>Gunakan tombol <strong>Print</strong> untuk cetak/simpan sebagai PDF, atau <strong>Export Excel</strong> untuk mengunduh data mentahnya.</p>
      </>
    ),
  },
  {
    id: "export",
    icon: <FileSpreadsheet size={16} />,
    title: "Export ke Excel",
    body: (
      <p>
        Menu Transaksi, Arus Kas, dan Laporan L/R masing-masing punya tombol <strong>Export Excel</strong> yang mengunduh
        file CSV (bisa langsung dibuka di Excel) sesuai filter yang sedang aktif di halaman tersebut.
      </p>
    ),
  },
  {
    id: "master-data",
    icon: <Building2 size={16} />,
    title: "Master Data (khusus Super Admin)",
    superAdminOnly: true,
    body: (
      <>
        <p>Kelola seluruh perusahaan, brand, dan akun pengguna dari satu tempat:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Perusahaan</strong> — tambah/edit CV/PT. Nama perusahaan dipakai sebagai judul di Laporan L/R.</li>
          <li><strong>Brand</strong> — tambah/edit brand di dalam sebuah perusahaan. Brand baru otomatis dapat Chart of Accounts starter (~50 akun) yang bisa diubah bebas. Brand bisa dinonaktifkan sementara lewat ikon centang/silang tanpa menghapus datanya.</li>
          <li><strong>Pengguna</strong> — tambah/edit akun login, tentukan role (<strong>Super Admin</strong>: akses semua perusahaan & brand, atau <strong>Admin Brand</strong>: hanya brand yang ditautkan) dan brand mana saja yang bisa diakses.</li>
        </ul>
      </>
    ),
  },
  {
    id: "peran",
    icon: <ArrowLeftRight size={16} />,
    title: "Perbedaan Peran Pengguna",
    body: (
      <ul className="list-disc pl-5 space-y-1">
        <li><strong>Super Admin</strong> — bisa melihat & mengelola semua perusahaan/brand, plus akses menu Master Data.</li>
        <li><strong>Admin Brand</strong> — hanya bisa melihat & mengelola brand yang sudah ditautkan oleh Super Admin lewat Master Data.</li>
      </ul>
    ),
  },
];

export default async function PanduanPage() {
  const session = await getSession();
  const isSuperAdmin = session.role === "super_admin";
  const sections = SECTIONS.filter((s) => !s.superAdminOnly || isSuperAdmin);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">Panduan Penggunaan</h1>
        <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
          Dokumentasi singkat cara pakai setiap menu di SMB Natura.
        </p>
      </div>

      <div className="card p-5">
        <h2 className="text-sm font-bold flex items-center gap-2 mb-3"><BookOpen size={16} /> Daftar Isi</h2>
        <div className="flex flex-wrap gap-2">
          {sections.map((s) => (
            <a key={s.id} href={`#${s.id}`} className="chip">{s.title}</a>
          ))}
        </div>
      </div>

      {sections.map((s) => (
        <div key={s.id} id={s.id} className="card p-5 scroll-mt-4">
          <h2 className="text-sm font-bold flex items-center gap-2 mb-3">{s.icon} {s.title}</h2>
          <div className="text-sm space-y-2" style={{ color: "var(--muted)" }}>{s.body}</div>
        </div>
      ))}
    </div>
  );
}
