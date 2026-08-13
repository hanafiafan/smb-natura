import { BrandFilterCard } from "@/components/brand-filter";
import { PeriodPicker } from "@/components/period-picker";
import type { AccessibleBrand } from "@/lib/brands";
import { cn } from "@/lib/utils";

/** Merges the Perusahaan/Brand filter and the Rentang Periode picker into one card
 * instead of two stacked ones. BrandFilterCard hides itself for single-brand users,
 * so the period picker takes the full width in that case. */
export function FilterBar({ brands, activeBrandId }: { brands: AccessibleBrand[]; activeBrandId?: number }) {
  const showBrandFilter = brands.length > 1;

  return (
    <div className="card p-5 no-print">
      <div className={cn("grid gap-6", showBrandFilter && "grid-cols-1 lg:grid-cols-2 lg:divide-x lg:divide-gray-200")}>
        {showBrandFilter && (
          <div className="lg:pr-6">
            <BrandFilterCard brands={brands} activeBrandId={activeBrandId} bare />
          </div>
        )}
        <div className={showBrandFilter ? "lg:pl-6" : undefined}>
          <PeriodPicker bare />
        </div>
      </div>
    </div>
  );
}
