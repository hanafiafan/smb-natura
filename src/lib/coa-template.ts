import type { AccountSection } from "@/lib/database.types";

export type CoaTemplateRow = {
  code: string;
  name: string;
  section: AccountSection;
  category: string | null;
  sign: number;
  sort_order: number;
};

/**
 * Starter Chart of Accounts given to every new brand — mirrors migration
 * 002_seed_chart_of_accounts.sql. Kept as a standalone constant (not copied from a
 * live brand's rows) so that deleting/renaming any brand — including the original
 * "Natura" — can never break COA seeding for brands created afterward.
 */
export const COA_TEMPLATE: CoaTemplateRow[] = [
  { code: "4100", name: "Penjualan", section: "revenue", category: null, sign: 1, sort_order: 10 },
  { code: "4110", name: "Retur Penjualan", section: "revenue", category: null, sign: -1, sort_order: 20 },
  { code: "4120", name: "Diskon Penjualan", section: "revenue", category: null, sign: -1, sort_order: 30 },
  { code: "5100", name: "Beban Pokok Penjualan", section: "cogs", category: null, sign: 1, sort_order: 100 },
  { code: "6100", name: "Beban Gaji, Upah & Honorer", section: "opex", category: "Gaji", sign: 1, sort_order: 210 },
  { code: "6110", name: "Beban Bensin, Parkir, Tol Kendaraan", section: "opex", category: "Gaji", sign: 1, sort_order: 220 },
  { code: "6120", name: "Beban Transportasi Karyawan", section: "opex", category: "Gaji", sign: 1, sort_order: 230 },
  { code: "6130", name: "Beban THR", section: "opex", category: "Gaji", sign: 1, sort_order: 240 },
  { code: "6140", name: "Beban Katering & Makan Karyawan", section: "opex", category: "Gaji", sign: 1, sort_order: 250 },
  { code: "6150", name: "Beban Tunjangan Karyawan", section: "opex", category: "Gaji", sign: 1, sort_order: 260 },
  { code: "6160", name: "Beban BPJS Kesehatan", section: "opex", category: "Gaji", sign: 1, sort_order: 270 },
  { code: "6170", name: "Beban BPJS Ketenagakerjaan", section: "opex", category: "Gaji", sign: 1, sort_order: 280 },
  { code: "6180", name: "Beban Pelatihan dan Pengembangan Karyawan", section: "opex", category: "Gaji", sign: 1, sort_order: 290 },
  { code: "6200", name: "Beban Listrik", section: "opex", category: "Kantor", sign: 1, sort_order: 310 },
  { code: "6210", name: "Beban Telekomunikasi", section: "opex", category: "Kantor", sign: 1, sort_order: 320 },
  { code: "6220", name: "Beban Ekspedisi, Pos & Materai", section: "opex", category: "Kantor", sign: 1, sort_order: 330 },
  { code: "6230", name: "Beban Perjalanan Dinas", section: "opex", category: "Kantor", sign: 1, sort_order: 340 },
  { code: "6240", name: "Beban Perlengkapan Kantor", section: "opex", category: "Kantor", sign: 1, sort_order: 350 },
  { code: "6250", name: "Beban Aplikasi Sistem", section: "opex", category: "Kantor", sign: 1, sort_order: 360 },
  { code: "6260", name: "Beban Peralatan Kantor", section: "opex", category: "Kantor", sign: 1, sort_order: 370 },
  { code: "6270", name: "Beban Perbaikan Alat Kantor", section: "opex", category: "Kantor", sign: 1, sort_order: 380 },
  { code: "6280", name: "Beban R&D", section: "opex", category: "Kantor", sign: 1, sort_order: 390 },
  { code: "6290", name: "Beban Kebersihan Kantor", section: "opex", category: "Kantor", sign: 1, sort_order: 400 },
  { code: "6295", name: "Beban Jasa Manajemen dan Konsultasi", section: "opex", category: "Kantor", sign: 1, sort_order: 410 },
  { code: "6297", name: "Beban Service Alat Kantor", section: "opex", category: "Kantor", sign: 1, sort_order: 420 },
  { code: "6300", name: "Beban Iklan Branding", section: "opex", category: "Pemasaran", sign: 1, sort_order: 510 },
  { code: "6310", name: "Beban Iklan Shopee NG", section: "opex", category: "Pemasaran", sign: 1, sort_order: 520 },
  { code: "6320", name: "Beban Iklan Tiktok NG", section: "opex", category: "Pemasaran", sign: 1, sort_order: 530 },
  { code: "6330", name: "Beban Afiliasi Shopee NG", section: "opex", category: "Pemasaran", sign: 1, sort_order: 540 },
  { code: "6340", name: "Beban Afiliasi Tiktok NG", section: "opex", category: "Pemasaran", sign: 1, sort_order: 550 },
  { code: "6350", name: "Beban Promo Shopee NG", section: "opex", category: "Pemasaran", sign: 1, sort_order: 560 },
  { code: "6360", name: "Beban Iklan Meta", section: "opex", category: "Pemasaran", sign: 1, sort_order: 570 },
  { code: "6400", name: "Beban Admin Shopee NG", section: "opex", category: "Fee E-Commerce", sign: 1, sort_order: 610 },
  { code: "6410", name: "Beban Admin Tiktok NG", section: "opex", category: "Fee E-Commerce", sign: 1, sort_order: 620 },
  { code: "6420", name: "Potongan Ongkos Kirim NG", section: "opex", category: "Fee E-Commerce", sign: 1, sort_order: 630 },
  { code: "6430", name: "Beban Proses Pesanan Shopee NG", section: "opex", category: "Fee E-Commerce", sign: 1, sort_order: 640 },
  { code: "6440", name: "Beban Proses Pesanan TikTok NG", section: "opex", category: "Fee E-Commerce", sign: 1, sort_order: 650 },
  { code: "6450", name: "Beban Layanan Cashback Bonus TikTok NG", section: "opex", category: "Fee E-Commerce", sign: 1, sort_order: 660 },
  { code: "6500", name: "Beban Penyusutan Mesin dan Peralatan", section: "opex", category: "Penyusutan", sign: 1, sort_order: 710 },
  { code: "6510", name: "Beban Penyusutan Inventaris Kantor", section: "opex", category: "Penyusutan", sign: 1, sort_order: 720 },
  { code: "6600", name: "Beban Packaging", section: "opex", category: "Produksi", sign: 1, sort_order: 810 },
  { code: "6610", name: "Beban Perlengkapan Gudang", section: "opex", category: "Produksi", sign: 1, sort_order: 820 },
  { code: "6700", name: "Beban Operasional Lainnya", section: "opex", category: "Ops Lainnya", sign: 1, sort_order: 910 },
  { code: "6710", name: "Beban CSR", section: "opex", category: "Ops Lainnya", sign: 1, sort_order: 920 },
  { code: "6800", name: "Beban Sewa Gedung", section: "opex", category: "Sewa", sign: 1, sort_order: 1010 },
  { code: "6810", name: "Beban Sewa Kendaraan", section: "opex", category: "Sewa", sign: 1, sort_order: 1020 },
  { code: "7100", name: "Penyesuaian Marketplace", section: "non_op_income", category: null, sign: -1, sort_order: 1110 },
  { code: "7110", name: "Pendapatan Bunga", section: "non_op_income", category: null, sign: 1, sort_order: 1120 },
  { code: "7200", name: "Beban Adm. Bank & Buku Cek/Giro", section: "non_op_expense", category: null, sign: 1, sort_order: 1210 },
  { code: "7210", name: "Pajak Jasa Giro", section: "non_op_expense", category: null, sign: 1, sort_order: 1220 },
  { code: "7220", name: "Beban Penyesuaian Kas Bank", section: "non_op_expense", category: null, sign: 1, sort_order: 1230 },
  { code: "9100", name: "Pajak Penghasilan", section: "tax", category: null, sign: 1, sort_order: 9000 },
];
