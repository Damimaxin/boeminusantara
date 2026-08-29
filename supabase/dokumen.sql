-- Boemi Nusantara — Arsip dokumen pengadaan. 21 Juli 2026. Schema `boemi`.
--
-- ATURAN POKOK: dokumen TERBIT SEKALI, isinya dibekukan, tidak pernah dibuat
-- ulang. Kolom `snapshot` menyimpan seluruh isi surat apa adanya saat terbit —
-- termasuk harga, NPWP, dan nama pejabat. Kalau surat dirender ulang dari data
-- terkini, invoice yang diunduh Januari bisa berubah isinya di bulan Maret
-- karena harga produknya sudah diperbarui. Itu mimpi buruk saat pemeriksaan.

create table if not exists documents (
  id          uuid primary key default gen_random_uuid(),
  doc_type    text not null check (doc_type in ('SP','INV','SJ','BAST','KW','NEG','PDN')),
  number      text unique not null,          -- nomor surat, mis. SP/BNKB/2607/0001
  request_id  uuid references quote_requests(id) on delete set null,
  order_id    uuid references orders(id) on delete set null,
  -- Isi surat yang dibekukan. Jangan pernah di-update setelah terbit.
  snapshot    jsonb not null,
  issued_by   text,                          -- email admin penerbit
  issued_at   timestamptz not null default now(),
  -- Pembatalan tidak menghapus baris: nomor surat yang sudah keluar tidak boleh
  -- hilang, nanti terlihat seperti nomor bolong saat diperiksa.
  voided_at   timestamptz,
  void_reason text
);

create index if not exists documents_request_idx on documents(request_id);
create index if not exists documents_order_idx   on documents(order_id);
create index if not exists documents_type_idx    on documents(doc_type, issued_at desc);

alter table documents enable row level security;
grant all on documents to service_role;
