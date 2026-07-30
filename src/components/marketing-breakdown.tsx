"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { fmtRp, fmtRpFull } from "@/lib/format";

const CHANNEL_COLORS: Record<string, string> = {
  "TikTok": "#000000",
  "Shopee": "#EE4D2D",
  "Meta": "#0866FF",
  "Branding": "#8b5cf6",
  "Lainnya": "#94a3b8",
};

function detectChannel(label: string): string {
  const l = label.toLowerCase();
  if (l.includes("tiktok")) return "TikTok";
  if (l.includes("shopee")) return "Shopee";
  if (l.includes("meta")) return "Meta";
  if (l.includes("branding")) return "Branding";
  return "Lainnya";
}

export function MarketingBreakdown({
  items,
}: {
  items: { label: string; b: number }[];
}) {
  const byChannel = new Map<string, { channel: string; value: number; items: { label: string; b: number }[] }>();
  for (const it of items) {
    const ch = detectChannel(it.label);
    const cur = byChannel.get(ch) ?? { channel: ch, value: 0, items: [] };
    cur.value += it.b;
    cur.items.push(it);
    byChannel.set(ch, cur);
  }
  const data = Array.from(byChannel.values())
    .filter((c) => c.value > 0)
    .sort((a, b) => b.value - a.value);
  const total = data.reduce((s, c) => s + c.value, 0);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="channel"
              innerRadius={50}
              outerRadius={90}
              paddingAngle={3}
            >
              {data.map((d, i) => (
                <Cell key={i} fill={CHANNEL_COLORS[d.channel] ?? "#94a3b8"} stroke="var(--card)" strokeWidth={2} />
              ))}
            </Pie>
            <Tooltip
              formatter={(v) => fmtRp(Number(v))}
              contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
            />
            <Legend
              layout="vertical" verticalAlign="middle" align="right"
              wrapperStyle={{ fontSize: 12 }}
              formatter={(v) => <span style={{ color: "var(--muted-fg)" }}>{v}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="space-y-2">
        {data.map((c) => {
          const pct = total > 0 ? (c.value / total) * 100 : 0;
          const color = CHANNEL_COLORS[c.channel] ?? "#94a3b8";
          return (
            <div key={c.channel} className="rounded-lg p-3" style={{ background: "var(--sub)" }}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-sm" style={{ background: color }} />
                  <span className="font-semibold text-sm">{c.channel}</span>
                </div>
                <span className="text-sm font-bold" style={{ color }}>{fmtRpFull(c.value)}</span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--card)" }}>
                <div className="h-full transition-all" style={{ width: `${pct}%`, background: color }} />
              </div>
              <div className="text-[11px] mt-1 flex justify-between" style={{ color: "var(--muted)" }}>
                <span>{pct.toFixed(1)}% dari total iklan</span>
                <span>{c.items.length} akun</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
