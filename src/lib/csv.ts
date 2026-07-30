/** CSV export helpers tuned for Excel on Indonesian locale (";" list separator, "," decimal). */

const DELIM = ";";

function esc(v: string | number): string {
  const s = String(v);
  return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(rows: (string | number)[][]): string {
  return rows.map((r) => r.map(esc).join(DELIM)).join("\r\n");
}

/** Angka desimal locale ID (koma), tanpa pemisah ribuan — supaya Excel kenali sebagai angka. */
export function numCell(n: number, decimals = 0): string {
  return n.toFixed(decimals).replace(".", ",");
}

const UTF8_BOM = String.fromCharCode(0xfeff);

export function csvResponse(csv: string, filename: string): Response {
  return new Response(UTF8_BOM + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
