alter table public.staff_accounts
  add column password_hash text,
  alter column id set default gen_random_uuid();

drop trigger register_common_stride_staff on auth.users;
drop function public.register_staff_account();

-- Keep staff IDs and existing credentials when moving off Supabase Auth.
update public.staff_accounts as staff
set password_hash = nullif(users.encrypted_password, '')
from auth.users as users
where users.id = staff.id
  and users.deleted_at is null
  and users.email_confirmed_at is not null
  and (users.banned_until is null or users.banned_until <= now());

alter table public.staff_accounts drop constraint staff_accounts_id_fkey;
revoke all on public.staff_accounts from public, anon, authenticated, service_role;

create table public.staff_sessions (
  token_hash text primary key check (token_hash ~ '^[a-f0-9]{64}$'),
  staff_id uuid not null references public.staff_accounts(id) on delete cascade,
  expires_at timestamptz not null
);

create index staff_sessions_expiry_idx on public.staff_sessions (expires_at);
create index staff_sessions_staff_idx on public.staff_sessions (staff_id);

alter table public.staff_sessions enable row level security;
revoke all on public.staff_sessions from public, anon, authenticated, service_role;
