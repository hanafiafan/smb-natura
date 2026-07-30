-- Multi-tenant: Perusahaan (company) > Brand (replaces branches, fully isolated data)
-- Multi-user auth: users with role (super_admin sees everything, brand_admin scoped to their brand(s))

create table companies (
  id          serial primary key,
  name        text not null,
  created_at  timestamptz not null default now()
);

create table brands (
  id          serial primary key,
  company_id  int not null references companies(id) on delete restrict,
  name        text not null,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);
create index brands_company_idx on brands (company_id);

create type user_role as enum ('super_admin', 'brand_admin');

create table users (
  id             uuid primary key default gen_random_uuid(),
  email          text unique not null,
  password_hash  text not null,
  role           user_role not null,
  created_at     timestamptz not null default now()
);

-- Which brand(s) a brand_admin can access. Irrelevant for super_admin (sees all).
create table user_brands (
  user_id   uuid not null references users(id) on delete cascade,
  brand_id  int not null references brands(id) on delete cascade,
  primary key (user_id, brand_id)
);

-- Migrate existing single-tenant data into a default company/brand so nothing is lost.
insert into companies (name) values ('CV Loka Bumi Persada');
insert into brands (company_id, name)
  select id, 'Natura' from companies where name = 'CV Loka Bumi Persada';

-- Chart of accounts is now isolated per brand instead of global.
alter table accounts add column brand_id int references brands(id) on delete cascade;
update accounts set brand_id = (select id from brands order by id limit 1);
alter table accounts alter column brand_id set not null;
alter table accounts drop constraint accounts_code_key;
alter table accounts add constraint accounts_brand_code_key unique (brand_id, code);
create index accounts_brand_idx on accounts (brand_id, section, sort_order);

-- Transactions belong to a brand directly; branch_id/branches goes away (brand replaces it).
alter table transactions add column brand_id int references brands(id) on delete cascade;
update transactions set brand_id = (select id from brands order by id limit 1);
alter table transactions alter column brand_id set not null;
alter table transactions drop column branch_id;
create index transactions_brand_idx on transactions (brand_id);

drop table branches;
