"use client";

import { useActionState, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowDownCircle, ArrowUpCircle, Check, Calendar, Wallet, FileText, Hash, Save, CircleHelp } from "lucide-react";
import type { Account, Transaction } from "@/lib/database.types";
import type { ActionState } from "@/app/(app)/transactions/actions";
import { cn } from "@/lib/utils";

type Flow = "in" | "out";

// Kategori grup yang ramah untuk orang awam
const IN_GROUPS = [
  { key: "Penjualan", label: "Penjualan Produk", desc: "Uang masuk dari jual barang" },
  { key: "Retur/Diskon", label: "Retur / Diskon", desc: "Barang dikembalikan atau diskon jual" },
  { key: "Non-Op", label: "Pendapatan Lain", desc: "Bunga bank, penyesuaian marketplace, dll" },
] as const;

const OUT_GROUPS = [
  { key: "HPP", label: "Modal / HPP", desc: "Harga pokok barang yang dijual" },
  { key: "Gaji", label: "Gaji & Karyawan", desc: "Gaji, THR, tunjangan, BPJS" },
  { key: "Kantor", label: "Biaya Kantor", desc: "Listrik, ATK, aplikasi, sewa peralatan" },
  { key: "Pemasaran", label: "Iklan & Promosi", desc: "TikTok Ads, Shopee, branding" },
  { key: "Fee E-Commerce", label: "Fee Marketplace", desc: "Admin & proses pesanan Shopee/TikTok" },
  { key: "Produksi", label: "Produksi & Packaging", desc: "Kemasan, perlengkapan gudang" },
  { key: "Sewa", label: "Sewa", desc: "Sewa gedung, kendaraan" },
  { key: "Penyusutan", label: "Penyusutan", desc: "Depresiasi mesin/inventaris" },
  { key: "Ops Lainnya", label: "Operasional Lain", desc: "CSR, biaya operasional lain-lain" },
  { key: "Non-Op-Beban", label: "Beban Lain", desc: "Adm bank, pajak jasa giro, penyesuaian kas" },
  { key: "Pajak", label: "Pajak Penghasilan", desc: "PPh perusahaan" },
] as const;

/** Petakan akun ke grup ramah-user */
function accountGroup(a: Account): string | null {
  if (a.section === "revenue") {
    if (a.code === "4110" || a.code === "4120") return "Retur/Diskon";
    return "Penjualan";
  }
  if (a.section === "cogs") return "HPP";
  if (a.section === "opex") return a.category ?? null;
  if (a.section === "non_op_income") return "Non-Op";
  if (a.section === "non_op_expense") return "Non-Op-Beban";
  if (a.section === "tax") return "Pajak";
  return null;
}

function isIncomeSection(a: Account): boolean {
  return a.section === "revenue" || a.section === "non_op_income";
}

const IDR_FORMAT = new Intl.NumberFormat("id-ID");

