-- Hak akses admin bertingkat: empat slot tetap + satu akun asisten untuk uji.
alter table public.admins
  add column if not exists slot text,
  add column if not exists is_active boolean not null default true,
  add column if not exists permissions text[] not null default '{}';

-- Admin yang sudah ada menjadi super admin (tidak berubah username/password).
update public.admins
set
  slot = 'super_admin',
  is_active = true,
  permissions = array[
    'dashboard', 'verifikasi', 'konten', 'kelas', 'form', 'alumni',
    'kehadiran', 'qris', 'whatsapp', 'export', 'audit', 'akun'
  ]::text[]
where slot is null;

create unique index if not exists admins_slot_unique
  on public.admins (slot) where slot is not null;

-- Slot baru nonaktif sampai passwordnya diatur di panel Akun Admin.
insert into public.admins (username, password_hash, slot, is_active, permissions)
values
  (
    'code_harnes_admin',
    '$2b$12$xclMP3B4bLfQt3hsnSf1POHS2JU4c.6Tzog3RY3/k6890Qa3.e3H2',
    'code_harnes',
    false,
    array['dashboard', 'konten', 'kelas', 'form', 'alumni', 'qris', 'whatsapp']::text[]
  ),
  (
    'bendahara_1',
    '$2b$12$CZxJ.NkDRwgrTm7T9avPM.68KtLe0ZRr2eoagjqzb8JiVhrMTC.NG',
    'bendahara_1',
    false,
    array['dashboard', 'verifikasi', 'kehadiran', 'export', 'akun']::text[]
  ),
  (
    'bendahara_2',
    '$2b$12$QUl3m5yDfoJpgTo3ikKCS.tAckozScbfLu.eqDDf/PacDCRU.rNaC',
    'bendahara_2',
    false,
    array['dashboard', 'verifikasi', 'kehadiran', 'export', 'akun']::text[]
  ),
  (
    'asisten_taawun',
    '$2b$12$IUfZVJMT7WwbPrEVps2DFuurH4V.vfHHrtELyRZM7jZMsYO2Pcr62',
    'asisten',
    true,
    array[
      'dashboard', 'verifikasi', 'konten', 'kelas', 'form', 'alumni',
      'kehadiran', 'qris', 'whatsapp', 'export', 'audit', 'akun'
    ]::text[]
  )
on conflict (username) do nothing;
