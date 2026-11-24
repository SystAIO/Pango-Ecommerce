-- ─── NAVBAR MENU ────────────────────────────────────────────────
-- Backs the "Customize Navbar" section of the admin dashboard. The storefront
-- navbar renders Men / Women dropdowns from this table; rows are keyed
-- 'men' / 'women' so the schema can grow more triggers (e.g. 'kids') later.
--
-- HOW TO APPLY
--   Supabase dashboard → SQL Editor → New query → paste → Run.
--   The app tolerates the table being missing: the navbar falls back to the
--   built-in defaults until this runs.

begin;

create table if not exists public.navbar_menu (
  key         text        primary key check (key in ('men', 'women')),
  label       text        not null,
  columns     jsonb       not null default '[]'::jsonb,
  updated_at  timestamptz not null default now()
);

comment on table public.navbar_menu is
  'Storefront navbar dropdown content (Men / Women). Editable from Admin → Customize Navbar.';

-- The navbar is rendered for anonymous visitors, so reads stay public.
-- Writes go through /api/navbar-menu, which re-reads the caller''s role from
-- the database and only lets admins through.
alter table public.navbar_menu enable row level security;

drop policy if exists navbar_menu_public_read on public.navbar_menu;
create policy navbar_menu_public_read on public.navbar_menu
  for select using (true);

-- Seed the defaults (idempotent — never overwrites admin edits).
insert into public.navbar_menu (key, label, columns) values
  ('men', 'Men', '[
    {"title":"Topwear","items":["All Topwear","All T-Shirts","All Shirts","Hoodies","Sweatshirts","Jackets","Sweaters","Polo T-Shirts","Oversized T-shirts","Classic Fit T-shirts","Half Sleeve T-Shirts"]},
    {"title":"Bottomwear","items":["All Bottomwear","Joggers","Trackpants","Trousers & Pants","Jeans","Pajamas","Shorts","Boxers","Plus Size Bottomwear","Cargos","Cargo Joggers"]},
    {"title":"Winterwear","items":["All Winterwear","Hoodies","Sweatshirts","Jackets","Sweaters","Windcheaters","Co-ord Sets","Sweatshirts & Hoodies","Plus Size"]}
  ]'::jsonb),
  ('women', 'Women', '[
    {"title":"Topwear","items":["All Topwear","All T-Shirts","Oversized T-Shirts","Boyfriend T-Shirts","Hoodies","Sweatshirts","Jackets","Sweaters","Classic Fit T-Shirts","All Shirts","Half Sleeves T-Shirts"]},
    {"title":"Bottomwear","items":["All Bottomwear","Joggers","Trackpants","Trousers & Pants","Jeans","Pajamas","Shorts","Plus Size Bottomwear","Cargos","Cargo Joggers","Cargo Pants"]},
    {"title":"Winterwear","items":["All Winterwear","Hoodies","Sweatshirts","Jackets","Sweaters","Windcheaters","Co-ord Sets","Sweatshirts & Hoodies","Plus Size"]}
  ]'::jsonb)
on conflict (key) do nothing;

commit;
