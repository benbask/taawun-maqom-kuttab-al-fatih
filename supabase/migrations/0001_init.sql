-- Ta'awun Maqom Kuttab Al Fatih Lampung
-- Jalankan file ini di Supabase SQL Editor, atau lewat `supabase db push`.

create extension if not exists "pgcrypto";

create sequence if not exists public.invoice_no_seq start with 1;

create table if not exists public.settings (
  id integer primary key default 1 check (id = 1),
  site_name text not null default 'Ta''awun Maqom Kuttab Al Fatih Lampung',
  tagline text not null default '',
  hero_title text not null default '',
  hero_subtitle text not null default '',
  info_markdown text not null default '',
  target_amount bigint not null default 0,
  deadline date,
  contact_whatsapp text not null default '',
  contact_name text not null default '',
  address text not null default '',
  logo_url text,
  hero_image_url text,
  qris_payload text,
  qris_merchant_name text,
  qris_merchant_city text,
  unique_code_base integer not null default 9,
  unique_code_max_digits integer not null default 3,
  invoice_expiry_hours integer not null default 24,
  otp_expiry_minutes integer not null default 10,
  admin_whatsapp text not null default '',
  otp_template text not null default 'Kode verifikasi Ta''awun Maqom Kuttab Al Fatih Lampung: {{kode}}. Berlaku {{menit}} menit. Jangan bagikan kode ini kepada siapa pun.',
  sheets_webhook_url text,
  sheets_webhook_secret text,
  footer_credit text not null default 'Beny Abu Ibrahim',
  updated_at timestamptz not null default now()
);

create table if not exists public.admins (
  id uuid primary key default gen_random_uuid(),
  username text unique not null,
  password_hash text not null,
  created_at timestamptz not null default now(),
  last_login_at timestamptz
);

create table if not exists public.classes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  level text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.form_fields (
  id uuid primary key default gen_random_uuid(),
  scope text not null check (scope in ('family', 'student')),
  key text not null,
  label text not null,
  type text not null check (type in ('text', 'textarea', 'number', 'select', 'date', 'checkbox')),
  placeholder text,
  help_text text,
  required boolean not null default false,
  options jsonb not null default '[]'::jsonb,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (scope, key)
);

