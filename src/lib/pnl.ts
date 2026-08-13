import type { Account, AccountSection } from "@/lib/database.types";

export type AccountAgg = { account_id: number; a: number; b: number };

export type PnLRow =
  | { kind: "section"; label: string; a: number; b: number; total: boolean }
  | { kind: "category"; label: string; a: number; b: number }
  | { kind: "item"; account: Account; a: number; b: number }
  | { kind: "subtotal"; label: string; a: number; b: number };

export type PnLResult = {
  rows: PnLRow[];
  totals: {
    grossRevenue: [number, number];    // Penjualan saja (sign +1)
    netRevenue: [number, number];      // Pendapatan Operasional
    cogs: [number, number];
    grossProfit: [number, number];
    opex: [number, number];
    opIncome: [number, number];
    nonOpNet: [number, number];
    preTax: [number, number];
    tax: [number, number];
    netIncome: [number, number];
    opexByCategory: { category: string; a: number; b: number }[];
  };
};

/** Accounts to feed into buildPnL: keep every active account (even with no activity
 * this period) plus any inactive account that actually has aggregated activity — so
 * deactivating an account doesn't retroactively shrink past periods' totals, while
 * still keeping reports free of long-dead accounts that never touched this period. */
export function relevantAccounts(accounts: Account[], aggs: AccountAgg[]): Account[] {
  const activeAggIds = new Set(aggs.map((g) => g.account_id));
  return accounts.filter((a) => a.is_active || activeAggIds.has(a.id));
}

function sectionSum(
  accounts: Account[],
  aggMap: Map<number, AccountAgg>,
  section: AccountSection,
): [number, number] {
  let a = 0, b = 0;
  for (const acc of accounts) {
    if (acc.section !== section) continue;
    const agg = aggMap.get(acc.id);
    if (!agg) continue;
    a += Number(agg.a) * acc.sign;
    b += Number(agg.b) * acc.sign;
  }
  return [a, b];
}

