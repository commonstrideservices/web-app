create schema app_private;
revoke all on schema app_private from public, anon, authenticated, service_role;

create table app_private.app_settings (
  key text primary key,
  schema_version integer not null check (schema_version > 0),
  value jsonb not null check (jsonb_typeof(value) = 'object'),
  updated_at timestamptz not null default now()
);

insert into app_private.app_settings (key, schema_version, value)
values ('email.connection_defaults', 1, '{
  "provider": "porkbun",
  "imapHost": "imap.porkbun.com",
  "imapPort": 993,
  "imapSecurity": "tls",
  "smtpHost": "smtp.porkbun.com",
  "smtpPort": 587,
  "smtpSecurity": "starttls"
}');

create table app_private.email_mailboxes (
  id uuid primary key default gen_random_uuid(),
  display_name text not null check (length(display_name) between 1 and 100),
  address text not null unique check (address = lower(btrim(address))),
  username text not null,
  provider text not null,
  imap_host text not null,
  imap_port integer not null check (imap_port between 1 and 65535),
  imap_security text not null check (imap_security = 'tls'),
  smtp_host text not null,
  smtp_port integer not null check (smtp_port between 1 and 65535),
  smtp_security text not null check (smtp_security in ('tls', 'starttls')),
  enabled boolean not null default true,
  is_default boolean not null default false check (not is_default or enabled),
  updated_at timestamptz not null default now()
);

create unique index email_mailboxes_one_default on app_private.email_mailboxes (is_default) where is_default;

create table app_private.email_mailbox_credentials (
  mailbox_id uuid primary key references app_private.email_mailboxes (id) on delete cascade,
  encrypted_password text not null,
  key_version integer not null check (key_version > 0)
);

create table app_private.email_template_fragments (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('header', 'footer')),
  name text not null check (length(name) between 1 and 100),
  html text not null check (length(html) between 1 and 16000),
  updated_at timestamptz not null default now(),
  unique (id, kind)
);

create table app_private.email_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(name) between 1 and 100),
  subject text not null default '' check (length(subject) <= 250),
  body text not null check (length(body) <= 30000),
  header_id uuid,
  footer_id uuid,
  header_kind text generated always as ('header'::text) stored,
  footer_kind text generated always as ('footer'::text) stored,
  updated_at timestamptz not null default now(),
  foreign key (header_id, header_kind) references app_private.email_template_fragments (id, kind),
  foreign key (footer_id, footer_kind) references app_private.email_template_fragments (id, kind)
);

create index email_templates_header_id_idx on app_private.email_templates (header_id);
create index email_templates_footer_id_idx on app_private.email_templates (footer_id);

-- Claim each reviewed message once before SMTP is attempted. No message content is retained here.
create table app_private.email_send_attempts (
  id uuid primary key,
  created_at timestamptz not null default now()
);
create index email_send_attempts_created_at_idx on app_private.email_send_attempts (created_at);

revoke all on all tables in schema app_private from public, anon, authenticated, service_role;
