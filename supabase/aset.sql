-- Boemi Nusantara — Perawatan aset. 21 Juli 2026. Schema `boemi`.
--
-- Aset TIDAK disimpan ulang di sini: sumber kebenarannya tetap dokumen BAST
-- (Berita Acara Serah Terima) yang sudah terbit — tiap BAST mencatat barang apa
-- diserahkan ke instansi mana dan kapan. Sekolah tidak perlu mengetik ulang.
--
-- Tabel ini hanya menyimpan bagian yang BERUBAH dan tidak ada di BAST:
-- masa garansi, jadwal servis, kapan terakhir dirawat.
create table if not exists asset_care (
  -- <id dokumen BAST>#<indeks baris barang> — deterministik, ikut ke sumbernya.
  asset_key               text primary key,
  buyer_email             text not null,
  warranty_months         int,          -- masa garansi sejak diterima
  service_interval_months int,          -- jarak servis rutin
  last_serviced_at        date,         -- kosong = belum pernah dirawat
  note                    text,
  updated_at              timestamptz not null default now()
);

create index if not exists asset_care_buyer_idx on asset_care(buyer_email);

alter table asset_care enable row level security;
grant all on asset_care to service_role;
