-- Login dengan Google untuk pengguna (wali santri).
-- Nomor WhatsApp tetap menjadi identitas utama; akun Google hanya diikat
-- setelah nomor terverifikasi melalui OTP.

alter table public.families
  add column if not exists email text,
  add column if not exists google_sub text,
  add column if not exists phone_verified_at timestamptz;

create unique index if not exists families_google_sub_idx
  on public.families (google_sub)
  where google_sub is not null;

create unique index if not exists families_email_idx
  on public.families (lower(email))
  where email is not null;

comment on column public.families.google_sub is 'Sub akun Google yang sudah diikat setelah OTP WhatsApp.';
comment on column public.families.email is 'Email Google terverifikasi (opsional).';
comment on column public.families.phone_verified_at is 'Waktu nomor WhatsApp terakhir diverifikasi melalui OTP.';
