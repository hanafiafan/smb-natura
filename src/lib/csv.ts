/** CSV export helpers tuned for Excel on Indonesian locale (";" list separator, "," decimal). */

const DELIM = ";";

function esc(v: string | number): string {
  const s = String(v);
  return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

// Formula-injection guard for untrusted free text (account/category names, descriptions,
// channels — anything a brand admin typed) — NOT for pre-formatted numeric strings like
// numCell()'s output, where a leading "-" is a legitimate negative number and must stay
// parseable by Excel. A cell starting with =, +, -, or @ otherwise runs as a live formula
// when opened in Excel/Sheets; prefixing with a tab neutralizes it invisibly.
export function csvText(v: string | null | undefined): string {
  const s = v ?? "";
  return /^[=+\-@]/.test(s) ? `\t${s}` : s;
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
