"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { ArrowDownCircle, ArrowUpCircle, Calendar, Wallet, FileText, Tag, Landmark, Save, Check } from "lucide-react";
import type { CashFlowEntry, CashFlowType } from "@/lib/database.types";
import type { ActionState } from "@/app/(app)/cash-flow/actions";
import { cn } from "@/lib/utils";

const IDR_FORMAT = new Intl.NumberFormat("id-ID");

export function CashFlowForm({
  action,
  entry,
  submitLabel = "Simpan Catatan",
}: {
  action: (state: ActionState, fd: FormData) => Promise<ActionState>;
  entry?: CashFlowEntry | null;
  submitLabel?: string;
}) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(action, null);

  const [type, setType] = useState<CashFlowType>(entry?.type ?? "in");
  const [amountRaw, setAmountRaw] = useState(entry?.amount ? String(entry.amount) : "");
  const amountNum = Number(amountRaw.replace(/\D/g, "")) || 0;

  const canSubmit = amountNum > 0;

  return (
    <form action={formAction} className="space-y-5 w-full max-w-2xl mx-auto">
      {/* Jenis */}
      <div className="card p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FlowButton
            active={type === "in"}
            onClick={() => setType("in")}
            tone="in"
            icon={<ArrowDownCircle size={22} />}
            title="Kas Masuk"
            desc="Tarik dana, top up masuk, dll"
          />
          <FlowButton
            active={type === "out"}
            onClick={() => setType("out")}
            tone="out"
            icon={<ArrowUpCircle size={22} />}
            title="Kas Keluar"
            desc="Top up ke akun lain, bayar, dll"
          />
        </div>
        <input type="hidden" name="type" value={type} />
      </div>

      {/* Detail */}
      <div className="card p-5 space-y-4">
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
          <p className="text-[11px] mt-1.5 text-gray-500">Ketik angka saja. Contoh: <b>1500000</b> = Rp 1.500.000.</p>
          <FieldError err={state?.fieldErrors?.amount} />
        </div>

        <div>
          <label className="label !flex items-center gap-1.5" htmlFor="entry_date">
            <Calendar size={13} /> Tanggal <span style={{ color: "var(--neg)" }}>*</span>
          </label>
          <input
            type="date"
            id="entry_date"
            name="entry_date"
            required
            className="input"
            defaultValue={entry?.entry_date ?? new Date().toISOString().slice(0, 10)}
          />
          <FieldError err={state?.fieldErrors?.entry_date} />
        </div>

        <div>
          <label className="label !flex items-center gap-1.5" htmlFor="description">
            <FileText size={13} /> Keterangan <span style={{ color: "var(--neg)" }}>*</span>
          </label>
          <input
            type="text"
            id="description"
            name="description"
            required
            className="input"
            defaultValue={entry?.description ?? ""}
            placeholder="Contoh: Tarik dana marketplace"
          />
          <FieldError err={state?.fieldErrors?.description} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label !flex items-center gap-1.5" htmlFor="channel">
              <Tag size={13} /> Channel <span className="text-gray-400 font-normal normal-case">(opsional)</span>
            </label>
            <input
              type="text"
              id="channel"
              name="channel"
              className="input"
              defaultValue={entry?.channel ?? ""}
              placeholder="Contoh: Shopee, TikTok, dana dari brand lain"
            />
            <p className="text-[11px] mt-1 text-gray-500">Sumber atau tujuan dana.</p>
          </div>
          <div>
            <label className="label !flex items-center gap-1.5" htmlFor="account_note">
              <Landmark size={13} /> Akun <span className="text-gray-400 font-normal normal-case">(opsional)</span>
            </label>
            <input
              type="text"
              id="account_note"
              name="account_note"
              className="input"
              defaultValue={entry?.account_note ?? ""}
              placeholder="Contoh: BCA, Kas Tunai"
            />
            <p className="text-[11px] mt-1 text-gray-500">Bank/akun mana yang dipakai.</p>
          </div>
        </div>
      </div>

      {state?.error && (
        <div className="rounded-xl px-4 py-3 text-sm font-medium"
          style={{ color: "var(--neg)", background: "var(--neg-soft)", border: "1px solid var(--color-error-100)" }}>
          {state.error}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" className="btn" disabled={pending || !canSubmit}>
          <Save size={16} />
          {pending ? "Menyimpan…" : submitLabel}
        </button>
        <Link href="/cash-flow" className="btn-outline">Batal</Link>
        {!canSubmit && <span className="text-xs text-gray-500">Isi jumlah dulu untuk menyimpan.</span>}
      </div>
    </form>
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
        active ? "shadow-theme-md" : "border-gray-200 hover:border-gray-300 bg-white",
      )}
      style={active ? { borderColor: color, background: soft } : undefined}
    >
      <div className="w-11 h-11 rounded-xl grid place-items-center shrink-0 text-white shadow-theme-xs" style={{ background: color }}>
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

function FieldError({ err }: { err?: string[] }) {
  if (!err?.length) return null;
  return <p className="text-xs mt-1.5 font-medium" style={{ color: "var(--neg)" }}>{err[0]}</p>;
}
