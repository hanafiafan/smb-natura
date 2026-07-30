"use client";

import { useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Building2 } from "lucide-react";
import { switchBrand } from "@/app/(app)/brand-actions";
import type { AccessibleBrand } from "@/lib/brands";

export function BrandFilterCard({
  brands,
  activeBrandId,
}: {
  brands: AccessibleBrand[];
  activeBrandId?: number;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const activeBrand = brands.find((b) => b.id === activeBrandId);
  const companies = Array.from(new Set(brands.map((b) => b.company_name)));
  const [companyName, setCompanyName] = useState(activeBrand?.company_name ?? companies[0]);
  const [brandId, setBrandId] = useState(activeBrandId ?? brands.find((b) => b.company_name === companyName)?.id);
  const brandsInCompany = brands.filter((b) => b.company_name === companyName);

  if (brands.length <= 1) return null;

  function handleCompanyChange(next: string) {
    setCompanyName(next);
    setBrandId(brands.find((b) => b.company_name === next)?.id);
  }

  const qs = searchParams.toString();
  const redirectTo = qs ? `${pathname}?${qs}` : pathname;

  return (
    <form action={switchBrand} className="card p-5 no-print">
      <input type="hidden" name="redirect_to" value={redirectTo} />
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg grid place-items-center text-brand-600" style={{ background: "var(--color-brand-50)" }}>
          <Building2 size={16} />
        </div>
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Perusahaan & Brand</div>
          <div className="text-[13px] text-gray-800 font-medium">Pilih data yang ingin dilihat</div>
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="label" htmlFor="company_name">Perusahaan</label>
          <select
            id="company_name"
            className="select"
            value={companyName}
            onChange={(e) => handleCompanyChange(e.target.value)}
          >
            {companies.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="brand_id">Brand</label>
          <select
            id="brand_id"
            name="brand_id"
            className="select"
            value={brandId}
            onChange={(e) => setBrandId(Number(e.target.value))}
          >
            {brandsInCompany.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
        <button type="submit" className="btn">Tampilkan</button>
      </div>
    </form>
  );
}