create table if not exists public.families (
  id uuid primary key default gen_random_uuid(),
  phone text unique not null,
  parent_name text not null,
  custom_data jsonb not null default '{}'::jsonb,
  consent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  name text not null,
  class_id uuid references public.classes(id) on delete set null,
  custom_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  invoice_no text unique not null,
  family_id uuid not null references public.families(id) on delete restrict,
  type text not null check (type in ('registration', 'addition')),
  base_amount bigint not null,
  unique_code integer not null,
  total_amount bigint not null,
  status text not null default 'pending' check (status in ('pending', 'waiting_verification', 'verified', 'rejected', 'expired', 'cancelled')),
  qris_payload text,
  proof_url text,
  proof_uploaded_at timestamptz,
  reject_reason text,
  notes text,
  expires_at timestamptz,
  verified_at timestamptz,
  verified_by uuid references public.admins(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.invoice_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  student_id uuid references public.students(id) on delete set null,
  class_id uuid references public.classes(id) on delete set null,
  description text,
  amount bigint not null,
  created_at timestamptz not null default now()
);

create table if not exists public.otp_requests (
  id uuid primary key default gen_random_uuid(),
  phone text not null,
  code_hash text not null,
  code_encrypted text not null,
  status text not null default 'pending' check (status in ('pending', 'sending', 'sent', 'failed', 'verified', 'expired')),
  attempts integer not null default 0,
  requested_ip text,
  worker_error text,
  sent_at timestamptz,
  verified_at timestamptz,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table if not exists public.wa_session (
  id integer primary key default 1 check (id = 1),
  status text not null default 'disconnected' check (status in ('disconnected', 'qr', 'connecting', 'connected', 'error')),
  qr text,
  connected_phone text,
  last_heartbeat timestamptz,
  last_error text,
  logout_requested boolean not null default false,
  updated_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_type text not null check (actor_type in ('admin', 'user', 'system', 'worker')),
  actor_id text,
  action text not null,
  entity_type text,
  entity_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists invoices_family_idx on public.invoices (family_id);
create index if not exists invoices_status_idx on public.invoices (status);
create index if not exists invoices_created_idx on public.invoices (created_at desc);
create index if not exists invoice_items_invoice_idx on public.invoice_items (invoice_id);
create index if not exists invoice_items_class_idx on public.invoice_items (class_id);
create index if not exists students_family_idx on public.students (family_id);
create index if not exists otp_phone_idx on public.otp_requests (phone, created_at desc);
create index if not exists audit_created_idx on public.audit_logs (created_at desc);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists settings_touch on public.settings;
create trigger settings_touch before update on public.settings
for each row execute function public.touch_updated_at();

drop trigger if exists families_touch on public.families;
create trigger families_touch before update on public.families
for each row execute function public.touch_updated_at();

drop trigger if exists invoices_touch on public.invoices;
create trigger invoices_touch before update on public.invoices
for each row execute function public.touch_updated_at();

-- Assign unique code and create invoice in one transaction.
-- Code pattern follows admin base: 9, 19, 29, ... 999, then other unused
-- 3-digit codes. Total amount collisions are skipped.
create or replace function public.create_invoice(
  p_family_id uuid,
  p_type text,
  p_items jsonb,
  p_base_code integer,
  p_expiry_hours integer
)
returns public.invoices
language plpgsql
security definer
set search_path = public
as $$
declare
  v_base_amount bigint;
  v_code integer;
  v_found boolean := false;
  v_total bigint;
  v_id uuid := gen_random_uuid();
  v_invoice_no text;
  v_used_totals bigint[];
  v_item jsonb;
  v_invoice public.invoices;
begin
  if not exists (select 1 from public.families where id = p_family_id) then
    raise exception 'FAMILY_NOT_FOUND';
  end if;
  if p_type not in ('registration', 'addition') then
    raise exception 'INVALID_TYPE';
  end if;

  select coalesce(sum((item->>'amount')::bigint), 0)
    into v_base_amount
  from jsonb_array_elements(p_items) item;

  if v_base_amount <= 0 then
    raise exception 'INVALID_AMOUNT';
  end if;

  perform pg_advisory_xact_lock(hashtext('taawun_unique_code'));

  select coalesce(array_agg(total_amount), array[]::bigint[])
    into v_used_totals
  from public.invoices
  where status in ('pending', 'waiting_verification')
     or (status = 'verified' and created_at > now() - interval '30 days');

  for v_code in select generate_series(greatest(1, least(999, p_base_code)), 999, 10) loop
    if not ((v_base_amount + v_code) = any(v_used_totals)) then
      v_found := true;
      exit;
    end if;
  end loop;

  if not v_found then
    for v_code in 1..999 loop
      if not ((v_base_amount + v_code) = any(v_used_totals)) then
        v_found := true;
        exit;
      end if;
    end loop;
  end if;

  if not v_found then
    raise exception 'NO_UNIQUE_CODE';
  end if;

  v_total := v_base_amount + v_code;
  v_invoice_no := 'TAA-' || to_char(now(), 'YYMMDD') || '-' ||
    lpad(nextval('public.invoice_no_seq')::text, 4, '0');

  insert into public.invoices (
    id, invoice_no, family_id, type, base_amount, unique_code,
    total_amount, status, expires_at, created_at, updated_at
  ) values (
    v_id, v_invoice_no, p_family_id, p_type, v_base_amount, v_code,
    v_total, 'pending',
    now() + make_interval(hours => greatest(1, coalesce(p_expiry_hours, 24))),
    now(), now()
  );

  for v_item in select * from jsonb_array_elements(p_items) loop
    insert into public.invoice_items (
      invoice_id, student_id, class_id, description, amount
    ) values (
      v_id,
      nullif(v_item->>'studentId', '')::uuid,
      nullif(v_item->>'classId', '')::uuid,
      nullif(v_item->>'description', ''),
      (v_item->>'amount')::bigint
    );
  end loop;

  select * into v_invoice from public.invoices where id = v_id;
  return v_invoice;
end;
$$;

-- RLS: aplikasi memakai service role di server. Tidak ada akses langsung
-- dari browser ke tabel-tabel ini.
alter table public.settings enable row level security;
alter table public.admins enable row level security;
alter table public.classes enable row level security;
alter table public.form_fields enable row level security;
alter table public.families enable row level security;
alter table public.students enable row level security;
alter table public.invoices enable row level security;
alter table public.invoice_items enable row level security;
alter table public.otp_requests enable row level security;
alter table public.wa_session enable row level security;
alter table public.audit_logs enable row level security;

insert into public.settings (
  id, site_name, tagline, hero_title, hero_subtitle, info_markdown,
  target_amount, deadline, contact_whatsapp, contact_name, address,
  unique_code_base, unique_code_max_digits, invoice_expiry_hours,
  otp_expiry_minutes, admin_whatsapp, footer_credit
) values (
  1,
  'Ta''awun Maqom Kuttab Al Fatih Lampung',
  'Bersama membangun generasi Qur''ani',
  'Ta''awun untuk Maqom Kuttab Al Fatih Lampung',
  'Setiap kontribusi Anda menjadi bagian dari perjalanan pendidikan Qur''an anak-anak kita.',
  '## Kebutuhan Ta''awun' || chr(10) || chr(10) || 'Silakan ubah informasi ini melalui halaman admin.',
  0,
  null,
  '',
  'Admin Ta''awun',
  'Bandar Lampung, Lampung',
  9,
  3,
  24,
  10,
  '',
  'Beny Abu Ibrahim'
) on conflict (id) do nothing;

insert into public.wa_session (id, status) values (1, 'disconnected')
on conflict (id) do nothing;

-- Bucket storage. `proofs` privat, `site-assets` publik.
insert into storage.buckets (id, name, public)
values ('proofs', 'proofs', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('site-assets', 'site-assets', true)
on conflict (id) do nothing;
