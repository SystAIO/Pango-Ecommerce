-- ───────────────────────────────────────────────────────────────────────────
-- One-time setup for a self-hosted PostgreSQL server.
--
-- Run this BEFORE schema.sql. It creates the roles and the tiny `auth` shim the
-- schema's RLS policies expect (Supabase provides these automatically).
-- Safe to re-run.
-- ───────────────────────────────────────────────────────────────────────────

-- Roles used by PostgREST / the backend. The backend connects as the owner of
-- the database and bypasses RLS; these exist so the GRANTs in schema.sql work.
do $$
begin
  if not exists (select from pg_roles where rolname = 'anon') then
    create role anon nologin noinherit;
  end if;
  if not exists (select from pg_roles where rolname = 'authenticated') then
    create role authenticated nologin noinherit;
  end if;
  if not exists (select from pg_roles where rolname = 'service_role') then
    create role service_role nologin noinherit bypassrls;
  end if;
end
$$;

grant usage on schema public to anon, authenticated, service_role;

-- Supabase exposes auth.uid() as a uuid. Our custom JWT auth does not use it,
-- so a NULL-returning shim is enough for public.current_user_id() to compile.
create schema if not exists auth;
create or replace function auth.uid() returns uuid
  language sql stable
  as $$ select null::uuid $$;

grant usage on schema auth to anon, authenticated, service_role;
