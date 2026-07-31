# SMB Natura — Dashboard Keuangan Multi-Brand

Dashboard operasional multi-perusahaan/multi-brand. Tiap brand punya Chart of Accounts & transaksi sendiri (terpisah total), dengan Laporan Laba/Rugi format PDF sample.

**Stack:** Next.js 16 · Postgres · iron-session · Recharts · Tailwind CSS · TypeScript

## Fitur

- **Login multi-user** — Super Admin (akses semua perusahaan & brand) atau Admin Brand (akses brand yang ditautkan saja) · akun terkunci 15 menit setelah 5x salah password berturut-turut
- **Akun Saya** — tiap user bisa ganti password sendiri tanpa lewat Super Admin
- **Master Data** — tambah/edit Perusahaan (CV/PT), tambah/edit Brand di dalamnya, tambah/edit pengguna + assign brand (khusus Super Admin)
- **Dashboard** — 4 KPI (Omset, Laba Kotor, Laba Op, Laba Bersih) + donut komposisi beban + top 10 + MoM per kategori · filter periode compare
- **Transaksi** — form input + list dengan filter tanggal/akun/kategori/cari · CRUD lengkap · Export Excel
- **Arus Kas** — buku kas per brand (Kas Masuk/Keluar, channel & akun opsional) dengan saldo "Kas Saat Ini" berjalan · CRUD lengkap · Export Excel
- **Laporan L/R** — tabel P&L format PDF (Deskripsi · Periode A · %A · Periode B · %B · %Var), judul & nama perusahaan mengikuti brand aktif · Print → PDF · Export Excel
- **Panduan Penggunaan** — dokumentasi in-app cara pakai tiap menu, bagian Master Data hanya tampil untuk Super Admin

Brand baru otomatis dibuatkan Chart of Accounts starter (copy dari template Natura, ~50 akun: Pendapatan, HPP, Gaji, Kantor, Pemasaran, Fee E-Commerce, Penyusutan, Produksi, Ops Lainnya, Sewa, Non-Op, Pajak) — bisa diubah bebas sesudahnya per brand.

## Dev lokal

```bash
npm install
cp .env.example .env.local          # isi DATABASE_URL, SESSION_SECRET
npm run dev                          # http://localhost:3000
```

## Testing

Unit test untuk logic kritis (hash/verify password, lockout policy, format CSV) pakai Vitest:

```bash
npm test
```

## Setup database dari nol

Butuh Postgres (self-host, VPS mana pun, atau Docker lokal). Jalankan migrasi via `psql` **berurutan**:

```bash
psql "$DATABASE_URL" -f db/migrations/001_init_schema.sql
psql "$DATABASE_URL" -f db/migrations/002_seed_chart_of_accounts.sql
psql "$DATABASE_URL" -f db/migrations/003_multi_tenant.sql
psql "$DATABASE_URL" -f db/migrations/004_cash_flow.sql
psql "$DATABASE_URL" -f db/migrations/005_login_lockout.sql
```

Migrasi 003 otomatis membuat 1 perusahaan default ("CV Loka Bumi Persada") + 1 brand default ("Natura") dan memindahkan Chart of Accounts yang sudah ada ke brand itu — data lama tidak hilang.

**Bootstrap Super Admin pertama** (belum ada UI untuk ini karena butuh minimal 1 akun untuk login):

```bash
node -e "const c=require('crypto');const s=c.randomBytes(16);const h=c.scryptSync(process.argv[1],s,64);console.log(s.toString('hex')+':'+h.toString('hex'))" "password-kamu"
```

```sql
insert into users (email, password_hash, role)
values ('owner@yourcompany.com', '<saltHex:hashHex dari command di atas>', 'super_admin');
```

Setelah itu, tambah perusahaan/brand/pengguna lain lewat menu **Master Data** di aplikasi.

## Deploy ke Coolify (self-host VPS)

Repo sudah punya `Dockerfile` (multi-stage, `output: "standalone"`) — di Coolify:

1. **New Resource → Application → Dockerfile** (dari repo Git ini).
2. Deploy Postgres di server yang sama (Coolify punya service template **Postgresql**), atau pakai Postgres yang sudah ada.
3. **Environment Variables** — tambahkan (tidak perlu dicentang "build variable", semuanya dibaca di runtime saja):
   - `DATABASE_URL`
   - `SESSION_SECRET`
4. **Domains** — set ke domain yang sudah di-*pointing* di DNS. Coolify otomatis handle SSL (Let's Encrypt) & reverse proxy ke port `3000` container.
5. Jalankan migrasi + bootstrap Super Admin (lihat "Setup database dari nol") terhadap database itu, lalu **Deploy**.

## Deploy ke Vercel (via GitHub)

```bash
# dari dalam folder smb-natura/
git init && git add . && git commit -m "initial: SMB Natura dashboard"
gh repo create smb-natura --private --source=. --push    # butuh gh CLI, atau push manual
```

Lalu di [vercel.com/new](https://vercel.com/new):
1. **Import** repo GitHub `smb-natura`
2. **Environment Variables** — tambahkan `DATABASE_URL`, `SESSION_SECRET` (Postgres harus reachable dari internet, mis. Neon/Supabase Postgres/VPS dengan port terbuka).
3. **Deploy**. Selesai.

## Struktur

```
src/
├── app/
│   ├── layout.tsx              # root
│   ├── login/                  # public login
│   └── (app)/                  # auth-required (nav + kredensial)
│       ├── layout.tsx          # session check, brand switcher, sidebar
│       ├── brand-actions.ts    # switchBrand server action
│       ├── page.tsx            # /  Dashboard (scoped ke brand aktif)
│       ├── master-data/        # CRUD perusahaan/brand/pengguna (super admin only)
│       ├── transactions/
│       │   ├── page.tsx        # list + filter + pagination
│       │   ├── actions.ts      # server actions (CRUD)
│       │   ├── export/route.ts # export CSV
│       │   ├── new/page.tsx
│       │   └── [id]/edit/page.tsx
│       ├── cash-flow/
│       │   ├── page.tsx        # list + saldo "Kas Saat Ini" + filter + pagination
│       │   ├── actions.ts      # server actions (CRUD)
│       │   ├── export/route.ts # export CSV
│       │   ├── new/page.tsx
│       │   └── [id]/edit/page.tsx
│       ├── report/
│       │   ├── page.tsx        # Laporan L/R format PDF (judul dinamis per brand)
│       │   └── export/route.ts # export CSV
│       ├── panduan/
│       │   └── page.tsx        # dokumentasi in-app cara pakai sistem
│       └── account/
│           └── page.tsx        # ganti password sendiri
├── components/                  # Nav, PeriodPicker, KpiCard, charts, TxnForm, CashFlowForm
├── lib/
│   ├── database.types.ts       # Company/Brand/AppUser/Account/Transaction/CashFlowEntry types
│   ├── db.ts                   # Postgres client (postgres.js)
│   ├── session.ts              # iron-session + role/brand helpers + password hash
│   ├── login-lockout.ts        # kebijakan lockout login (pure logic, ada unit test)
│   ├── brands.ts                # getAccessibleBrands (super admin vs brand admin)
│   ├── pnl.ts                   # P&L aggregation
│   └── format.ts                # Rp/pct/date helpers
├── proxy.ts                     # Next.js 16 middleware (session check)
└── db/migrations/                # plain SQL, run manually via psql
```

## Yang di-skip (add later kalau perlu)

- Upload PDF parser · Bulk import CSV/Excel · Neraca (Balance Sheet) · Budget vs Actual

Dashboard versi awal 1-file (`../index.html`) di-archive sebagai referensi statis.
