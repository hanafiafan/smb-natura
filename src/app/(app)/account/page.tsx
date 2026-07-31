import { CheckCircle2 } from "lucide-react";
import { getSession } from "@/lib/session";
import { changeOwnPassword } from "./actions";

export const metadata = { title: "Akun Saya — SMB Natura" };

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ error?: string; ok?: string }> }) {
  const { error, ok } = await searchParams;
  const session = await getSession();

  return (
    <div className="space-y-4 max-w-lg mx-auto">
      <div>
        <h1 className="text-xl font-bold">Akun Saya</h1>
        <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>{session.email}</p>
      </div>

      <form action={changeOwnPassword} className="card p-5 space-y-4">
        <h2 className="text-sm font-bold">Ganti Password</h2>
        <div>
          <label className="label" htmlFor="current_password">Password Saat Ini</label>
          <input id="current_password" name="current_password" type="password" className="input" required />
        </div>
        <div>
          <label className="label" htmlFor="new_password">Password Baru</label>
          <input id="new_password" name="new_password" type="password" className="input" minLength={6} required />
        </div>
        <div>
          <label className="label" htmlFor="confirm_password">Konfirmasi Password Baru</label>
          <input id="confirm_password" name="confirm_password" type="password" className="input" minLength={6} required />
        </div>
        {ok && (
          <div className="rounded-xl px-4 py-3 text-sm font-medium flex items-center gap-2"
            style={{ color: "var(--pos)", background: "var(--pos-soft)", border: "1px solid var(--color-brand-100)" }}>
            <CheckCircle2 size={16} />
            <span>Password berhasil diganti.</span>
          </div>
        )}
        {error && (
          <div className="rounded-xl px-3 py-2 text-xs" style={{ background: "var(--neg-soft)", color: "var(--neg)" }}>
            {decodeURIComponent(error)}
          </div>
        )}
        <button type="submit" className="btn w-full">Simpan Password Baru</button>
      </form>
    </div>
  );
}
