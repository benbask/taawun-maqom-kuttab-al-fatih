-- Meta tag pratinjau tautan (WhatsApp, Facebook, X/Twitter, Telegram, dll).
-- Nilai kosong berarti memakai nilai bawaan aplikasi.

alter table public.settings
  add column if not exists share_title text not null default '',
  add column if not exists share_description text not null default '',
  add column if not exists share_image_url text;
