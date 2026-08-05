import fs from 'fs';
import postgres from 'postgres';

const DATABASE_URL = process.env.DATABASE_URL || 'postgres://afan@localhost:5432/smb_natura_test';
const sql = postgres(DATABASE_URL);

interface CashEntry {
  date: string;
  description: string;
  channel: string | null;
  account: string | null;
  type: 'in' | 'out';
  amount: number;
}

async function migrate() {
  const jsonPath = '/tmp/excel_cashflow_data.json';
  if (!fs.existsSync(jsonPath)) {
    throw new Error(`Data file not found at ${jsonPath}`);
  }

  const rawData = fs.readFileSync(jsonPath, 'utf-8');
  const allData: Record<string, CashEntry[]> = JSON.parse(rawData);

  // Get or create company
  let [company] = await sql`select id from companies limit 1`;
  if (!company) {
    [company] = await sql`insert into companies (name) values ('CV Loka Bumi Persada') returning id`;
  }

  for (const [brandName, entries] of Object.entries(allData)) {
    // Get or create brand
    let [brand] = await sql`select id from brands where lower(name) = lower(${brandName})`;
    if (!brand) {
      [brand] = await sql`insert into brands (company_id, name, is_active) values (${company.id}, ${brandName}, true) returning id`;
    }
    const brandId = brand.id;

    console.log(`Processing brand "${brandName}" (ID: ${brandId})...`);

    // Clean existing cash flow entries
    await sql`delete from cash_flow_entries where brand_id = ${brandId}`;

    let inserted = 0;
    for (const e of entries) {
      await sql`
        insert into cash_flow_entries (
          brand_id, entry_date, description, channel, type, amount
        ) values (
          ${brandId}, ${e.date}, ${e.description}, ${e.channel}, ${e.type}, ${e.amount}
        )
      `;
      inserted++;
    }

    // Verify balances
    const [{ period_bal }] = await sql`
      select coalesce(sum(case when type = 'in' then amount else -amount end), 0)::float as period_bal
      from cash_flow_entries
      where brand_id = ${brandId} and entry_date <= '2026-07-31'
    `;
    const [{ total_bal }] = await sql`
      select coalesce(sum(case when type = 'in' then amount else -amount end), 0)::float as total_bal
      from cash_flow_entries
      where brand_id = ${brandId}
    `;

    console.log(`  ✓ Inserted ${inserted} entries.`);
    console.log(`  ✓ Balance per 31 July 2026: ${Number(period_bal).toLocaleString('id-ID')}`);
    console.log(`  ✓ Balance All-Time (Aug 2026): ${Number(total_bal).toLocaleString('id-ID')}\n`);
  }

  await sql.end();
  console.log('Migration completed successfully!');
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
