-- Extra account metadata: email verification, Google linking and reset tokens.
-- Apply once after schema.sql. Safe to re-run.

create table if not exists public.user_auth_meta (
  user_id bigint primary key,
  email_verified boolean not null default false,
  google_sub text unique,
  created_at timestamptz not null default now()
);

create table if not exists public.auth_tokens (
  id bigint generated always as identity primary key,
  user_id bigint not null,
  token_hash text not null unique,
  kind text not null check (kind in ('verify', 'reset')),
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists auth_tokens_user_kind_idx on public.auth_tokens (user_id, kind);

-- Existing accounts (and the pre-created admin) are already verified.
insert into public.user_auth_meta (user_id, email_verified)
select id, true from public.users
on conflict (user_id) do nothing;

alter table public.user_auth_meta enable row level security;
alter table public.auth_tokens enable row level security;

-- No public policies: all access is server-side.
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'pango_shop') then
    grant all on public.user_auth_meta, public.auth_tokens to pango_shop;
  end if;
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    grant all on public.user_auth_meta, public.auth_tokens to service_role;
  end if;
end $$;
