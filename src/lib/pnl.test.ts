import { describe, it, expect } from "vitest";
import { aggregate, buildPnL, mergeByCode, relevantAccounts, type AccountAgg } from "@/lib/pnl";
import type { Account, AccountSection } from "@/lib/database.types";

let nextId = 1;
function acc(section: AccountSection, name: string, opts: Partial<Account> = {}): Account {
  const id = opts.id ?? nextId++;
  return {
    id,
    brand_id: 1,
    code: String(4000 + id),
    name,
    section,
    category: null,
    sign: 1,
    sort_order: id,
    is_active: true,
    created_at: "2026-01-01",
    ...opts,
  };
}

/** A miniature but complete COA: every section, a negative-sign revenue contra account
 * (retur), and two opex categories — enough to pin down each total in buildPnL. */
function fixture() {
  const penjualan = acc("revenue", "Penjualan");
  const retur = acc("revenue", "Retur Penjualan", { sign: -1 });
  const bahan = acc("cogs", "Bahan Baku");
  const gaji = acc("opex", "Gaji", { category: "Karyawan" });
  const iklan = acc("opex", "Iklan", { category: "Marketing" });
  const bunga = acc("non_op_income", "Bunga Bank");
  const adminBank = acc("non_op_expense", "Admin Bank");
  const pph = acc("tax", "PPh Final");
  const accounts = [penjualan, retur, bahan, gaji, iklan, bunga, adminBank, pph];

  const aggs: AccountAgg[] = [
    { account_id: penjualan.id, a: 1000, b: 2000 },
    { account_id: retur.id, a: 100, b: 200 },
    { account_id: bahan.id, a: 400, b: 800 },
    { account_id: gaji.id, a: 150, b: 300 },
    { account_id: iklan.id, a: 50, b: 100 },
    { account_id: bunga.id, a: 10, b: 20 },
    { account_id: adminBank.id, a: 5, b: 10 },
    { account_id: pph.id, a: 20, b: 40 },
  ];
  return { accounts, aggs, ids: { penjualan, retur, bahan, gaji, iklan, pph } };
}

describe("buildPnL totals", () => {
  const { accounts, aggs } = fixture();
  const { totals } = buildPnL(accounts, aggs);

  it("nets contra-revenue out of omset but keeps it out of gross revenue", () => {
    expect(totals.netRevenue).toEqual([900, 1800]); // 1000 - 100, 2000 - 200
    expect(totals.grossRevenue).toEqual([1000, 2000]); // sign +1 revenue only
  });

  it("walks omset down to laba bersih", () => {
    expect(totals.cogs).toEqual([400, 800]);
    expect(totals.grossProfit).toEqual([500, 1000]);
    expect(totals.opex).toEqual([200, 400]);
    expect(totals.opIncome).toEqual([300, 600]);
    expect(totals.nonOpNet).toEqual([5, 10]); // 10 - 5, 20 - 10
    expect(totals.preTax).toEqual([305, 610]);
    expect(totals.tax).toEqual([20, 40]);
    expect(totals.netIncome).toEqual([285, 570]);
  });

  it("groups opex by category, preserving sort order", () => {
    expect(totals.opexByCategory).toEqual([
      { category: "Karyawan", a: 150, b: 300 },
      { category: "Marketing", a: 50, b: 100 },
    ]);
  });

  it("renders non-operational expenses as negative line items", () => {
    const admin = buildPnL(accounts, aggs).rows.find(
      (r) => r.kind === "item" && r.account.name === "Admin Bank",
    );
    expect(admin).toMatchObject({ a: -5, b: -10 });
  });
});

describe("buildPnL edge cases", () => {
  it("returns all-zero totals for a brand with no activity", () => {
    const { accounts } = fixture();
    const { totals } = buildPnL(accounts, []);
    expect(totals.netRevenue).toEqual([0, 0]);
    expect(totals.netIncome).toEqual([0, 0]);
  });

  it("reports a loss when beban exceeds omset", () => {
    const penjualan = acc("revenue", "Penjualan");
    const gaji = acc("opex", "Gaji", { category: "Karyawan" });
    const { totals } = buildPnL(
      [penjualan, gaji],
      [{ account_id: penjualan.id, a: 0, b: 100 }, { account_id: gaji.id, a: 0, b: 250 }],
    );
    expect(totals.netIncome).toEqual([0, -150]);
  });

  it("ignores aggregates for accounts outside the given chart", () => {
    const penjualan = acc("revenue", "Penjualan");
    const { totals } = buildPnL(
      [penjualan],
      [{ account_id: penjualan.id, a: 0, b: 100 }, { account_id: 9999, a: 0, b: 500 }],
    );
    expect(totals.netRevenue).toEqual([0, 100]);
  });
});

