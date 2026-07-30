"use client";

export function PrintButton() {
  return (
    <button className="btn-outline" type="button" onClick={() => window.print()}>
      Print / Export PDF
    </button>
  );
}
