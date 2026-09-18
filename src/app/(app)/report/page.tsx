import { FileSpreadsheet, Layers, Building2 } from "lucide-react";
import Link from "next/link";
import { getSession } from "@/lib/session";
import { getAccessibleBrands } from "@/lib/brands";
import { loadCombinedPnL, type PnLResult, type PnLRow } from "@/lib/pnl";
import { parseISODateLocal, variance } from "@/lib/format";
import { PrintButton } from "@/components/print-button";
import { FilterBar } from "@/components/filter-bar";
import { computePeriods, type PeriodMode } from "@/lib/period";

export const metadata = { title: "Laporan Laba/Rugi — SMB Natura" };

/** Format IDR seperti PDF: `2.922.802.315,` atau `674.680.305,47` (Indonesian, trailing comma when integer) */
function fmtIdrPdf(n: number): string {
  if (!isFinite(n) || Math.abs(n) < 0.005) return "0,";
  const abs = Math.abs(n);
  const rounded = Math.round(abs);
  const hasCents = Math.abs(abs - rounded) > 0.005;
  const formatted = hasCents
    ? abs.toLocaleString("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : abs.toLocaleString("id-ID") + ",";
  return n < 0 ? `-${formatted}` : formatted;
}

/** Format persentase seperti PDF: `100 %`, `-4,86 %`, `5,3 %` */
function fmtPctPdf(p: number): string {
  if (!isFinite(p) || Math.abs(p) < 0.005) return "0 %";
  const s = p.toLocaleString("id-ID", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  return `${s} %`;
}

/** Format tanggal untuk header PDF: `01 Apr 2026 - 30 Apr 2026` */
function fmtDateRangePdf(p: { start: string; end: string }): string {
  const fmt = (iso: string) => parseISODateLocal(iso).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
  return `${fmt(p.start)} - ${fmt(p.end)}`;
}

/** Format singkat untuk header kolom: `1 - 30 Apr 2026`, atau `1 Apr 2026` untuk rentang satu hari */
function fmtColHeader(p: { start: string; end: string }): string {
  const d0 = parseISODateLocal(p.start);
  const d1 = parseISODateLocal(p.end);
  if (d0.getTime() === d1.getTime()) {
    return d1.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
  }
  const monthYear = d1.toLocaleDateString("id-ID", { month: "short", year: "numeric" });
  if (d0.getMonth() === d1.getMonth() && d0.getFullYear() === d1.getFullYear()) {
    return `${d0.getDate()} - ${d1.getDate()} ${monthYear}`;
  }
  return fmtDateRangePdf(p);
}

export default async function ReportPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string; start?: string; end?: string; brand?: string }>;
}) {
  const sp = await searchParams;
  const mode = (sp.mode ?? "monthly") as PeriodMode;
  const { periodA, periodB, summary } = computePeriods(mode, sp.start, sp.end);

  const session = await getSession();
  const brandId = session.activeBrandId!;
  const brands = await getAccessibleBrands(session.userId!, session.role!);

  const allBrands = sp.brand === "all" && brands.length > 1;
  // The app layout already refuses to render children when activeBrandId isn't in
  // this list, so the lookup always resolves here.
  const shown = allBrands ? brands : brands.filter((b) => b.id === brandId);

  // Semua Brand = satu laporan gabungan (angka 5 brand dijumlahkan), bukan per brand.
  const pnl = await loadCombinedPnL(shown.map((b) => b.id), periodA, periodB);
  const companies = Array.from(new Set(shown.map((b) => b.company_name)));
  const companyLabel = companies.length === 1 ? companies[0] : `${companies.length} Perusahaan`;
  const brandLabel = allBrands
    ? `Gabungan ${shown.length} Brand (${shown.map((b) => b.name).join(", ")})`
    : shown[0].name;

  const colA = fmtColHeader(periodA);
  const colB = fmtColHeader(periodB);
  const rangeText = `${fmtDateRangePdf(periodA)} dan ${fmtDateRangePdf(periodB)}`;

  const qs = new URLSearchParams({ mode, start: sp.start ?? periodB.start, end: sp.end ?? periodB.end });
  if (allBrands) qs.set("brand", "all");

  return (
    <div className="space-y-6">
      {/* Screen header (hidden in print) */}
      <div className="no-print">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-xl font-bold">Laporan Laba/Rugi</h1>
            <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
              {allBrands
                ? `Total gabungan ${shown.length} brand`
                : `${companyLabel} — ${brandLabel}`} · {summary}
            </p>
          </div>
          <div className="flex gap-2">
            {brands.length > 1 && (
              <Link
                href={`/report?mode=${mode}&start=${sp.start ?? periodB.start}&end=${sp.end ?? periodB.end}${allBrands ? "" : "&brand=all"}`}
                className="btn-outline"
              >
                {allBrands ? <><Building2 size={16} /> Brand Aktif Saja</> : <><Layers size={16} /> Gabungan Semua Brand</>}
              </Link>
            )}
            <a href={`/report/export?${qs}`} className="btn-outline">
              <FileSpreadsheet size={16} /> Export Excel
            </a>
            <PrintButton />
          </div>
        </div>
      </div>

      <FilterBar brands={brands} activeBrandId={brandId} />

      <ReportSheet
        companyLabel={companyLabel}
        brandLabel={brandLabel}
        pnl={pnl}
        colA={colA}
        colB={colB}
        rangeText={rangeText}
      />
    </div>
  );
}

