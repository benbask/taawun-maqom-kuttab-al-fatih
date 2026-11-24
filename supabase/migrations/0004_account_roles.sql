-- 0004: Peran akun pengguna pasca-login WhatsApp.
-- outsider     = pihak luar yang ingin ta'awun
-- alumni       = alumni, ta'awun saja
-- alumni_join  = alumni yang mau ikut Maqom juga (profil khusus)
-- ots          = orang tua santri

alter table public.families
  add column if not exists account_type text,
  add column if not exists alumni_profile jsonb not null default '{}'::jsonb;

create index if not exists families_account_type_idx
  on public.families (account_type)
  where account_type is not null;
