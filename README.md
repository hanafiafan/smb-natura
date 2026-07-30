# SMB Natura — Dashboard Keuangan

Dashboard operasional untuk **CV Loka Bumi Persada** (SMB Natura). Catat transaksi, lihat KPI, dan hasilkan Laporan Laba/Rugi persis format PDF sample.

**Stack:** Next.js 16 · Postgres · iron-session · Recharts · Tailwind CSS · TypeScript

## Fitur

- **Login** — single-owner via email/password (session cookie terenkripsi, tanpa auth provider eksternal)
- **Dashboard** — 4 KPI (Omset, Laba Kotor, Laba Op, Laba Bersih) + donut komposisi beban + top 10 + MoM per kategori · filter periode compare
- **Transaksi** — form input + list dengan filter tanggal/akun/kategori/cabang/cari · CRUD lengkap · Export Excel
- **Laporan L/R** — tabel P&L format PDF (Deskripsi · Periode A · %A · Periode B · %B · %Var) · Print → PDF · Export Excel

Chart of Accounts pre-seeded dengan ~50 akun mengikuti struktur PDF Natura (Pendapatan, HPP, Gaji, Kantor, Pemasaran, Fee E-Commerce, Penyusutan, Produksi, Ops Lainnya, Sewa, Non-Op, Pajak).

## Dev lokal

```bash
npm install
cp .env.example .env.local          # isi DATABASE_URL, SESSION_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD_HASH
npm run dev                          # http://localhost:3000
```

## Setup database dari nol

Butuh Postgres (self-host, VPS mana pun, atau Docker lokal). Jalankan migrasi via `psql` (urutan matters):

```bash
psql "$DATABASE_URL" -f db/migrations/001_init_schema.sql
psql "$DATABASE_URL" -f db/migrations/002_seed_chart_of_accounts.sql
```

**Isi `.env.local`:**
- `DATABASE_URL` — connection string Postgres, mis. `postgres://user:pass@host:5432/smb_natura`
- `SESSION_SECRET` — string acak 32+ karakter (untuk enkripsi cookie session)
- `ADMIN_EMAIL` — email login owner
- `ADMIN_PASSWORD_HASH` — generate dengan:
  ```bash
  node -e "const c=require('crypto');const s=c.randomBytes(16);const h=c.scryptSync(process.argv[1],s,64);console.log(s.toString('hex')+':'+h.toString('hex'))" "password-kamu"
  ```

Multi-cabang: `insert into branches (name) values ('Nama Cabang');` langsung ke database.

## Deploy ke Coolify (self-host VPS)

Repo sudah punya `Dockerfile` (multi-stage, `output: "standalone"`) — di Coolify:

1. **New Resource → Application → Dockerfile** (dari repo Git ini).
2. Deploy Postgres di server yang sama (Coolify punya service template **Postgresql**), atau pakai Postgres yang sudah ada.
3. **Environment Variables** — tambahkan (tidak perlu dicentang "build variable", semuanya dibaca di runtime saja):
   - `DATABASE_URL`
   - `SESSION_SECRET`
   - `ADMIN_EMAIL`
   - `ADMIN_PASSWORD_HASH`
4. **Domains** — set ke domain yang sudah di-*pointing* di DNS (mis. `smb-natura.run-web.tech`, A record ke IP VPS). Coolify otomatis handle SSL (Let's Encrypt) & reverse proxy ke port `3000` container.
5. Jalankan migrasi (lihat "Setup database dari nol") terhadap database itu, lalu **Deploy**.

## Deploy ke Vercel (via GitHub)

```bash
# dari dalam folder smb-natura/
git init && git add . && git commit -m "initial: SMB Natura dashboard"
gh repo create smb-natura --private --source=. --push    # butuh gh CLI, atau push manual
```

Lalu di [vercel.com/new](https://vercel.com/new):
1. **Import** repo GitHub `smb-natura`
2. **Environment Variables** — tambahkan `DATABASE_URL`, `SESSION_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH` (Postgres harus reachable dari internet, mis. Neon/Supabase Postgres/VPS dengan port terbuka).
3. **Deploy**. Selesai.

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
│       │   ├── export/route.ts # export CSV
│       │   ├── new/page.tsx
│       │   └── [id]/edit/page.tsx
│       └── report/
│           ├── page.tsx        # Laporan L/R format PDF
│           └── export/route.ts # export CSV
├── components/                  # Nav, PeriodPicker, KpiCard, charts, TxnForm
├── lib/
│   ├── database.types.ts       # Account/Branch/Transaction types
│   ├── db.ts                   # Postgres client (postgres.js)
│   ├── session.ts              # iron-session + password verify
│   ├── pnl.ts                  # P&L aggregation
│   └── format.ts                # Rp/pct/date helpers
├── proxy.ts                     # Next.js 16 middleware (session check)
└── db/migrations/                # plain SQL, run manually via psql
```

## Yang di-skip (add later kalau perlu)

- Upload PDF parser · Bulk import CSV/Excel · Multi-user login · Multi-cabang UI · Neraca & Cash Flow · Budget vs Actual

Dashboard versi awal 1-file (`../index.html`) di-archive sebagai referensi statis.
