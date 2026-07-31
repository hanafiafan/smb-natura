-- Arus Kas: a simple cash ledger per brand (separate from the P&L transactions/COA).
-- Mirrors what was previously tracked by hand in a spreadsheet: date, description,
-- an optional free-text note on the source/destination channel and account, and
-- whether it's cash in or out. "Kas Saat Ini" (current balance) is just
-- sum(in) - sum(out), computed on read rather than stored.

create type cash_flow_type as enum ('in', 'out');

create table cash_flow_entries (
  id           uuid primary key default gen_random_uuid(),
  brand_id     int not null references brands(id) on delete cascade,
  entry_date   date not null,
  description  text not null,
  channel      text,
  account_note text,
  type         cash_flow_type not null,
  amount       numeric(18, 2) not null check (amount >= 0),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index cash_flow_entries_brand_idx on cash_flow_entries (brand_id, entry_date desc);

create trigger cash_flow_entries_updated_at before update on cash_flow_entries
  for each row execute function set_updated_at();
