-- 0003: Mode demo
-- Menandai data demo (keluarga "08888" / OTP 8888) supaya tidak pernah
-- masuk rekap publik, verifikasi admin, maupun export.

alter table public.families
  add column if not exists is_demo boolean not null default false;

alter table public.invoices
  add column if not exists is_demo boolean not null default false;

create index if not exists families_is_demo_idx
  on public.families (is_demo)
  where is_demo;

create index if not exists invoices_is_demo_idx
  on public.invoices (is_demo)
  where is_demo;
