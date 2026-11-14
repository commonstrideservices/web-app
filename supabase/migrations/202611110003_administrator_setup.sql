create table public.administrator_setup_codes (
  id boolean primary key default true check (id),
  token_hash text not null check (token_hash ~ '^[a-f0-9]{64}$'),
  expires_at timestamptz not null
);

alter table public.administrator_setup_codes enable row level security;
revoke all on public.administrator_setup_codes from public, anon, authenticated, service_role;