export function TxnForm({
  action,
  accounts,
  txn,
  submitLabel = "Simpan Transaksi",
}: {
  action: (state: ActionState, fd: FormData) => Promise<ActionState>;
  accounts: Account[];
  txn?: Transaction | null;
  submitLabel?: string;
}) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(action, null);

  // Derive initial flow from existing txn
  const initialAccount = txn ? accounts.find((a) => a.id === txn.account_id) ?? null : null;
  const initialFlow: Flow = initialAccount ? (isIncomeSection(initialAccount) ? "in" : "out") : "out";
  const initialGroup = initialAccount ? accountGroup(initialAccount) : null;

  const [flow, setFlow] = useState<Flow>(initialFlow);
  const [group, setGroup] = useState<string | null>(initialGroup);
  const [accountId, setAccountId] = useState<number | "">(txn?.account_id ?? "");
  const [amountRaw, setAmountRaw] = useState<string>(txn?.amount ? String(txn.amount) : "");
  const [txnDate, setTxnDate] = useState<string>(txn?.txn_date ?? new Date().toISOString().slice(0, 10));

  const groups = flow === "in" ? IN_GROUPS : OUT_GROUPS;

  // Filter accounts by selected group
  const accountsInGroup = useMemo(() => {
    if (!group) return [];
    return accounts.filter((a) => {
      if (!a.is_active) return false;
      // Filter by flow first
      if (flow === "in" && !isIncomeSection(a)) return false;
      if (flow === "out" && isIncomeSection(a)) return false;
      return accountGroup(a) === group;
    });
  }, [accounts, group, flow]);

  const selectedAccount = accounts.find((a) => a.id === accountId) || null;
  const amountNum = Number(amountRaw.replace(/\D/g, "")) || 0;
  const amountFormatted = amountNum > 0 ? `Rp ${IDR_FORMAT.format(amountNum)}` : "Rp 0";
  const txnDateFmt = txnDate ? new Date(txnDate).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) : "—";

  const canSubmit = !!accountId && amountNum > 0 && !!txnDate;

  return (
    <form action={formAction} className="space-y-5 w-full max-w-5xl mx-auto">
      {/* STEP 1: Jenis transaksi */}
      <div className="card p-5">
        <StepHeader n="1" title="Jenis transaksi" hint="Uang masuk (pendapatan) atau uang keluar (biaya/pengeluaran)?" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
          <FlowButton
            active={flow === "in"}
            onClick={() => { setFlow("in"); setGroup(null); setAccountId(""); }}
            tone="in"
            icon={<ArrowDownCircle size={24} />}
            title="Uang Masuk"
            desc="Penjualan, pendapatan lain"
          />
          <FlowButton
            active={flow === "out"}
            onClick={() => { setFlow("out"); setGroup(null); setAccountId(""); }}
            tone="out"
            icon={<ArrowUpCircle size={24} />}
            title="Uang Keluar"
            desc="Biaya, iklan, gaji, dll"
          />
        </div>
      </div>

      {/* STEP 2: Kategori */}
      <div className="card p-5">
        <StepHeader n="2" title="Kategori" hint="Pilih jenis biaya/pendapatan supaya laporan rapi" />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mt-4">
          {groups.map((g) => {
            const active = group === g.key;
            return (
              <button
                key={g.key}
                type="button"
                onClick={() => { setGroup(g.key); setAccountId(""); }}
                className={cn(
                  "text-left rounded-xl border p-3 transition-all group",
                  active
                    ? "border-brand-500 bg-brand-50 shadow-brand-sm"
                    : "border-gray-200 bg-white hover:border-brand-300 hover:bg-brand-25",
                )}
              >
                <div className={cn("text-sm font-semibold", active ? "text-brand-700" : "text-gray-800")}>
                  {g.label}
                </div>
                <div className="text-[11px] mt-0.5 text-gray-500 leading-tight">{g.desc}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* STEP 3: Akun spesifik */}
      <div className="card p-5">
        <StepHeader n="3" title="Akun spesifik" hint={group ? `Pilih baris yang paling cocok di kategori "${groups.find(g=>g.key===group)?.label}"` : "Pilih kategori dulu di langkah 2"} />
        {!group ? (
          <div className="mt-4 p-4 rounded-xl text-sm text-center" style={{ background: "var(--sub)", color: "var(--muted)" }}>
            <CircleHelp size={20} className="mx-auto mb-1.5 opacity-70" />
            Pilih kategori di langkah 2 dulu, akun spesifik akan muncul di sini.
          </div>
        ) : accountsInGroup.length === 0 ? (
          <div className="mt-4 p-4 rounded-xl text-sm text-center" style={{ background: "var(--sub)", color: "var(--muted)" }}>
            Tidak ada akun aktif di kategori ini.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4">
            {accountsInGroup.map((a) => {
              const active = accountId === a.id;
              return (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => setAccountId(a.id)}
                  className={cn(
                    "text-left rounded-lg border px-3 py-2.5 transition-all flex items-center justify-between gap-2",
                    active
                      ? "border-brand-500 bg-brand-50 shadow-brand-sm"
                      : "border-gray-200 bg-white hover:border-brand-300 hover:bg-brand-25",
                  )}
                >
                  <div className="min-w-0">
                    <div className={cn("text-[13px] font-medium truncate", active ? "text-brand-700" : "text-gray-800")}>
                      {a.name}
                    </div>
                    <div className="text-[10px] text-gray-400 font-mono">{a.code}</div>
                  </div>
                  {active && <Check size={16} className="text-brand-600 shrink-0" />}
                </button>
              );
            })}
          </div>
        )}
        <FieldError err={state?.fieldErrors?.account_id} />
        {/* hidden field for form submit */}
        <input type="hidden" name="account_id" value={accountId || ""} />
      </div>

      {/* STEP 4: Detail transaksi */}
      <div className="card p-5">
        <StepHeader n="4" title="Detail transaksi" hint="Isi jumlah, tanggal, dan keterangan singkat" />

        <div className="mt-4 space-y-4">
          {/* Amount — hero field */}
          <div>
            <label className="label !flex items-center gap-1.5" htmlFor="amount">
              <Wallet size={13} /> Jumlah (Rupiah) <span style={{ color: "var(--neg)" }}>*</span>
            </label>
            <div className="flex items-stretch rounded-xl border border-gray-200 bg-white shadow-theme-xs overflow-hidden focus-within:border-brand-400 focus-within:ring-4 focus-within:ring-brand-500/12 transition-colors">
              <span className="grid place-items-center px-4 text-brand-600 font-bold text-lg select-none bg-brand-25 border-r border-gray-200">Rp</span>
              <input
                id="amount"
                name="amount"
                type="text"
                inputMode="numeric"
                required
                autoComplete="off"
                className="flex-1 min-w-0 bg-transparent px-4 py-3 text-xl font-bold outline-none tracking-tight"
                placeholder="0"
                value={amountRaw ? IDR_FORMAT.format(amountNum) : ""}
                onChange={(e) => setAmountRaw(e.target.value.replace(/\D/g, ""))}
              />
            </div>
            <p className="text-[11px] mt-1.5 text-gray-500 flex items-center gap-1">
              <CircleHelp size={11} /> Ketik angka saja (tanpa titik/koma). Contoh: <b>1500000</b> = Rp 1.500.000.
              Sistem otomatis kurangi omset untuk retur/diskon.
            </p>
            <FieldError err={state?.fieldErrors?.amount} />
          </div>

          {/* Date */}
          <div>
            <label className="label !flex items-center gap-1.5" htmlFor="txn_date">
              <Calendar size={13} /> Tanggal <span style={{ color: "var(--neg)" }}>*</span>
            </label>
            <input
              type="date"
              id="txn_date"
              name="txn_date"
              required
              className="input"
              value={txnDate}
              onChange={(e) => setTxnDate(e.target.value)}
            />
            <p className="text-[11px] mt-1 text-gray-500">Kapan transaksi terjadi (default: hari ini).</p>
            <FieldError err={state?.fieldErrors?.txn_date} />
          </div>

          {/* Description */}
          <div>
            <label className="label !flex items-center gap-1.5" htmlFor="description">
              <FileText size={13} /> Keterangan <span className="text-gray-400 font-normal normal-case">(opsional)</span>
            </label>
            <input
              type="text"
              id="description"
              name="description"
              className="input"
              defaultValue={txn?.description ?? ""}
              placeholder="Contoh: Beli bahan baku dari supplier ABC"
            />
            <p className="text-[11px] mt-1 text-gray-500">Catatan singkat supaya nanti mudah diingat.</p>
          </div>

          {/* Reference */}
          <div>
            <label className="label !flex items-center gap-1.5" htmlFor="reference">
              <Hash size={13} /> Nomor Referensi <span className="text-gray-400 font-normal normal-case">(opsional)</span>
            </label>
            <input
              type="text"
              id="reference"
              name="reference"
              className="input"
              defaultValue={txn?.reference ?? ""}
              placeholder="Contoh: INV-2026-05-123"
            />
            <p className="text-[11px] mt-1 text-gray-500">Nomor invoice, kwitansi, atau nota bila ada.</p>
          </div>
        </div>
      </div>

      {/* Preview */}
      <div className="card p-5" style={{ background: canSubmit
        ? "linear-gradient(135deg, var(--color-brand-50) 0%, #ffffff 60%)"
        : "var(--sub)" }}>
        <div className="flex items-center gap-2 mb-3">
          <div className={cn("w-7 h-7 rounded-lg grid place-items-center",
            canSubmit ? "text-brand-600 bg-brand-100" : "text-gray-400 bg-gray-100")}>
            {canSubmit ? <Check size={16} /> : <CircleHelp size={16} />}
          </div>
          <div className="text-[11px] font-bold uppercase tracking-wider" style={{ color: canSubmit ? "var(--color-brand-700)" : "var(--muted)" }}>
            {canSubmit ? "Siap dicatat" : "Ringkasan pengisian"}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <PreviewRow
            label="Jenis"
            value={
              <span className="inline-flex items-center gap-1.5">
                {flow === "in" ? <ArrowDownCircle size={14} className="text-brand-600" /> : <ArrowUpCircle size={14} className="text-warning-600" />}
                {flow === "in" ? "Uang Masuk" : "Uang Keluar"}
              </span>
            }
            filled
          />
          <PreviewRow label="Kategori" value={group ? groups.find((g) => g.key === group)?.label ?? group : null} />
          <PreviewRow label="Akun" value={selectedAccount?.name ?? null} colSpan />
          <PreviewRow label="Jumlah" value={amountNum > 0 ? amountFormatted : null} big />
          <PreviewRow label="Tanggal" value={txnDate ? txnDateFmt : null} />
        </div>
      </div>

      {/* Error banner */}
      {state?.error && (
        <div className="rounded-xl px-4 py-3 text-sm font-medium"
          style={{ color: "var(--neg)", background: "var(--neg-soft)", border: "1px solid var(--color-error-100)" }}>
          {state.error}
        </div>
      )}

      {/* Actions — no sticky (menyebabkan overlap) */}
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" className="btn" disabled={pending || !canSubmit}>
          <Save size={16} />
          {pending ? "Menyimpan…" : submitLabel}
        </button>
        <Link href="/transactions" className="btn-outline">Batal</Link>
        {!canSubmit && (
          <span className="text-xs text-gray-500">
            Lengkapi langkah 1–4 dulu untuk menyimpan.
          </span>
        )}
      </div>
    </form>
  );
}

function StepHeader({ n, title, hint }: { n: string; title: string; hint: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-lg grid place-items-center font-bold text-white shrink-0 shadow-brand-sm"
        style={{ background: "linear-gradient(135deg, var(--color-brand-500), var(--color-brand-700))" }}>
        {n}
      </div>
      <div className="min-w-0">
        <div className="font-semibold text-gray-900">{title}</div>
        <div className="text-xs mt-0.5 text-gray-500">{hint}</div>
      </div>
    </div>
  );
}

function FlowButton({
  active, onClick, tone, icon, title, desc,
}: {
  active: boolean; onClick: () => void; tone: "in" | "out";
  icon: React.ReactNode; title: string; desc: string;
}) {
  const color = tone === "in" ? "var(--color-brand-600)" : "var(--color-warning-600)";
  const soft = tone === "in" ? "var(--color-brand-50)" : "var(--color-warning-50)";
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "text-left rounded-2xl border-2 p-4 transition-all flex items-center gap-3 min-w-0",
        active
          ? "shadow-theme-md"
          : "border-gray-200 hover:border-gray-300 bg-white",
      )}
      style={active ? { borderColor: color, background: soft } : undefined}
    >
      <div className="w-11 h-11 rounded-xl grid place-items-center shrink-0 text-white shadow-theme-xs"
        style={{ background: color }}>
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="font-bold text-[15px] leading-tight" style={{ color: active ? color : "var(--foreground)" }}>{title}</div>
        <div className="text-[11px] text-gray-500 mt-0.5 leading-snug">{desc}</div>
      </div>
      {active && <Check size={18} className="shrink-0" style={{ color }} />}
    </button>
  );
}

function PreviewRow({ label, value, big, filled, colSpan }: {
  label: string; value: React.ReactNode | null; big?: boolean; filled?: boolean; colSpan?: boolean;
}) {
  const isEmpty = value == null || value === "";
  return (
    <div className={cn(colSpan && "sm:col-span-2")}>
      <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{label}</div>
      <div className={cn(
        big ? "text-lg font-bold" : "text-sm font-medium",
        isEmpty ? "text-gray-300 italic" : "text-gray-900",
        filled && isEmpty && "text-gray-500 not-italic font-normal"
      )}>
        {isEmpty ? "Belum diisi" : value}
      </div>
    </div>
  );
}

function FieldError({ err }: { err?: string[] }) {
  if (!err?.length) return null;
  return <p className="text-xs mt-1.5 font-medium" style={{ color: "var(--neg)" }}>{err[0]}</p>;
}
