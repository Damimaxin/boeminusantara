-- ============================================================================
-- Boemi Nusantara — Row Level Security (RLS)
-- Jalankan SETELAH schema.sql. Backend (boemi-api) pakai SERVICE ROLE → bypass RLS.
-- Policy di sini mengamankan akses via anon/authenticated (mis. login FE, baca publik).
-- ============================================================================

-- ---- Katalog: publik boleh BACA, tulis hanya service role (admin via backend) ----
alter table products   enable row level security;
alter table categories enable row level security;

drop policy if exists "products_public_read" on products;
create policy "products_public_read" on products
  for select using (true);

drop policy if exists "categories_public_read" on categories;
create policy "categories_public_read" on categories
  for select using (true);
-- (Tidak ada policy insert/update/delete → hanya service role yang bisa menulis.)

-- ---- Profil pelanggan: tiap user hanya boleh datanya sendiri ----
alter table customer_profiles enable row level security;

drop policy if exists "own_profile_select" on customer_profiles;
create policy "own_profile_select" on customer_profiles
  for select using (auth.uid() = id);

drop policy if exists "own_profile_upsert" on customer_profiles;
create policy "own_profile_upsert" on customer_profiles
  for insert with check (auth.uid() = id);

drop policy if exists "own_profile_update" on customer_profiles;
create policy "own_profile_update" on customer_profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- ---- Alamat pengiriman: milik user ----
alter table addresses enable row level security;

drop policy if exists "own_addresses_all" on addresses;
create policy "own_addresses_all" on addresses
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---- Order: user boleh lihat & buat ordernya sendiri (proses lanjut via backend) ----
alter table orders enable row level security;

drop policy if exists "own_orders_select" on orders;
create policy "own_orders_select" on orders
  for select using (auth.uid() = user_id);

drop policy if exists "own_orders_insert" on orders;
create policy "own_orders_insert" on orders
  for insert with check (auth.uid() = user_id);

-- order_items ikut order milik user
alter table order_items enable row level security;

drop policy if exists "own_order_items_select" on order_items;
create policy "own_order_items_select" on order_items
  for select using (
    exists (select 1 from orders o where o.id = order_items.order_id and o.user_id = auth.uid())
  );

-- CATATAN:
-- • payments, suppliers, stock_movements = TANPA policy publik → hanya service role
--   (backend/admin) yang akses. RLS aktif = default deny untuk anon/authenticated.
-- • Tabel RFQ (quote_requests / quotations) menyusul saat fitur penawaran dibangun;
--   pola: user lihat penawarannya sendiri, admin (service role) yang ACC & terbitkan.
alter table payments        enable row level security;
alter table suppliers       enable row level security;
alter table stock_movements enable row level security;
