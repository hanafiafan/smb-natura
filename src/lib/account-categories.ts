import type { Account, AccountSection } from "@/lib/database.types";

/** Distinct categories already in use per section, ordered by sort_order — lets the
 * Master Data form offer a dropdown of real categories instead of free text, so a typo
 * (or a stray space) can't silently fork the grouping used in Catat Transaksi. */
export function categoriesBySection(accounts: Account[]): Record<AccountSection, string[]> {
  const order = new Map<AccountSection, Map<string, number>>();
  for (const a of accounts) {
    if (!a.category) continue;
    if (!order.has(a.section)) order.set(a.section, new Map());
    const perSection = order.get(a.section)!;
    if (!perSection.has(a.category)) perSection.set(a.category, a.sort_order);
  }

  const bySection = {} as Record<AccountSection, string[]>;
  for (const [section, categories] of order) {
    bySection[section] = [...categories.keys()].sort((x, y) => categories.get(x)! - categories.get(y)!);
  }
  return bySection;
}
