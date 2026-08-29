-- Boemi Nusantara — Negosiasi harga + identitas perusahaan + penomoran surat.
-- Tahap 1 platform pengadaan (21 Juli 2026). Jalankan di schema `boemi`.

-- ============ IDENTITAS PERUSAHAAN ============
-- Identitas hukum TIDAK di-hardcode. NPWP, nama penanda tangan, dan alamat
-- tercetak di dokumen resmi — kalau salah, itu masalah audit pembeli. Jadi
-- disimpan sebagai setelan yang bisa dibetulkan sendiri tanpa ubah kode,
-- sekaligus siap ketika Sinar Purnama Teknik dilebur ke Boemi.
create table if not exists company_profile (
  id            int primary key default 1 check (id = 1),  -- satu baris saja
  nama          text not null default '',
  npwp          text not null default '',
  alamat        text not null default '',
  kota          text not null default '',
  telepon       text not null default '',
  email         text not null default '',
  penandatangan text not null default '',   -- nama yang tercetak di blok tanda tangan
  jabatan       text not null default '',
  kode_surat    text not null default 'BNKB', -- dipakai di nomor surat
  bank_name     text not null default '',    -- rekening pembayaran (tercetak di invoice/kwitansi)
  bank_account  text not null default '',
  bank_holder   text not null default '',
  pdn_statement text not null default '',    -- redaksi Pernyataan PDN Non-TKDN
  term_days     integer not null default 14, -- jatuh tempo default (hari)
  updated_at    timestamptz not null default now()
);

insert into company_profile (id) values (1) on conflict (id) do nothing;

-- ============ PENOMORAN SURAT ============
-- Nomor surat tidak boleh bolong atau ganda — itu temuan auditor paling sering.
-- Nomor diambil lewat fungsi ber-lock, bukan "hitung jumlah baris + 1" yang
-- bisa menghasilkan nomor kembar saat dua orang menekan tombol bersamaan.
create table if not exists doc_counters (
  doc_type    text not null,
  year        int  not null,
  last_number int  not null default 0,
  primary key (doc_type, year)
);

create or replace function next_doc_number(p_doc_type text, p_year int)
returns int
language plpgsql
as $$
declare
  n int;
begin
  insert into doc_counters (doc_type, year, last_number)
  values (p_doc_type, p_year, 1)
  on conflict (doc_type, year)
  do update set last_number = doc_counters.last_number + 1
  returning last_number into n;
  return n;
end;
$$;

-- ============ HARGA AJUAN PEMBELI ============
-- Pembeli boleh mencantumkan harga yang dia inginkan saat meminta penawaran.
alter table quote_request_items
  add column if not exists buyer_price bigint;

-- Status permintaan bertambah: sedang tawar-menawar & disepakati.
alter table quote_requests drop constraint if exists quote_requests_status_check;
alter table quote_requests add constraint quote_requests_status_check
  check (status in ('pending','reviewed','negotiating','agreed','quoted','rejected','expired'));

-- ============ RIWAYAT NEGOSIASI ============
-- Tiap penawaran & balasan disimpan sebagai satu ronde. Riwayat ini sendiri
-- nanti menjadi dokumen "Riwayat Negosiasi" yang diminta sekolah, jadi tidak
-- boleh ditimpa — selalu tambah baris baru, tidak pernah mengubah baris lama.
create table if not exists quote_offers (
  id          uuid primary key default gen_random_uuid(),
  request_id  uuid not null references quote_requests(id) on delete cascade,
  round       int  not null,
  actor       text not null check (actor in ('buyer','seller')),
  kind        text not null check (kind in ('offer','counter','accept','reject')),
  subtotal    bigint not null default 0,     -- exclude PPN
  note        text,
  created_by  text,                          -- email pelaku
  created_at  timestamptz not null default now(),
  unique (request_id, round)
);

create table if not exists quote_offer_items (
  id              uuid primary key default gen_random_uuid(),
  offer_id        uuid not null references quote_offers(id) on delete cascade,
  request_item_id uuid not null references quote_request_items(id) on delete cascade,
  unit_price      bigint not null,           -- exclude PPN
  qty             int not null,
  subtotal        bigint not null
);

create index if not exists quote_offers_request_idx on quote_offers(request_id, round);
create index if not exists quote_offer_items_offer_idx on quote_offer_items(offer_id);

-- ============ IZIN ============
-- Semua tabel di atas hanya disentuh lewat panel (service role). Belum ada
-- akses publik: portal klien dibangun setelah pemisahan basis data.
alter table company_profile  enable row level security;
alter table doc_counters     enable row level security;
alter table quote_offers     enable row level security;
alter table quote_offer_items enable row level security;

grant all on company_profile, doc_counters, quote_offers, quote_offer_items to service_role;
