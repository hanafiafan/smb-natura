# SMB Natura — Dashboard Keuangan

Dashboard operasional untuk **CV Loka Bumi Persada** (SMB Natura). Catat transaksi, lihat KPI, dan hasilkan Laporan Laba/Rugi persis format PDF sample.

**Stack:** Next.js 16 · Supabase (Postgres + Auth) · Recharts · Tailwind CSS · TypeScript

## Fitur

- **Login** — single-owner via email/password (Supabase Auth)
- **Dashboard** — 4 KPI (Omset, Laba Kotor, Laba Op, Laba Bersih) + donut komposisi beban + top 10 + MoM per kategori · filter periode compare
- **Transaksi** — form input + list dengan filter tanggal/akun/kategori/cabang/cari · CRUD lengkap
- **Laporan L/R** — tabel P&L format PDF (Deskripsi · Periode A · %A · Periode B · %B · %Var) · Print → PDF

Chart of Accounts pre-seeded dengan ~50 akun mengikuti struktur PDF Natura (Pendapatan, HPP, Gaji, Kantor, Pemasaran, Fee E-Commerce, Penyusutan, Produksi, Ops Lainnya, Sewa, Non-Op, Pajak).

## Dev lokal

```bash
npm install
cp .env.example .env.local          # isi dengan Supabase URL + anon key
npm run dev                          # http://localhost:3000
```

## Setup Supabase dari nol

1. Buat project di [supabase.com](https://supabase.com).
2. Jalankan migrasi di **SQL Editor** (urutan matters):
   - `supabase/migrations/20260728000001_init_schema.sql`
   - `supabase/migrations/20260728000002_seed_chart_of_accounts.sql`
3. **Auth → Users → Add user** — buat email/password owner Anda.
4. **Project Settings → API** — copy `Project URL` dan `anon public` key ke `.env.local`.

Multi-cabang: `insert into branches (name) values ('Nama Cabang')` di SQL Editor.

## Deploy ke Vercel (via GitHub)

```bash
# dari dalam folder smb-natura/
git init && git add . && git commit -m "initial: SMB Natura dashboard"
gh repo create smb-natura --private --source=. --push    # butuh gh CLI, atau push manual
```

Lalu di [vercel.com/new](https://vercel.com/new):
1. **Import** repo GitHub `smb-natura`
2. **Environment Variables** — tambahkan:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. **Deploy**. Selesai.

## Deploy ke Coolify (self-host VPS)

Repo sudah punya `Dockerfile` (multi-stage, `output: "standalone"`) — di Coolify:

1. **New Resource → Application → Dockerfile** (dari repo Git ini).
2. **Environment Variables** — tambahkan sebagai **Build Variable** (dicentang "available at buildtime", karena `NEXT_PUBLIC_*` di-inline saat `next build`):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. **Domains** — set ke domain yang sudah di-*pointing* di DNS (mis. `smb-natura.run-web.tech`, A record ke IP VPS). Coolify otomatis handle SSL (Let's Encrypt) & reverse proxy ke port `3000` container.
4. **Deploy**. Setelah deploy pertama sukses, tambahkan domain yang sama ke **Supabase → Authentication → URL Configuration → Site URL** biar redirect setelah login benar (sama seperti langkah Vercel).

Setelah deploy, tambahkan domain Vercel (`smb-natura.vercel.app`) ke **Supabase → Authentication → URL Configuration → Site URL** biar redirect setelah login benar.

## Update Chart of Accounts nanti

```sql
insert into accounts (code, name, section, category, sign, sort_order)
values ('6820', 'Beban Sewa Gudang', 'opex', 'Sewa', 1, 1030);
```

## Struktur

```
src/
├── app/
│   ├── layout.tsx              # root
│   ├── login/                  # public login
│   └── (app)/                  # auth-required (nav + kredensial)
│       ├── layout.tsx
│       ├── page.tsx            # /  Dashboard
│       ├── transactions/
│       │   ├── page.tsx        # list + filter + pagination
│       │   ├── actions.ts      # server actions (CRUD)
│       │   ├── new/page.tsx
│       │   └── [id]/edit/page.tsx
│       └── report/page.tsx     # Laporan L/R format PDF
├── components/                 # Nav, PeriodPicker, KpiCard, charts, TxnForm
├── lib/
│   ├── database.types.ts       # Supabase types
│   ├── pnl.ts                  # P&L aggregation
│   ├── format.ts               # Rp/pct/date helpers
│   └── supabase/               # server, client, proxy helpers
└── proxy.ts                    # Next.js 16 middleware (auth refresh)
```

## Yang di-skip (add later kalau perlu)

- Upload PDF parser · Bulk import CSV/Excel · Multi-role auth (RLS per-user) · Multi-cabang UI · Neraca & Cash Flow · Budget vs Actual · Export ke Excel

Dashboard versi awal 1-file (`../index.html`) di-archive sebagai referensi statis.