function ReportSheet({
  companyLabel,
  brandLabel,
  pnl,
  colA,
  colB,
  rangeText,
}: {
  companyLabel: string;
  brandLabel: string;
  pnl: PnLResult;
  colA: string;
  colB: string;
  rangeText: string;
}) {
  const omsetA = pnl.totals.netRevenue[0];
  const omsetB = pnl.totals.netRevenue[1];

  return (
    <div className="report-sheet card p-8 print:p-0 print:border-0 print:shadow-none">
      {/* Header block matching PDF */}
      <div className="report-header mb-5 pb-4" style={{ borderBottom: "2px solid var(--color-gray-800)" }}>
        <div className="text-[15px] font-bold text-gray-900">{companyLabel}</div>
        <div className="text-[14px] text-gray-800 mt-0.5">Laporan Laba / Rugi — {brandLabel}</div>
        <div className="text-[12px] text-gray-700 mt-1">Tanggal {rangeText}</div>
        <div className="text-[12px] text-gray-700 mt-0.5">Mata Uang : Indonesian Rupiah</div>
      </div>

      <div className="overflow-x-auto">
        <table className="pnl-print w-full">
          <thead>
            <tr>
              <th className="text-left">Deskripsi</th>
              <th>{colA}</th>
              <th>% dari Omset {colA}</th>
              <th>{colB}</th>
              <th>% dari Omset {colB}</th>
              <th>% Var.</th>
            </tr>
          </thead>
          <tbody>
            {pnl.rows.map((r, i) => renderRow(r, i, omsetA, omsetB))}
          </tbody>
        </table>
      </div>

      {/* Catatan */}
      <div className="mt-6 pt-4 text-[11px] text-gray-700 leading-relaxed" style={{ borderTop: "1px solid var(--color-gray-300)" }}>
        <div className="font-bold text-gray-900 mb-1">Catatan:</div>
        <p>
          Laporan ini mencerminkan transaksi pendapatan dan beban operasional sesuai kebijakan tutup buku internal.
        </p>
        <p className="mt-1">
          Data diambil dari sistem SMB Natura pada {new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}.
        </p>
        <p className="mt-1">
          Nilai dalam Rupiah (IDR). Tanda minus (−) menunjukkan pengurangan omset (retur/diskon) atau saldo negatif.
        </p>
      </div>
    </div>
  );
}

function renderRow(r: PnLRow, i: number, omsetA: number, omsetB: number) {
  if (r.kind === "section") {
    if (r.total) {
      return (
        <tr key={i} className="row-total">
          <td>{r.label}</td>
          <td>{fmtIdrPdf(r.a)}</td>
          <td>{pctCell(r.a, omsetA)}</td>
          <td>{fmtIdrPdf(r.b)}</td>
          <td>{pctCell(r.b, omsetB)}</td>
          <td>{varCell(r.a, r.b)}</td>
        </tr>
      );
    }
    return <tr key={i} className="row-section"><td colSpan={6}>{r.label}</td></tr>;
  }
  if (r.kind === "category") {
    return (
      <tr key={i} className="row-category">
        <td>{r.label}</td>
        <td>{fmtIdrPdf(r.a)}</td>
        <td>{pctCell(r.a, omsetA)}</td>
        <td>{fmtIdrPdf(r.b)}</td>
        <td>{pctCell(r.b, omsetB)}</td>
        <td>{varCell(r.a, r.b)}</td>
      </tr>
    );
  }
  if (r.kind === "subtotal") {
    return (
      <tr key={i} className="row-subtotal">
        <td>{r.label}</td>
        <td>{fmtIdrPdf(r.a)}</td>
        <td>{pctCell(r.a, omsetA)}</td>
        <td>{fmtIdrPdf(r.b)}</td>
        <td>{pctCell(r.b, omsetB)}</td>
        <td>{varCell(r.a, r.b)}</td>
      </tr>
    );
  }
  return (
    <tr key={i} className="row-item">
      <td>{r.account.name}</td>
      <td>{fmtIdrPdf(r.a)}</td>
      <td>{pctCell(r.a, omsetA)}</td>
      <td>{fmtIdrPdf(r.b)}</td>
      <td>{pctCell(r.b, omsetB)}</td>
      <td>{varCell(r.a, r.b)}</td>
    </tr>
  );
}

function pctCell(v: number, denom: number) {
  if (!denom) return "0 %";
  return fmtPctPdf((v / denom) * 100);
}
function varCell(a: number, b: number) {
  const v = variance(a, b);
  return fmtPctPdf(v);
}
