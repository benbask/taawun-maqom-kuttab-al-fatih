-- Direktori santri & orang tua untuk alur pendaftaran Ta'awun.
-- Data ini bukan data akun: dipakai sebagai sumber pencocokan nama anak
-- dengan nama ayah saat pengguna memilih kelas.

create table if not exists public.student_directory (
  id uuid primary key default gen_random_uuid(),
  nis text not null unique,
  name text not null,
  class_name text not null,
  level text,
  sub_class text,
  gender text,
  father_name text not null,
  mother_name text,
  created_at timestamptz not null default now()
);

create index if not exists student_directory_father_idx
  on public.student_directory (lower(father_name));

create index if not exists student_directory_class_idx
  on public.student_directory (class_name);