describe("relevantAccounts", () => {
  it("keeps inactive accounts that still have activity this period", () => {
    const live = acc("revenue", "Penjualan");
    const retired = acc("opex", "Sewa Lama", { is_active: false });
    const untouched = acc("opex", "Sewa Kuno", { is_active: false });
    const kept = relevantAccounts([live, retired, untouched], [{ account_id: retired.id, a: 0, b: 50 }]);
    expect(kept.map((a) => a.name)).toEqual(["Penjualan", "Sewa Lama"]);
  });
});

describe("aggregate", () => {
  const periodA = { start: "2026-03-01", end: "2026-03-31" };
  const periodB = { start: "2026-04-01", end: "2026-04-30" };

  it("buckets each transaction into the period it falls in, inclusive of both bounds", () => {
    const [row] = aggregate(
      [
        { account_id: 1, txn_date: "2026-03-01", amount: 10 },
        { account_id: 1, txn_date: "2026-03-31", amount: 5 },
        { account_id: 1, txn_date: "2026-04-15", amount: 100 },
        { account_id: 1, txn_date: "2026-05-01", amount: 999 }, // outside both
      ],
      periodA,
      periodB,
    );
    expect(row).toEqual({ account_id: 1, a: 15, b: 100 });
  });

  it("counts a transaction in both columns when the periods overlap", () => {
    const overlapping = { start: "2026-03-15", end: "2026-04-15" };
    const [row] = aggregate([{ account_id: 1, txn_date: "2026-03-20", amount: 7 }], periodA, overlapping);
    expect(row).toEqual({ account_id: 1, a: 7, b: 7 });
  });

  it("coerces string amounts from the driver into numbers", () => {
    const [row] = aggregate(
      [{ account_id: 1, txn_date: "2026-04-02", amount: "1500" as unknown as number }],
      periodA,
      periodB,
    );
    expect(row.b).toBe(1500);
  });
});

describe("mergeByCode (laporan gabungan)", () => {
  it("sums the same account code across brands into one row", () => {
    const b1 = acc("revenue", "Penjualan", { id: 101, brand_id: 1, code: "4100" });
    const b2 = acc("revenue", "Penjualan", { id: 201, brand_id: 2, code: "4100" });
    const onlyB2 = acc("cogs", "Bahan Baku", { id: 202, brand_id: 2, code: "5100" });
    const dead1 = acc("opex", "Iklan", { id: 103, brand_id: 1, code: "6100", is_active: false });
    const live2 = acc("opex", "Iklan", { id: 203, brand_id: 2, code: "6100" });

    const merged = mergeByCode([b1, b2, onlyB2, dead1, live2], [
      { account_id: 101, a: 1000, b: 2000 },
      { account_id: 201, a: 500, b: 700 },
      { account_id: 202, a: 300, b: 400 },
      { account_id: 203, a: 50, b: 60 },
    ]);

    expect(merged.accounts.map((a) => a.code)).toEqual(["4100", "5100", "6100"]);
    expect(merged.aggs).toEqual([
      { account_id: 101, a: 1500, b: 2700 }, // 1000+500, 2000+700
      { account_id: 202, a: 300, b: 400 },
      { account_id: 103, a: 50, b: 60 },
    ]);
    // inactive in brand 1 but active in brand 2 → kept as active
    expect(merged.accounts.find((a) => a.code === "6100")!.is_active).toBe(true);

    const { totals } = buildPnL(merged.accounts, merged.aggs);
    expect(totals.netRevenue).toEqual([1500, 2700]);
    expect(totals.cogs).toEqual([300, 400]);
    expect(totals.netIncome).toEqual([1150, 2240]); // 1500-300-50, 2700-400-60
  });
});
