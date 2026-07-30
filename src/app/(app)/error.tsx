"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

export default function Error({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="card p-12 text-center max-w-lg mx-auto mt-10">
      <div
        className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
        style={{ background: "var(--neg-soft)", color: "var(--neg)" }}
      >
        <AlertTriangle size={28} />
      </div>
      <p className="mb-2 text-lg font-semibold">Terjadi kesalahan</p>
      <p className="text-sm mb-6" style={{ color: "var(--muted)" }}>
        Gagal memuat data. Coba lagi, atau hubungi admin bila masalah berlanjut.
      </p>
      <button onClick={() => unstable_retry()} className="btn">Coba Lagi</button>
    </div>
  );
}
