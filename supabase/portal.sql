-- Boemi Nusantara — Profil instansi pembeli (portal klien). 21 Juli 2026.
-- Jalankan di schema `boemi`.
--
-- Kenapa tabel ini penting: nama satuan pendidikan, NPWP, alamat, nama pejabat
-- dan NIP berulang di HAMPIR SEMUA dokumen pengadaan. Diisi sekali di sini,
-- dipakai seluruh surat — dan tidak ada lagi salah ketik NIP di dokumen resmi.

create table if not exists buyer_profiles (
  user_id        uuid primary key references auth.users(id) on delete cascade,
  institution    text not null default '',   -- nama satuan pendidikan / instansi
  npwp           text not null default '',
  address        text not null default '',
  city           text not null default '',
  postal_code    text not null default '',
  phone          text not null default '',
  -- Pejabat penanda tangan di pihak pembeli (PPK / Kepala Sekolah / Pelaksana)
  officer_name   text not null default '',
  officer_nip    text not null default '',
  officer_role   text not null default '',
  budget_year    int,                         -- tahun anggaran berjalan
  budget_source  text not null default '',    -- BOS / APBD / APBN / mandiri
  updated_at     timestamptz not null default now()
);

-- Hanya disentuh lewat portal (service role), yang sudah menyaring per pemakai.
alter table buyer_profiles enable row level security;
grant all on buyer_profiles to service_role;
