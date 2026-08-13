"use client";

import { useState } from "react";
import type { AccountSection } from "@/lib/database.types";

const NO_CATEGORY = "";
const NEW_CATEGORY = "__new__";

export type AccountFormValues = {
  section: AccountSection;
  category: string | null;
  code: string;
  name: string;
  sign: number;
};

export function AccountForm({
  action,
  sectionLabels,
  categoriesBySection,
  defaultValues,
  submitLabel,
  error,
}: {
  action: (formData: FormData) => void | Promise<void>;
  sectionLabels: Record<AccountSection, string>;
  categoriesBySection: Record<string, string[]>;
  defaultValues?: AccountFormValues;
  submitLabel: string;
  error?: string;
}) {
  const [section, setSection] = useState<AccountSection>(defaultValues?.section ?? "opex");
  const existingCategories = categoriesBySection[section] ?? [];

  const startsAsNew = !!defaultValues?.category && !existingCategories.includes(defaultValues.category);
  const [categoryChoice, setCategoryChoice] = useState<string>(
    startsAsNew ? NEW_CATEGORY : defaultValues?.category ?? NO_CATEGORY,
  );
  const [newCategory, setNewCategory] = useState<string>(startsAsNew ? defaultValues!.category! : "");

  // Snap a hand-typed "new" category to an existing one if it only differs by case or
  // whitespace, so "Sewa" and "sewa " can't silently fork into two separate groups.
  const newCategoryTrimmed = newCategory.trim();
  const matchingExisting = existingCategories.find((c) => c.toLowerCase() === newCategoryTrimmed.toLowerCase());
  const resolvedCategory = categoryChoice === NEW_CATEGORY ? (matchingExisting ?? newCategoryTrimmed) : categoryChoice;

  return (
    <form action={action} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="label" htmlFor="section">Jenis</label>
          <select
            id="section"
            name="section"
            className="select"
            value={section}
            onChange={(e) => {
              const next = e.target.value as AccountSection;
              setSection(next);
              setCategoryChoice(NO_CATEGORY);
              setNewCategory("");
            }}
            required
          >
            {Object.entries(sectionLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="category_choice">Kategori</label>
          <select
            id="category_choice"
            className="select"
            value={categoryChoice}
            onChange={(e) => setCategoryChoice(e.target.value)}
          >
            <option value={NO_CATEGORY}>Tanpa kategori</option>
            {existingCategories.map((c) => <option key={c} value={c}>{c}</option>)}
            <option value={NEW_CATEGORY}>+ Kategori baru…</option>
          </select>
          <input type="hidden" name="category" value={resolvedCategory} />
        </div>

        {categoryChoice === NEW_CATEGORY && (
          <div className="sm:col-span-2">
            <label className="label" htmlFor="new_category">Nama Kategori Baru</label>
            <input
              id="new_category"
              className="input"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="mis. Sewa Alat Berat"
              required
            />
          </div>
        )}

        {section === "opex" && categoryChoice === NO_CATEGORY && (
          <div className="sm:col-span-2 text-[11px]" style={{ color: "var(--neg)" }}>
            Akun Biaya Operasional tanpa kategori tidak akan muncul di Catat Transaksi. Pilih kategori atau buat kategori baru.
          </div>
        )}

        <div>
          <label className="label" htmlFor="code">Kode</label>
          <input id="code" name="code" className="input" defaultValue={defaultValues?.code} placeholder="mis. 6820" required />
        </div>
        <div>
          <label className="label" htmlFor="sign">Tipe Nilai</label>
          <select id="sign" name="sign" className="select" defaultValue={String(defaultValues?.sign ?? 1)}>
            <option value="1">Normal (+)</option>
            <option value="-1">Pengurang (-)</option>
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="label" htmlFor="name">Nama</label>
          <input id="name" name="name" className="input" defaultValue={defaultValues?.name} placeholder="mis. Beban Sewa Laptop" required />
        </div>
      </div>

      <p className="text-[11px]" style={{ color: "var(--muted)" }}>
        Pilih kategori yang sudah ada supaya akun baru otomatis masuk ke grup yang sama saat Catat Transaksi.
      </p>

      {error && (
        <div className="rounded-xl px-3 py-2 text-xs" style={{ background: "var(--neg-soft)", color: "var(--neg)" }}>
          {error}
        </div>
      )}

      <button type="submit" className="btn">{submitLabel}</button>
    </form>
  );
}
