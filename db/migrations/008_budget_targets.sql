-- Anggaran: per-account budget target per period, compared against actual transactions
-- (Target vs Realisasi) — mirrors the "LABA-RUGI" forecast sheet's Target/Realisasi columns.

create table budget_targets (
  id            serial primary key,
  brand_id      int not null references brands(id) on delete cascade,
  account_id    int not null references accounts(id) on delete cascade,
  period_start  date not null,
  period_end    date not null,
  target_amount numeric(18, 2) not null default 0 check (target_amount >= 0),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (brand_id, account_id, period_start, period_end)
);
create index budget_targets_brand_idx on budget_targets (brand_id, period_start, period_end);

create trigger budget_targets_updated_at before update on budget_targets
  for each row execute function set_updated_at();
