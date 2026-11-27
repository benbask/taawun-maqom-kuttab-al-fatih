-- Template pesan WhatsApp yang dipakai tombol "Bagikan ke WhatsApp".
-- Kosong berarti memakai template bawaan dari aplikasi.
alter table public.settings
  add column if not exists share_wa_template text not null default '';
