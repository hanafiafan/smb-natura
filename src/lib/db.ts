import postgres from "postgres";

declare global {
  var __sql: ReturnType<typeof postgres> | undefined;
}

// Reuse the connection pool across dev hot-reloads instead of leaking one per reload.
export const sql = globalThis.__sql ?? postgres(process.env.DATABASE_URL!, {
  max: 10,
  types: {
    // Keep `date` columns as plain "YYYY-MM-DD" strings — the app compares
    // and buckets txn_date as a string throughout (aggregate(), filters, fmtDate()).
    date: { to: 1082, from: [1082], serialize: (x: string) => x, parse: (x: string) => x },
  },
});

if (process.env.NODE_ENV !== "production") globalThis.__sql = sql;
