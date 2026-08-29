-- Boemi Nusantara — Lampiran berkas & pengiriman. 21 Juli 2026. Schema `boemi`.

-- ============ LAMPIRAN BERKAS ============
-- Faktur pajak, bukti bayar, foto barang saat dikirim, foto serah terima.
--
-- Catatan bukti: `sha256` dan `uploaded_at` diisi SERVER, bukan dari perangkat
-- pengunggah. Ini membuktikan berkas tidak diubah setelah diunggah — bukan
-- membuktikan foto benar diambil di lokasi itu. Batas itu disengaja dan jujur.
create table if not exists attachments (
  id          uuid primary key default gen_random_uuid(),
  request_id  uuid references quote_requests(id) on delete cascade,
  order_id    uuid references orders(id) on delete cascade,
  kind        text not null check (kind in
                ('faktur_pajak','bukti_bayar','foto_kirim','foto_bast','lainnya')),
  path        text not null,                 -- lokasi di Supabase Storage
  filename    text not null,
  mime        text not null default '',
  size_bytes  bigint not null default 0,
  sha256      text not null default '',
  caption     text,
  uploaded_by text,                          -- email pengunggah
  uploaded_at timestamptz not null default now(),
  -- Berkas keliru TIDAK dihapus diam-diam: unggah yang baru, yang lama ditandai.
  replaced_at timestamptz
);

create index if not exists attachments_request_idx on attachments(request_id, kind);
create index if not exists attachments_order_idx   on attachments(order_id, kind);

-- ============ PENGIRIMAN ============
create table if not exists shipments (
  id             uuid primary key default gen_random_uuid(),
  request_id     uuid references quote_requests(id) on delete cascade,
  order_id       uuid references orders(id) on delete cascade,
  courier        text not null default '',   -- nama ekspedisi / "kurir sendiri"
  tracking_number text not null default '',
  shipped_at     timestamptz,
  received_at    timestamptz,                -- diisi saat pembeli menekan "diterima"
  received_by    text,
  note           text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists shipments_request_idx on shipments(request_id);

alter table attachments enable row level security;
alter table shipments   enable row level security;

grant all on attachments, shipments to service_role;
