-- Rekening Kas: a per-brand list of bank/e-wallet/marketplace-balance accounts,
-- so Arus Kas entries reference a real account (with an ID) instead of free text.

create table cash_accounts (
  id         serial primary key,
  brand_id   int not null references brands(id) on delete cascade,
  name       text not null,
  is_active  boolean not null default true,
  created_at timestamptz not null default now()
);
create index cash_accounts_brand_idx on cash_accounts (brand_id);

alter table cash_flow_entries drop column account_note;
alter table cash_flow_entries add column account_id int references cash_accounts(id) on delete set null;
