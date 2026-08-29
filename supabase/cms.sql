-- Boemi Nusantara — CMS ringan (Fase 2, 2026-07-20).
-- Jalankan di Supabase SQL editor pada schema `boemi`.
--   set search_path = boemi;  (atau prefix boemi. di tiap nama tabel)
--
-- Tiga tabel:
--   articles — konten edukasi/motivasi (pilar konten IG yang juga tayang di web)
--   banners  — slot promo di beranda
--   pages    — halaman statis yang boleh diedit client (Tentang, dsb)

-- ============ ARTIKEL ============
create table if not exists articles (
  id           uuid primary key default gen_random_uuid(),
  slug         text unique not null,
  title        text not null,
  pillar       text not null default 'edukasi'
               check (pillar in ('edukasi','motivasi','produk','berita')),
  excerpt      text not null default '',      -- ringkasan untuk kartu daftar
  body         text not null default '',      -- isi; paragraf dipisah baris kosong
  cover        text,                          -- path gambar, mis. /konten/e01.jpg
  source       text,                          -- sumber kebijakan/rujukan (pilar edukasi)
  status       text not null default 'draft' check (status in ('draft','published')),
  published_at timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists articles_status_idx    on articles(status, published_at desc);
create index if not exists articles_pillar_idx    on articles(pillar);

-- ============ BANNER BERANDA ============
create table if not exists banners (
  id         uuid primary key default gen_random_uuid(),
  title      text not null,
  subtitle   text not null default '',
  image      text not null,                   -- path gambar 16:9 / 3:1
  link       text,                            -- tujuan klik (opsional)
  sort_order int not null default 0,
  active     boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists banners_active_idx on banners(active, sort_order);

-- ============ HALAMAN STATIS ============
create table if not exists pages (
  slug       text primary key,                -- 'tentang', 'kebijakan-privasi', ...
  title      text not null,
  body       text not null default '',
  updated_at timestamptz not null default now()
);

-- ============ RLS ============
-- Pola sama seperti tabel katalog: publik hanya boleh BACA yang sudah terbit.
-- Semua tulis lewat service role (admin panel), yang otomatis bypass RLS.
alter table articles enable row level security;
alter table banners  enable row level security;
alter table pages    enable row level security;

drop policy if exists articles_public_read on articles;
create policy articles_public_read on articles
  for select using (status = 'published');

drop policy if exists banners_public_read on banners;
create policy banners_public_read on banners
  for select using (active);

drop policy if exists pages_public_read on pages;
create policy pages_public_read on pages
  for select using (true);

-- ============ SEED HALAMAN ============
insert into pages (slug, title, body) values
  ('tentang', 'Tentang Boemi Nusantara', '')
on conflict (slug) do nothing;
