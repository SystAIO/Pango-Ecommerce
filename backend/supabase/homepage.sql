-- ───────────────────────────────────────────────────────────────────────────
--  Homepage sections (admin-editable content)
--
--  One row per homepage section key. Each row holds the section's content as
--  jsonb so the schema does not change every time a field does. The backend
--  merges these rows over the built-in defaults in lib/homepage-content.ts, so
--  the storefront keeps working with an empty table (or no table at all).
--
--  Apply in the Supabase SQL Editor. Idempotent — safe to re-run.
-- ───────────────────────────────────────────────────────────────────────────

create table if not exists public.homepage_sections (
  key         text primary key,
  data        jsonb not null default '{}'::jsonb,
  updated_at  timestamptz not null default now()
);

alter table public.homepage_sections enable row level security;

-- Nobody reads or writes this table except the backend, which uses the
-- service-role key (bypasses RLS). The storefront gets it through
-- /api/homepage-sections.
