-- Produk: SKU/HPP master per brand. Mirrors the "HPP" sheet (SKU, Nama Barang, Ukuran,
-- Harga Jual, HPP Bahan Baku) — the sheet's "ID produk" column was always empty, so this
-- gives products a real primary key instead.

create table products (
  id         serial primary key,
  brand_id   int not null references brands(id) on delete cascade,
  sku        text not null,
  name       text not null,
  size_label text,
  price      numeric(18, 2) not null default 0 check (price >= 0),
  cogs       numeric(18, 2) not null default 0 check (cogs >= 0),
  is_active  boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (brand_id, sku)
);
create index products_brand_idx on products (brand_id, name);

create trigger products_updated_at before update on products
  for each row execute function set_updated_at();
