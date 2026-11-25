-- Bucket publik untuk gambar pengaturan (logo, hero, gambar pratinjau tautan).
-- Harus publik agar crawler WhatsApp/Facebook dapat mengambil og:image.

insert into storage.buckets (id, name, public)
values ('public-assets', 'public-assets', true)
on conflict (id) do update set public = true;
