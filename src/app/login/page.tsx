import { Leaf, ShieldCheck } from "lucide-react";
import { login } from "./actions";

export const metadata = { title: "Login — SMB Natura" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; email?: string }>;
}) {
  const params = await searchParams;
  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-6"
      style={{
        background:
          "radial-gradient(ellipse 900px 500px at 100% 0%, rgba(16, 185, 129, 0.14), transparent 60%)," +
          "radial-gradient(ellipse 900px 500px at 0% 100%, rgba(217, 119, 6, 0.08), transparent 60%)," +
          "linear-gradient(180deg, #fafffb 0%, #f0fdf4 100%)",
      }}>

      {/* Decorative leaves */}
      <div className="absolute -top-16 -right-16 w-72 h-72 opacity-[0.06] pointer-events-none">
        <Leaf className="w-full h-full text-brand-700" />
      </div>
      <div className="absolute -bottom-20 -left-20 w-80 h-80 opacity-[0.05] pointer-events-none rotate-45">
        <Leaf className="w-full h-full text-brand-700" />
      </div>

      <div className="w-full max-w-md relative">
        <div className="text-center mb-6">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl grid place-items-center text-white shadow-theme-md"
            style={{ background: "linear-gradient(135deg, var(--color-brand-500), var(--color-brand-700))" }}>
            <Leaf size={26} strokeWidth={2.5} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">SMB Natura</h1>
          <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>
            Dashboard Keuangan · CV Loka Bumi Persada
          </p>
        </div>

        <div className="card p-8 backdrop-blur-sm" style={{ background: "rgba(255, 255, 255, 0.85)" }}>
          <div className="mb-6">
            <h2 className="font-semibold text-gray-900">Masuk ke akun Anda</h2>
            <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>
              Gunakan email & password yang sudah dibuat
            </p>
          </div>

          <form action={login} className="space-y-4">
            <div>
              <label className="label" htmlFor="email">Email</label>
              <input
                className="input"
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="nama@perusahaan.com"
                defaultValue={params.email ?? ""}
              />
            </div>
            <div>
              <label className="label" htmlFor="password">Password</label>
              <input
                className="input"
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                minLength={6}
                placeholder="••••••••"
              />
            </div>
            {params.error && (
              <div className="rounded-xl px-3 py-2 text-xs"
                style={{ background: "var(--neg-soft)", color: "var(--neg)" }}>
                {decodeURIComponent(params.error)}
              </div>
            )}
            <button className="btn w-full" type="submit">Masuk ke Dashboard</button>
          </form>

          <div className="mt-6 pt-5 border-t border-gray-100 flex items-center justify-center gap-2 text-[11px]"
            style={{ color: "var(--muted)" }}>
            <ShieldCheck size={13} />
            <span>Data Anda terlindungi. Session aman via Supabase.</span>
          </div>
        </div>

        <p className="text-center text-[11px] mt-6" style={{ color: "var(--muted)" }}>
          © {new Date().getFullYear()} CV Loka Bumi Persada · Semua hak dilindungi
        </p>
      </div>
    </div>
  );
}