export function buildPnL(accounts: Account[], aggs: AccountAgg[]): PnLResult {
  const aggMap = new Map<number, AccountAgg>();
  for (const a of aggs) aggMap.set(a.account_id, { account_id: a.account_id, a: Number(a.a), b: Number(a.b) });

  const sorted = [...accounts].sort((x, y) => x.sort_order - y.sort_order);
  const rows: PnLRow[] = [];

  // ===== REVENUE =====
  const netRevenue = sectionSum(accounts, aggMap, "revenue");
  rows.push({ kind: "section", label: "PENDAPATAN", a: 0, b: 0, total: false });
  rows.push({ kind: "category", label: "Pendapatan Operasional", a: netRevenue[0], b: netRevenue[1] });
  for (const acc of sorted.filter((a) => a.section === "revenue")) {
    const agg = aggMap.get(acc.id) ?? { account_id: acc.id, a: 0, b: 0 };
    rows.push({ kind: "item", account: acc, a: agg.a * acc.sign, b: agg.b * acc.sign });
  }
  rows.push({ kind: "subtotal", label: "Jumlah Pendapatan", a: netRevenue[0], b: netRevenue[1] });

  // ===== COGS =====
  const cogs = sectionSum(accounts, aggMap, "cogs");
  rows.push({ kind: "section", label: "BEBAN POKOK PENJUALAN", a: 0, b: 0, total: false });
  rows.push({ kind: "category", label: "Beban Pokok Penjualan", a: cogs[0], b: cogs[1] });
  for (const acc of sorted.filter((a) => a.section === "cogs")) {
    const agg = aggMap.get(acc.id) ?? { account_id: acc.id, a: 0, b: 0 };
    rows.push({ kind: "item", account: acc, a: agg.a * acc.sign, b: agg.b * acc.sign });
  }
  rows.push({ kind: "subtotal", label: "Jumlah Beban Pokok Penjualan", a: cogs[0], b: cogs[1] });

  // ===== GROSS PROFIT =====
  const grossProfit: [number, number] = [netRevenue[0] - cogs[0], netRevenue[1] - cogs[1]];
  rows.push({ kind: "section", label: "LABA KOTOR", a: grossProfit[0], b: grossProfit[1], total: true });

  // ===== OPEX (grouped by category) =====
  rows.push({ kind: "section", label: "BEBAN OPERASIONAL", a: 0, b: 0, total: false });
  const opexAccounts = sorted.filter((a) => a.section === "opex");
  const categories: string[] = [];
  const seen = new Set<string>();
  for (const a of opexAccounts) {
    const c = a.category ?? "Lainnya";
    if (!seen.has(c)) { seen.add(c); categories.push(c); }
  }
  const opexByCategory: { category: string; a: number; b: number }[] = [];
  for (const cat of categories) {
    const catAccounts = opexAccounts.filter((a) => (a.category ?? "Lainnya") === cat);
    let catA = 0, catB = 0;
    for (const acc of catAccounts) {
      const agg = aggMap.get(acc.id);
      if (!agg) continue;
      catA += agg.a * acc.sign;
      catB += agg.b * acc.sign;
    }
    rows.push({ kind: "category", label: `Biaya ${cat}`, a: catA, b: catB });
    for (const acc of catAccounts) {
      const agg = aggMap.get(acc.id) ?? { account_id: acc.id, a: 0, b: 0 };
      rows.push({ kind: "item", account: acc, a: agg.a * acc.sign, b: agg.b * acc.sign });
    }
    opexByCategory.push({ category: cat, a: catA, b: catB });
  }
  const opex = sectionSum(accounts, aggMap, "opex");
  rows.push({ kind: "subtotal", label: "Jumlah Beban Operasional", a: opex[0], b: opex[1] });

  // ===== OP INCOME =====
  const opIncome: [number, number] = [grossProfit[0] - opex[0], grossProfit[1] - opex[1]];
  rows.push({ kind: "section", label: "PENDAPATAN OPERASIONAL", a: opIncome[0], b: opIncome[1], total: true });

  // ===== NON-OP =====
  rows.push({ kind: "section", label: "PENDAPATAN & BEBAN NON OPERASIONAL", a: 0, b: 0, total: false });
  for (const acc of sorted.filter((a) => a.section === "non_op_income" || a.section === "non_op_expense")) {
    const agg = aggMap.get(acc.id) ?? { account_id: acc.id, a: 0, b: 0 };
    const mult = acc.section === "non_op_expense" ? -acc.sign : acc.sign;
    rows.push({ kind: "item", account: acc, a: agg.a * mult, b: agg.b * mult });
  }
  const nonOpIn = sectionSum(accounts, aggMap, "non_op_income");
  const nonOpEx = sectionSum(accounts, aggMap, "non_op_expense");
  const nonOpNet: [number, number] = [nonOpIn[0] - nonOpEx[0], nonOpIn[1] - nonOpEx[1]];
  rows.push({ kind: "subtotal", label: "Jumlah Pendapatan & Beban Non Operasional", a: nonOpNet[0], b: nonOpNet[1] });

  // ===== PRE-TAX / TAX / NET =====
  const preTax: [number, number] = [opIncome[0] + nonOpNet[0], opIncome[1] + nonOpNet[1]];
  rows.push({ kind: "section", label: "LABA BERSIH (Sebelum Pajak)", a: preTax[0], b: preTax[1], total: true });
  const tax = sectionSum(accounts, aggMap, "tax");
  for (const acc of sorted.filter((a) => a.section === "tax")) {
    const agg = aggMap.get(acc.id) ?? { account_id: acc.id, a: 0, b: 0 };
    rows.push({ kind: "item", account: acc, a: agg.a * acc.sign, b: agg.b * acc.sign });
  }
  const netIncome: [number, number] = [preTax[0] - tax[0], preTax[1] - tax[1]];
  rows.push({ kind: "section", label: "LABA BERSIH (Setelah Pajak)", a: netIncome[0], b: netIncome[1], total: true });

  // Gross revenue = Penjualan only (sign +1 revenue accounts, biasanya code 4100)
  let grossRevA = 0, grossRevB = 0;
  for (const acc of accounts) {
    if (acc.section === "revenue" && acc.sign === 1) {
      const agg = aggMap.get(acc.id);
      if (agg) { grossRevA += agg.a; grossRevB += agg.b; }
    }
  }

  return {
    rows,
    totals: {
      grossRevenue: [grossRevA, grossRevB],
      netRevenue,
      cogs,
      grossProfit,
      opex,
      opIncome,
      nonOpNet,
      preTax,
      tax,
      netIncome,
      opexByCategory,
    },
  };
}

/**
 * Query dua periode dalam satu round-trip: ambil semua transaksi di [min(startA,startB), max(endA,endB)],
 * group di JS. Ponytail: hindari SQL function extra, JS agregasi cukup buat volume owner tunggal.
 */
export function aggregate(
  txns: { account_id: number; txn_date: string; amount: number }[],
  periodA: { start: string; end: string },
  periodB: { start: string; end: string },
): AccountAgg[] {
  const map = new Map<number, AccountAgg>();
  for (const t of txns) {
    const inA = t.txn_date >= periodA.start && t.txn_date <= periodA.end;
    const inB = t.txn_date >= periodB.start && t.txn_date <= periodB.end;
    if (!inA && !inB) continue;
    const cur = map.get(t.account_id) ?? { account_id: t.account_id, a: 0, b: 0 };
    if (inA) cur.a += Number(t.amount);
    if (inB) cur.b += Number(t.amount);
    map.set(t.account_id, cur);
  }
  return Array.from(map.values());
}
