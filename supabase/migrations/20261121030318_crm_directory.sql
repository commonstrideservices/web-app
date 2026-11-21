create table app_private.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(btrim(name)) between 1 and 150),
  website text,
  industry text,
  country text,
  relationship text not null default 'unclassified'
    check (relationship in ('unclassified', 'prospect', 'client', 'former_client', 'partner')),
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.staff_accounts (id) on delete set null,
  updated_by uuid references public.staff_accounts (id) on delete set null
);

create table app_private.contacts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references app_private.companies (id) on delete restrict,
  name text not null check (length(btrim(name)) between 1 and 150),
  email text check (email = lower(btrim(email)) and length(email) between 1 and 254),
  affiliation text not null default 'unknown'
    check (affiliation in ('unknown', 'current', 'left_company')),
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.staff_accounts (id) on delete set null,
  updated_by uuid references public.staff_accounts (id) on delete set null
);

create unique index contacts_company_email_key on app_private.contacts (company_id, email);
create index companies_name_idx on app_private.companies (lower(name), id);
create index companies_updated_idx on app_private.companies (updated_at, id);
create index contacts_name_idx on app_private.contacts (lower(name), id);
create index contacts_updated_idx on app_private.contacts (updated_at, id);
create index companies_created_by_idx on app_private.companies (created_by);
create index companies_updated_by_idx on app_private.companies (updated_by);
create index contacts_created_by_idx on app_private.contacts (created_by);
create index contacts_updated_by_idx on app_private.contacts (updated_by);

alter table app_private.companies enable row level security;
alter table app_private.contacts enable row level security;
revoke all on app_private.companies, app_private.contacts from public, anon, authenticated, service_role;
