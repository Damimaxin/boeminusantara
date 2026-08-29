-- Boemi Nusantara — Jejak audit. 21 Juli 2026. Schema `boemi`.
--
-- Mencatat SIAPA melakukan APA di panel, dan KAPAN. Dibaca hanya oleh pemilik
-- (bukan staf) lewat /admin/pemilik. Ditulis hanya oleh server (service role),
-- jadi staf tidak bisa menghapus atau mengarang jejaknya sendiri.
create table if not exists audit_log (
  id          bigint generated always as identity primary key,
  actor_email text not null,               -- pelaku (email admin)
  action      text not null,               -- mis. 'produk.ubah', 'penawaran.acc'
  target      text,                         -- ringkas objek: nama/kode
  detail      jsonb,                        -- konteks tambahan (opsional)
  created_at  timestamptz not null default now()
);

create index if not exists audit_log_time_idx  on audit_log(created_at desc);
create index if not exists audit_log_actor_idx on audit_log(actor_email, created_at desc);

alter table audit_log enable row level security;
-- Tanpa policy untuk anon/authenticated = tidak ada jalur baca dari klien.
grant insert, select on audit_log to service_role;
