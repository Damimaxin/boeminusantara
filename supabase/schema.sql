-- Boemi Nusantara — skema inti (V1). Jalankan di Supabase SQL editor.
-- Auth (users) ditangani Supabase Auth (Email + Google). Tabel di bawah = domain e-commerce/ERP.
-- Catatan: harga dalam Rupiah, EXCLUDE PPN. PPN dihitung saat checkout.

-- ============ KATALOG ============
create table if not exists categories (
  slug        text primary key,           -- jurusan SMK, mis. 'otomotif'
  name        text not null,
  sort_order  int  not null default 0,
  created_at  timestamptz not null default now()
);

create table if not exists products (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique not null,
  name        text not null,
  category    text not null references categories(slug),
  description text not null default '',
  price       bigint not null,            -- Rupiah, EXCLUDE PPN
  stock       int    not null default 0,
  image       text,                       -- URL Supabase Storage
  weight_gram int,                        -- untuk ongkir (fitur nanti)
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists products_category_idx on products(category);
create index if not exists products_active_idx   on products(active);

-- ============ PELANGGAN (profil tambahan di atas auth.users) ============
create table if not exists customer_profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  phone       text,
  institution text,                       -- nama sekolah/instansi
  npwp        text,                        -- untuk faktur pajak (opsional)
  created_at  timestamptz not null default now()
);

create table if not exists addresses (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  label       text,
  recipient   text not null,
  phone       text not null,
  line        text not null,
  city        text not null,
  province    text,
  postal_code text,
  is_default  boolean not null default false,
  created_at  timestamptz not null default now()
);

-- ============ PROMO ============
create table if not exists coupons (
  code        text primary key,
  type        text not null check (type in ('percent','fixed')),
  value       bigint not null,            -- persen (0-100) atau Rupiah
  min_spend   bigint not null default 0,
  quota       int,                        -- null = tak terbatas
  used        int  not null default 0,
  starts_at   timestamptz,
  ends_at     timestamptz,
  active      boolean not null default true
);

-- ============ ORDER ============
create table if not exists orders (
  id            uuid primary key default gen_random_uuid(),
  code          text unique not null,     -- nomor order, mis. BOEMI-2026-0001
  user_id       uuid references auth.users(id),
  status        text not null default 'pending'
                  check (status in ('pending','paid','processing','shipped','done','cancelled')),
  subtotal      bigint not null,          -- exclude PPN
  ppn_enabled   boolean not null default false,
  ppn_amount    bigint not null default 0,
  discount      bigint not null default 0,
  coupon_code   text references coupons(code),
  total         bigint not null,          -- subtotal - discount + ppn
  npwp          text,
  address       jsonb,                    -- snapshot alamat kirim
  note          text,
  created_at    timestamptz not null default now()
);

create table if not exists order_items (
  id          uuid primary key default gen_random_uuid(),
  order_id    uuid not null references orders(id) on delete cascade,
  product_id  uuid references products(id),
  name        text not null,              -- snapshot
  price       bigint not null,            -- snapshot, exclude PPN
  qty         int not null,
  subtotal    bigint not null
);

create table if not exists payments (
  id          uuid primary key default gen_random_uuid(),
  order_id    uuid not null references orders(id) on delete cascade,
  gateway     text,                       -- 'midtrans' | 'xendit'
  status      text not null default 'pending',
  reference   text,                       -- id transaksi gateway
  raw         jsonb,
  created_at  timestamptz not null default now()
);

-- ============ ERP RINGKAS (adaptasi Warebox) ============
create table if not exists suppliers (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  contact    text,
  created_at timestamptz not null default now()
);

create table if not exists stock_movements (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references products(id),
  type        text not null check (type in ('in','out','adjust')),
  qty         int not null,
  ref         text,                       -- referensi (PO, order, opname)
  note        text,
  created_at  timestamptz not null default now()
);

-- ============ RFQ / PENAWARAN (hybrid: Minta Penawaran → ACC admin) ============
create table if not exists quote_requests (
  id             uuid primary key default gen_random_uuid(),
  code           text unique not null,      -- BOEMI-Q-2026-0001
  user_id        uuid references auth.users(id),
  customer_name  text not null,
  customer_email text not null,
  customer_phone text,
  institution    text,                       -- nama sekolah/instansi
  note           text,
  status         text not null default 'pending'
                   check (status in ('pending','reviewed','quoted','rejected','expired')),
  created_at     timestamptz not null default now()
);

create table if not exists quote_request_items (
  id          uuid primary key default gen_random_uuid(),
  request_id  uuid not null references quote_requests(id) on delete cascade,
  product_id  uuid references products(id),
  name        text not null,                 -- snapshot
  price       bigint not null,               -- snapshot, EXCLUDE PPN
  qty         int not null,
  subtotal    bigint not null
);

-- Surat penawaran resmi yang di-ACC admin
create table if not exists quotations (
  id           uuid primary key default gen_random_uuid(),
  request_id   uuid not null references quote_requests(id) on delete cascade,
  code         text unique not null,         -- No. surat: BOEMI-SP-2026-0001
  subtotal     bigint not null,              -- exclude PPN
  discount     bigint not null default 0,
  ppn_enabled  boolean not null default true,
  ppn_amount   bigint not null default 0,
  total        bigint not null,
  valid_until  date,
  terms        text,
  status       text not null default 'draft'
                 check (status in ('draft','approved','sent')),
  approved_by  text,
  approved_at  timestamptz,
  created_at   timestamptz not null default now()
);

-- (HR & CRM menyusul: employees, attendance, dsb.)
