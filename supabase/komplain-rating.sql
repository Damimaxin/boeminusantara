-- Boemi Nusantara — Komplain & Rating. 21 Juli 2026. Schema `boemi`.

-- ============ KOMPLAIN ============
create table if not exists complaints (
  id          uuid primary key default gen_random_uuid(),
  request_id  uuid references quote_requests(id) on delete set null,
  order_code  text,                       -- untuk pesanan online (opsional)
  buyer_email text not null,
  subject     text not null,
  message     text not null,
  status      text not null default 'open'
                check (status in ('open', 'handling', 'resolved')),
  admin_note  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists complaints_status_idx on complaints(status, created_at desc);
create index if not exists complaints_request_idx on complaints(request_id);

-- ============ RATING / ULASAN ============
create table if not exists ratings (
  id          uuid primary key default gen_random_uuid(),
  request_id  uuid references quote_requests(id) on delete cascade,
  buyer_email text not null,
  stars       int not null check (stars between 1 and 5),
  comment     text,
  created_at  timestamptz not null default now(),
  -- Satu penawaran satu ulasan (bisa diperbarui, tidak menumpuk).
  unique (request_id)
);
create index if not exists ratings_request_idx on ratings(request_id);

alter table complaints enable row level security;
alter table ratings    enable row level security;

-- Semua akses lewat server (service role) + pengecekan kepemilikan di kode.
grant all on complaints, ratings to service_role;
