-- Hasil pemeriksaan otomatis terhadap bukti transfer (OCR).
-- matched      = nominal cocok, invoice otomatis terverifikasi
-- needs_review = OCR selesai tetapi nominal tidak cocok / kurang yakin
-- skipped      = berkas tidak bisa dibaca OCR (mis. PDF) atau OCR gagal

alter table public.invoices
  add column if not exists auto_verify_status text,
  add column if not exists auto_verify_amount bigint,
  add column if not exists auto_verify_at timestamptz;
