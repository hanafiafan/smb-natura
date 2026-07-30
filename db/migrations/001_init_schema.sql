-- Chart of Accounts (COA) — merepresentasikan struktur PDF Laporan Laba/Rugi
create type account_section as enum (
  'revenue', 'cogs', 'opex', 'non_op_income', 'non_op_expense', 'tax'
);

create table accounts (
  id              serial primary key,
  code            text unique not null,
  name            text not null,
  section         account_section not null,
  category        text,
  sign            smallint not null default 1 check (sign in (1, -1)),
  sort_order      int not null default 0,
  is_active       boolean not null default true,
  created_at      timestamptz not null default now()
);
create index accounts_section_idx on accounts (section, sort_order);

create table branches (
  id              serial primary key,
  name            text not null,
  is_active       boolean not null default true,
  created_at      timestamptz not null default now()
);

create table transactions (
  id              uuid primary key default gen_random_uuid(),
  txn_date        date not null,
  account_id      int not null references accounts(id) on delete restrict,
  branch_id       int not null references branches(id) on delete restrict,
  amount          numeric(18, 2) not null check (amount >= 0),
  description     text,
  reference       text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index transactions_date_idx on transactions (txn_date desc);
create index transactions_account_idx on transactions (account_id);
create index transactions_branch_idx on transactions (branch_id);

create or replace function set_updated_at() returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;
create trigger transactions_updated_at before update on transactions
  for each row execute function set_updated_at();

insert into branches (id, name) values (1, 'Semua Cabang');
alter sequence branches_id_seq restart with 2;
