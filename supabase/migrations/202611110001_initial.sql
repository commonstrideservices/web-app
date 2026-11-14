create table public.staff_accounts (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique check (username ~ '^[a-z0-9][a-z0-9._-]{2,31}$'),
  email text not null unique,
  role text not null check (role in ('admin', 'staff')),
  created_at timestamptz not null default now()
);

create function public.register_staff_account()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.raw_app_meta_data ? 'common_stride_staff' then
    insert into public.staff_accounts (id, username, email, role)
    values (
      new.id,
      new.raw_app_meta_data #>> '{common_stride_staff,username}',
      new.email,
      new.raw_app_meta_data #>> '{common_stride_staff,role}'
    );
  end if;
  return new;
end;
$$;

create trigger register_common_stride_staff
after insert on auth.users for each row execute function public.register_staff_account();

create table public.prospects (
  id uuid primary key default gen_random_uuid(),
  email text not null unique check (email <> '' and email = lower(btrim(email))),
  current_submission_id uuid,
  contact_status text not null default 'not_contacted'
    check (contact_status in ('not_contacted', 'contacted', 'needs_follow_up')),
  last_contact_attempt_at timestamptz,
  follow_up_on date,
  notes text not null default '',
  created_at timestamptz not null default now()
);

create table public.intake_submissions (
  id uuid primary key,
  prospect_id uuid not null references public.prospects(id) on delete cascade,
  name text not null,
  company_name text,
  phone text not null,
  questionnaire_version integer not null check (questionnaire_version > 0),
  answers jsonb not null check (jsonb_typeof(answers) = 'array'),
  email_verified_at timestamptz,
  review_status text not null check (review_status in ('pending', 'applied', 'dismissed')),
  reviewed_at timestamptz,
  reviewed_by uuid references public.staff_accounts(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (id, prospect_id)
);

alter table public.prospects
  add constraint prospects_current_submission_fkey
  foreign key (current_submission_id, id)
  references public.intake_submissions(id, prospect_id) deferrable initially deferred;

create index intake_submissions_prospect_created_idx
  on public.intake_submissions (prospect_id, created_at desc);
create index intake_submissions_pending_idx
  on public.intake_submissions (prospect_id) where review_status = 'pending';
create index prospects_contact_status_follow_up_idx
  on public.prospects (contact_status, follow_up_on);
create index prospects_created_idx on public.prospects (created_at desc, id desc);

create table public.rate_limits (
  bucket text primary key,
  window_started_at timestamptz not null,
  hits integer not null
);

create function public.consume_rate_limit(p_bucket text, p_window_seconds integer, p_limit integer)
returns boolean language sql set search_path = '' as $$
  insert into public.rate_limits as limits (bucket, window_started_at, hits)
  values (p_bucket, now(), 1)
  on conflict (bucket) do update set
    window_started_at = case
      when limits.window_started_at <= now() - make_interval(secs => p_window_seconds) then now()
      else limits.window_started_at
    end,
    hits = case
      when limits.window_started_at <= now() - make_interval(secs => p_window_seconds) then 1
      else least(limits.hits, p_limit) + 1
    end
  returning hits <= p_limit;
$$;

create function public.submit_initial_intake(
  p_submission_id uuid, p_email text, p_name text, p_company_name text,
  p_phone text, p_questionnaire_version integer, p_answers jsonb
)
returns void language plpgsql set search_path = '' as $$
declare
  prospect public.prospects%rowtype;
  saved_id uuid;
begin
  insert into public.prospects (email)
  values (lower(btrim(p_email))) on conflict (email) do nothing;

  select * into strict prospect from public.prospects
  where email = lower(btrim(p_email)) for update;

  insert into public.intake_submissions (
    id, prospect_id, name, company_name, phone, questionnaire_version, answers, review_status
  ) values (
    p_submission_id, prospect.id, p_name, nullif(p_company_name, ''), p_phone,
    p_questionnaire_version, p_answers,
    case when prospect.current_submission_id is null then 'applied' else 'pending' end
  ) on conflict (id) do nothing returning id into saved_id;

  if saved_id is null then
    if not exists (
      select 1 from public.intake_submissions
      where id = p_submission_id and prospect_id = prospect.id
    ) then
      raise exception 'Invalid submission';
    end if;
    return;
  end if;

  if prospect.current_submission_id is null then
    update public.prospects set current_submission_id = saved_id where id = prospect.id;
  end if;
end;
$$;

create function public.review_intake_submission(
  p_prospect_id uuid, p_submission_id uuid, p_expected_current_id uuid,
  p_reviewer uuid, p_apply boolean
)
returns boolean language plpgsql set search_path = '' as $$
declare
  current_id uuid;
  reviewed_id uuid;
begin
  select current_submission_id into current_id from public.prospects
  where id = p_prospect_id for update;

  if not found or (p_apply and current_id is distinct from p_expected_current_id) then
    return false;
  end if;

  update public.intake_submissions set
    review_status = case when p_apply then 'applied' else 'dismissed' end,
    reviewed_at = now(),
    reviewed_by = p_reviewer
  where id = p_submission_id and prospect_id = p_prospect_id and review_status = 'pending'
  returning id into reviewed_id;

  if reviewed_id is null then return false; end if;

  if p_apply then
    update public.prospects set current_submission_id = reviewed_id where id = p_prospect_id;
  end if;
  return true;
end;
$$;

create view public.prospect_inbox with (security_invoker = true) as
select
  p.id, p.email, p.contact_status, p.last_contact_attempt_at, p.follow_up_on, p.created_at,
  s.name, s.company_name, s.phone, s.email_verified_at,
  (select count(*)::integer from public.intake_submissions as pending
    where pending.prospect_id = p.id and pending.review_status = 'pending') as pending_count
from public.prospects p
join public.intake_submissions s on s.id = p.current_submission_id;

create function public.prospect_dashboard(p_today date)
returns table (total integer, not_contacted integer, follow_ups_due integer, pending_updates integer)
language sql stable set search_path = '' as $$
  select count(*)::integer,
    count(*) filter (where contact_status = 'not_contacted')::integer,
    count(*) filter (where contact_status = 'needs_follow_up' and follow_up_on <= p_today)::integer,
    (select count(*)::integer from public.intake_submissions where review_status = 'pending')
  from public.prospects;
$$;

alter table public.staff_accounts enable row level security;
alter table public.prospects enable row level security;
alter table public.intake_submissions enable row level security;
alter table public.rate_limits enable row level security;

revoke all on public.staff_accounts, public.prospects, public.intake_submissions, public.rate_limits,
  public.prospect_inbox from public, anon, authenticated;
grant select on public.staff_accounts, public.prospect_inbox to service_role;
grant select, update on public.prospects to service_role;
grant select on public.intake_submissions to service_role;
grant select, insert, update on public.rate_limits to service_role;
grant insert (id, prospect_id, name, company_name, phone, questionnaire_version, answers, review_status)
  on public.intake_submissions to service_role;
grant update (review_status, reviewed_at, reviewed_by) on public.intake_submissions to service_role;
grant insert (email) on public.prospects to service_role;

revoke all on function public.register_staff_account() from public, anon, authenticated;
revoke all on function public.consume_rate_limit(text, integer, integer),
  public.submit_initial_intake(uuid, text, text, text, text, integer, jsonb),
  public.review_intake_submission(uuid, uuid, uuid, uuid, boolean),
  public.prospect_dashboard(date) from public, anon, authenticated;
grant execute on function public.consume_rate_limit(text, integer, integer),
  public.submit_initial_intake(uuid, text, text, text, text, integer, jsonb),
  public.review_intake_submission(uuid, uuid, uuid, uuid, boolean),
  public.prospect_dashboard(date) to service_role;
