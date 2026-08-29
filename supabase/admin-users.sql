-- Boemi Nusantara — daftar admin panel (Fase Delegasi, 2026-07-20).
-- Jalankan di Supabase SQL editor. Schema: boemi.
--
-- Sebelum ini daftar admin hidup di env ADMIN_EMAILS di server, jadi menambah
-- staf harus lewat developer. Tabel ini bikin client bisa kelola sendiri.
-- ADMIN_EMAILS tetap dipakai sebagai "pemilik" (bootstrap) yang tidak bisa
-- dihapus dari panel — supaya panel tidak mungkin terkunci dari luar.

create table if not exists admin_users (
  email      text primary key,
  name       text not null default '',
  added_by   text,                        -- email admin yang menambahkan
  created_at timestamptz not null default now()
);

-- Hanya service role (panel admin) yang boleh menyentuh tabel ini.
-- Tidak ada policy untuk anon/authenticated = publik tidak bisa baca daftar staf.
alter table admin_users enable row level security;

grant select, insert, update, delete on admin_users to service_role;
