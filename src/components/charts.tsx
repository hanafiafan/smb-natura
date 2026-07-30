"use client";

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { fmtRp } from "@/lib/format";

const PALETTE = ["#059669", "#0d9488", "#f59e0b", "#10b981", "#14b8a6", "#65a30d", "#84cc16", "#fbbf24", "#d97706", "#22c55e"];

export function CategoryDonut({ data }: { data: { category: string; b: number }[] }) {
  const filtered = data.filter((d) => d.b > 0);
  const total = filtered.reduce((s, d) => s + d.b, 0);
  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={filtered}
          dataKey="b"
          nameKey="category"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={2}
        >
          {filtered.map((_, i) => (
            <Cell key={i} fill={PALETTE[i % PALETTE.length]} stroke="var(--card)" strokeWidth={2} />
          ))}
        </Pie>
        <Tooltip
          formatter={(v, name) => {
            const n = Number(v);
            return [`${fmtRp(n)} (${((n / total) * 100).toFixed(1)}%)`, String(name)];
          }}
          contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8 }}
        />
        <Legend
          layout="vertical" verticalAlign="middle" align="right"
          wrapperStyle={{ fontSize: 12 }}
          formatter={(v) => <span style={{ color: "var(--muted-fg)" }}>{v}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function ComparisonBar({
  data,
  labelA = "Sebelum",
  labelB = "Sekarang",
  horizontal = false,
  height = 300,
}: {
  data: { name: string; a: number; b: number }[];
  labelA?: string;
  labelB?: string;
  horizontal?: boolean;
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout={horizontal ? "vertical" : "horizontal"} margin={{ top: 8, right: 16, bottom: 8, left: horizontal ? 8 : 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        {horizontal ? (
          <>
            <XAxis type="number" tickFormatter={(v) => fmtRp(v)} tick={{ fontSize: 11, fill: "var(--muted)" }} />
            <YAxis type="category" dataKey="name" width={180} tick={{ fontSize: 11, fill: "var(--muted-fg)" }} />
          </>
        ) : (
          <>
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--muted-fg)" }} interval={0} angle={-15} textAnchor="end" height={60} />
            <YAxis tickFormatter={(v) => fmtRp(v)} tick={{ fontSize: 11, fill: "var(--muted)" }} />
          </>
        )}
        <Tooltip
          formatter={(v) => fmtRp(Number(v))}
          contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8 }}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="a" name={labelA} fill="#d1fae5" radius={horizontal ? [0, 6, 6, 0] : [6, 6, 0, 0]} />
        <Bar dataKey="b" name={labelB} fill="#059669" radius={horizontal ? [0, 6, 6, 0] : [6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
