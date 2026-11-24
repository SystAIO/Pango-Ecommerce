-- ─── Pango Apparels — winter clothing catalogue (GENERATED from scripts/clothing-catalogue.mjs) ───
-- Apply by pasting into the Supabase SQL Editor. DELETES every existing product first.
-- Safe to re-run.

begin;

delete from public.products;

insert into public.products (
  name, slug, category, brand, price, mrp,
  image_url, images, description_intro, badge,
  rating, review_count, stock, is_featured, is_deal, deal_ends_at,
  bundle_slugs, specifications
)
values
(
  'Pango Essential Oversized Hoodie — Men', 'pango-essential-oversized-hoodie-men', 'Hoodies', 'Pango',
  1499, 2499,
  'https://images.unsplash.com/photo-1523398002811-999ca8dec234?w=900&auto=format&fit=crop&q=80', '["https://images.unsplash.com/photo-1523398002811-999ca8dec234?w=900&auto=format&fit=crop&q=80","https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=900&auto=format&fit=crop&q=80","https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=900&auto=format&fit=crop&q=80","https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=900&auto=format&fit=crop&q=80"]'::jsonb,
  'Essential Oversized Hoodie — Men — cut for Indian winters, stitched for daily wear. Honest pricing, 30-day size exchange.', 'Best Seller',
  4.7, 2140, 25,
  true, true, now() + interval '3 days',
  '["pango-heavyweight-pocket-tee-men","pango-selvedge-denim-men"]'::jsonb,
  '{"1. FABRIC & CARE":{"Gender":"Men","Fabric":"400 gsm brushed fleece","Fit":"Oversized, drop shoulder","Care":"Cold wash inside out, line dry"}}'::jsonb
),
(
  'Pango Fleece Zip-Up Hoodie — Men', 'pango-fleece-zip-up-hoodie-men', 'Hoodies', 'Pango',
  1899, 3299,
  'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=900&auto=format&fit=crop&q=80', '["https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=900&auto=format&fit=crop&q=80","https://images.unsplash.com/photo-1523398002811-999ca8dec234?w=900&auto=format&fit=crop&q=80","https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=900&auto=format&fit=crop&q=80","https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=900&auto=format&fit=crop&q=80"]'::jsonb,
  'Fleece Zip-Up Hoodie — Men — cut for Indian winters, stitched for daily wear. Honest pricing, 30-day size exchange.', 'Featured',
  4.6, 1180, 25,
  true, false, null,
  '[]'::jsonb,
  '{"1. FABRIC & CARE":{"Gender":"Men","Fabric":"380 gsm zip fleece","Fit":"Relaxed","Care":"Cold wash, low heat tumble"}}'::jsonb
),
(
  'Pango Everyday Graphic Tee — Men', 'pango-everyday-graphic-tee-men', 'T-Shirts', 'Pango',
  599, 999,
  'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=900&auto=format&fit=crop&q=80', '["https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=900&auto=format&fit=crop&q=80","https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=900&auto=format&fit=crop&q=80","https://images.unsplash.com/photo-1571945153237-4929e783af4a?w=900&auto=format&fit=crop&q=80","https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=900&auto=format&fit=crop&q=80"]'::jsonb,
  'Everyday Graphic Tee — Men — cut for Indian winters, stitched for daily wear. Honest pricing, 30-day size exchange.', 'Popular',
  4.4, 3210, 25,
  false, true, now() + interval '3 days',
  '["pango-relaxed-cargo-joggers-men"]'::jsonb,
  '{"1. FABRIC & CARE":{"Gender":"Men","Fabric":"220 gsm combed cotton","Fit":"Regular","Care":"Machine wash cold"}}'::jsonb
),
(
  'Pango Heavyweight Pocket Tee — Men', 'pango-heavyweight-pocket-tee-men', 'T-Shirts', 'Pango',
  749, 1299,
  'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=900&auto=format&fit=crop&q=80', '["https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=900&auto=format&fit=crop&q=80","https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=900&auto=format&fit=crop&q=80","https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=900&auto=format&fit=crop&q=80","https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=900&auto=format&fit=crop&q=80"]'::jsonb,
  'Heavyweight Pocket Tee — Men — cut for Indian winters, stitched for daily wear. Honest pricing, 30-day size exchange.', '',
  4.6, 1875, 25,
  false, false, null,
  '[]'::jsonb,
  '{"1. FABRIC & CARE":{"Gender":"Men","Fabric":"240 gsm heavyweight cotton","Fit":"Regular","Care":"Machine wash cold"}}'::jsonb
),
(
  'Pango Essential Tee — Multipack (3) — Men', 'pango-essential-tee-multipack-3-men', 'T-Shirts', 'Pango',
  1499, 2499,
  'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=900&auto=format&fit=crop&q=80', '["https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=900&auto=format&fit=crop&q=80","https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=900&auto=format&fit=crop&q=80","https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=900&auto=format&fit=crop&q=80","https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=900&auto=format&fit=crop&q=80"]'::jsonb,
  'Essential Tee — Multipack (3) — Men — cut for Indian winters, stitched for daily wear. Honest pricing, 30-day size exchange.', 'Popular',
  4.6, 2650, 25,
  true, true, now() + interval '3 days',
  '[]'::jsonb,
  '{"1. FABRIC & CARE":{"Gender":"Men","Fabric":"220 gsm combed cotton","Fit":"Regular","Care":"Machine wash cold"}}'::jsonb
),
(
  'Pango Classic Crew Sweatshirt — Men', 'pango-classic-crew-sweatshirt-men', 'Sweatshirts', 'Pango',
  1299, 2199,
  'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=900&auto=format&fit=crop&q=80', '["https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=900&auto=format&fit=crop&q=80","https://images.unsplash.com/photo-1523398002811-999ca8dec234?w=900&auto=format&fit=crop&q=80","https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=900&auto=format&fit=crop&q=80","https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=900&auto=format&fit=crop&q=80"]'::jsonb,
  'Classic Crew Sweatshirt — Men — cut for Indian winters, stitched for daily wear. Honest pricing, 30-day size exchange.', 'Popular',
  4.5, 1640, 25,
  false, true, now() + interval '3 days',
  '["pango-everyday-trackpants-men"]'::jsonb,
  '{"1. FABRIC & CARE":{"Gender":"Men","Fabric":"350 gsm loopback cotton","Fit":"Relaxed","Care":"Cold wash, line dry"}}'::jsonb
),
(
  'Pango Half-Zip Sweatshirt — Men', 'pango-half-zip-sweatshirt-men', 'Sweatshirts', 'Pango',
  1599, 2599,
  'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=900&auto=format&fit=crop&q=80', '["https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=900&auto=format&fit=crop&q=80","https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=900&auto=format&fit=crop&q=80","https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=900&auto=format&fit=crop&q=80","https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=900&auto=format&fit=crop&q=80"]'::jsonb,
  'Half-Zip Sweatshirt — Men — cut for Indian winters, stitched for daily wear. Honest pricing, 30-day size exchange.', '',
  4.6, 1430, 25,
  false, false, null,
  '[]'::jsonb,
  '{"1. FABRIC & CARE":{"Gender":"Men","Fabric":"380 gsm brushed fleece","Fit":"Regular","Care":"Cold wash, line dry"}}'::jsonb
),
(
  'Pango Storm Windcheater Jacket — Men', 'pango-storm-windcheater-jacket-men', 'Jackets', 'Pango',
  2499, 4499,
  'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=900&auto=format&fit=crop&q=80', '["https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=900&auto=format&fit=crop&q=80","https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=900&auto=format&fit=crop&q=80","https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=900&auto=format&fit=crop&q=80","https://images.unsplash.com/photo-1523398002811-999ca8dec234?w=900&auto=format&fit=crop&q=80"]'::jsonb,
  'Storm Windcheater Jacket — Men — cut for Indian winters, stitched for daily wear. Honest pricing, 30-day size exchange.', 'Best Seller',
  4.8, 930, 25,
  true, true, now() + interval '3 days',
  '["pango-essential-oversized-hoodie-men"]'::jsonb,
  '{"1. FABRIC & CARE":{"Gender":"Men","Fabric":"Ripstop polyester, DWR coating","Fit":"Regular water-resistant","Care":"Wipe clean or cold gentle wash"}}'::jsonb
),
(
  'Pango Alpine Puffer Jacket — Men', 'pango-alpine-puffer-jacket-men', 'Jackets', 'Pango',
  4999, 8999,
  'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=900&auto=format&fit=crop&q=80', '["https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=900&auto=format&fit=crop&q=80","https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=900&auto=format&fit=crop&q=80","https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=900&auto=format&fit=crop&q=80","https://images.unsplash.com/photo-1542272604-787c3835535d?w=900&auto=format&fit=crop&q=80"]'::jsonb,
  'Alpine Puffer Jacket — Men — cut for Indian winters, stitched for daily wear. Honest pricing, 30-day size exchange.', 'Premium',
  4.9, 640, 25,
  true, false, null,
  '["pango-wool-blend-sweater-men"]'::jsonb,
  '{"1. FABRIC & CARE":{"Gender":"Men","Fabric":"Quilted nylon, 80 gsm fill","Fit":"Relaxed","Care":"Spot clean only"}}'::jsonb
),
(
  'Pango Wool-Blend Sweater — Men', 'pango-wool-blend-sweater-men', 'Sweaters', 'Pango',
  1899, 3499,
  'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=900&auto=format&fit=crop&q=80', '["https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=900&auto=format&fit=crop&q=80","https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=900&auto=format&fit=crop&q=80","https://images.unsplash.com/photo-1523398002811-999ca8dec234?w=900&auto=format&fit=crop&q=80","https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=900&auto=format&fit=crop&q=80"]'::jsonb,
  'Wool-Blend Sweater — Men — cut for Indian winters, stitched for daily wear. Honest pricing, 30-day size exchange.', 'Featured',
  4.7, 720, 25,
  false, true, now() + interval '3 days',
  '[]'::jsonb,
  '{"1. FABRIC & CARE":{"Gender":"Men","Fabric":"60% wool, 40% acrylic","Fit":"Regular","Care":"Hand wash cold, dry flat"}}'::jsonb
),
(
  'Pango Selvedge Denim — Men', 'pango-selvedge-denim-men', 'Jeans', 'Pango',
  1999, 3499,
  'https://images.unsplash.com/photo-1542272604-787c3835535d?w=900&auto=format&fit=crop&q=80', '["https://images.unsplash.com/photo-1542272604-787c3835535d?w=900&auto=format&fit=crop&q=80","https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=900&auto=format&fit=crop&q=80","https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=900&auto=format&fit=crop&q=80","https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=900&auto=format&fit=crop&q=80"]'::jsonb,
  'Selvedge Denim — Men — cut for Indian winters, stitched for daily wear. Honest pricing, 30-day size exchange.', 'Best Seller',
  4.7, 2760, 25,
  true, true, now() + interval '3 days',
  '[]'::jsonb,
  '{"1. FABRIC & CARE":{"Gender":"Men","Fabric":"13.5 oz selvedge denim","Fit":"Slim straight","Care":"Wash inside out, cold"}}'::jsonb
),
(
  'Pango Relaxed Cargo Joggers — Men', 'pango-relaxed-cargo-joggers-men', 'Joggers', 'Pango',
  1399, 2299,
  'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=900&auto=format&fit=crop&q=80', '["https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=900&auto=format&fit=crop&q=80","https://images.unsplash.com/photo-1542272604-787c3835535d?w=900&auto=format&fit=crop&q=80","https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=900&auto=format&fit=crop&q=80","https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=900&auto=format&fit=crop&q=80"]'::jsonb,
  'Relaxed Cargo Joggers — Men — cut for Indian winters, stitched for daily wear. Honest pricing, 30-day size exchange.', '',
  4.5, 1520, 25,
  false, false, null,
  '[]'::jsonb,
  '{"1. FABRIC & CARE":{"Gender":"Men","Fabric":"280 gsm cotton canvas","Fit":"Relaxed ankle-elastic","Care":"Machine wash cold"}}'::jsonb
),
(
  'Pango Everyday Trackpants — Men', 'pango-everyday-trackpants-men', 'Trackpants', 'Pango',
  999, 1699,
  'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=900&auto=format&fit=crop&q=80', '["https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=900&auto=format&fit=crop&q=80","https://images.unsplash.com/photo-1542272604-787c3835535d?w=900&auto=format&fit=crop&q=80","https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=900&auto=format&fit=crop&q=80","https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=900&auto=format&fit=crop&q=80"]'::jsonb,
  'Everyday Trackpants — Men — cut for Indian winters, stitched for daily wear. Honest pricing, 30-day size exchange.', '',
  4.3, 1180, 25,
  false, false, null,
  '[]'::jsonb,
  '{"1. FABRIC & CARE":{"Gender":"Men","Fabric":"320 gsm loopback cotton","Fit":"Relaxed","Care":"Machine wash cold"}}'::jsonb
),
(
  'Pango Oxford Casual Shirt — Men', 'pango-oxford-casual-shirt-men', 'Shirts', 'Pango',
  1199, 1999,
  'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=900&auto=format&fit=crop&q=80', '["https://images.unsplash.com/photo-1551028719-00167b16eac5?w=900&auto=format&fit=crop&q=80","https://images.unsplash.com/photo-1571945153237-4929e783af4a?w=900&auto=format&fit=crop&q=80","https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=900&auto=format&fit=crop&q=80","https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=900&auto=format&fit=crop&q=80"]'::jsonb,
  'Oxford Casual Shirt — Men — cut for Indian winters, stitched for daily wear. Honest pricing, 30-day size exchange.', 'Featured',
  4.5, 940, 25,
  true, false, null,
  '[]'::jsonb,
  '{"1. FABRIC & CARE":{"Gender":"Men","Fabric":"100% cotton oxford","Fit":"Regular","Care":"Machine wash warm"}}'::jsonb
),
(
  'Pango Plaid Overshirt — Men', 'pango-plaid-overshirt-men', 'Shirts', 'Pango',
  1499, 2599,
  'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=900&auto=format&fit=crop&q=80', '["https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=900&auto=format&fit=crop&q=80","https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=900&auto=format&fit=crop&q=80","https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=900&auto=format&fit=crop&q=80","https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=900&auto=format&fit=crop&q=80"]'::jsonb,
  'Plaid Overshirt — Men — cut for Indian winters, stitched for daily wear. Honest pricing, 30-day size exchange.', 'New',
  4.7, 690, 25,
  false, false, null,
  '[]'::jsonb,
  '{"1. FABRIC & CARE":{"Gender":"Men","Fabric":"Cotton flannel","Fit":"Relaxed","Care":"Cold wash, line dry"}}'::jsonb
),
(
  'Pango Slim Chinos — Men', 'pango-slim-chinos-men', 'Trousers & Pants', 'Pango',
  1699, 2799,
  'https://images.unsplash.com/photo-1542272604-787c3835535d?w=900&auto=format&fit=crop&q=80', '["https://images.unsplash.com/photo-1542272604-787c3835535d?w=900&auto=format&fit=crop&q=80","https://images.unsplash.com/photo-1551028719-00167b16eac5?w=900&auto=format&fit=crop&q=80","https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=900&auto=format&fit=crop&q=80","https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=900&auto=format&fit=crop&q=80"]'::jsonb,
  'Slim Chinos — Men — cut for Indian winters, stitched for daily wear. Honest pricing, 30-day size exchange.', '',
  4.5, 1120, 25,
  false, false, null,
  '[]'::jsonb,
  '{"1. FABRIC & CARE":{"Gender":"Men","Fabric":"Cotton twill","Fit":"Slim tapered","Care":"Machine wash cold"}}'::jsonb
),
(
  'Pango Denim Trucker Jacket — Men', 'pango-denim-trucker-jacket-men', 'Jackets', 'Pango',
  2799, 4799,
  'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=900&auto=format&fit=crop&q=80', '["https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=900&auto=format&fit=crop&q=80","https://images.unsplash.com/photo-1542272604-787c3835535d?w=900&auto=format&fit=crop&q=80","https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=900&auto=format&fit=crop&q=80","https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=900&auto=format&fit=crop&q=80"]'::jsonb,
  'Denim Trucker Jacket — Men — cut for Indian winters, stitched for daily wear. Honest pricing, 30-day size exchange.', 'Best Seller',
  4.7, 860, 25,
  false, false, null,
  '[]'::jsonb,
  '{"1. FABRIC & CARE":{"Gender":"Men","Fabric":"12 oz denim","Fit":"Classic trucker","Care":"Wash inside out, cold"}}'::jsonb
),
(
  'Pango Boyfriend Tee — Women', 'pango-boyfriend-tee-women', 'T-Shirts', 'Pango',
  599, 999,
  'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=900&auto=format&fit=crop&q=80', '["https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=900&auto=format&fit=crop&q=80","https://images.unsplash.com/photo-1544441893-675973e31985?w=900&auto=format&fit=crop&q=80","https://images.unsplash.com/photo-1509631179647-0177331693ae?w=900&auto=format&fit=crop&q=80","https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=900&auto=format&fit=crop&q=80"]'::jsonb,
  'Boyfriend Tee — Women — cut for Indian winters, stitched for daily wear. Honest pricing, 30-day size exchange.', 'Popular',
  4.6, 2440, 25,
  false, true, now() + interval '3 days',
  '[]'::jsonb,
  '{"1. FABRIC & CARE":{"Gender":"Women","Fabric":"220 gsm combed cotton","Fit":"Oversized boyfriend","Care":"Machine wash cold"}}'::jsonb
),
(
  'Pango Essential Hoodie — Women', 'pango-essential-hoodie-women', 'Hoodies', 'Pango',
  1499, 2499,
  'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=900&auto=format&fit=crop&q=80', '["https://images.unsplash.com/photo-1509631179647-0177331693ae?w=900&auto=format&fit=crop&q=80","https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=900&auto=format&fit=crop&q=80","https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=900&auto=format&fit=crop&q=80","https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=900&auto=format&fit=crop&q=80"]'::jsonb,
  'Essential Hoodie — Women — cut for Indian winters, stitched for daily wear. Honest pricing, 30-day size exchange.', 'Best Seller',
  4.8, 2010, 25,
  true, true, now() + interval '3 days',
  '["pango-high-rise-jeans-women"]'::jsonb,
  '{"1. FABRIC & CARE":{"Gender":"Women","Fabric":"400 gsm brushed fleece","Fit":"Relaxed","Care":"Cold wash, line dry"}}'::jsonb
),
(
  'Pango Cropped Hoodie — Women', 'pango-cropped-hoodie-women', 'Hoodies', 'Pango',
  1299, 2199,
  'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=900&auto=format&fit=crop&q=80', '["https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=900&auto=format&fit=crop&q=80","https://images.unsplash.com/photo-1509631179647-0177331693ae?w=900&auto=format&fit=crop&q=80","https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=900&auto=format&fit=crop&q=80","https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=900&auto=format&fit=crop&q=80"]'::jsonb,
  'Cropped Hoodie — Women — cut for Indian winters, stitched for daily wear. Honest pricing, 30-day size exchange.', 'New',
  4.6, 870, 25,
  false, false, null,
  '[]'::jsonb,
  '{"1. FABRIC & CARE":{"Gender":"Women","Fabric":"380 gsm brushed fleece","Fit":"Cropped relaxed","Care":"Cold wash, line dry"}}'::jsonb
),
(
  'Pango Alpine Puffer Jacket — Women', 'pango-alpine-puffer-jacket-women', 'Jackets', 'Pango',
  3999, 7499,
  'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=900&auto=format&fit=crop&q=80', '["https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=900&auto=format&fit=crop&q=80","https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=900&auto=format&fit=crop&q=80","https://images.unsplash.com/photo-1445205170230-053b83016050?w=900&auto=format&fit=crop&q=80","https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=900&auto=format&fit=crop&q=80"]'::jsonb,
  'Alpine Puffer Jacket — Women — cut for Indian winters, stitched for daily wear. Honest pricing, 30-day size exchange.', 'Premium',
  4.9, 580, 25,
  true, true, now() + interval '3 days',
  '["pango-knit-sweater-women"]'::jsonb,
  '{"1. FABRIC & CARE":{"Gender":"Women","Fabric":"Quilted nylon, 80 gsm fill","Fit":"Relaxed","Care":"Spot clean only"}}'::jsonb
),
(
  'Pango Windcheater — Women', 'pango-windcheater-women', 'Jackets', 'Pango',
  2299, 3999,
  'https://images.unsplash.com/photo-1445205170230-053b83016050?w=900&auto=format&fit=crop&q=80', '["https://images.unsplash.com/photo-1445205170230-053b83016050?w=900&auto=format&fit=crop&q=80","https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=900&auto=format&fit=crop&q=80","https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=900&auto=format&fit=crop&q=80","https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=900&auto=format&fit=crop&q=80"]'::jsonb,
  'Windcheater — Women — cut for Indian winters, stitched for daily wear. Honest pricing, 30-day size exchange.', '',
  4.6, 760, 25,
  false, false, null,
  '[]'::jsonb,
  '{"1. FABRIC & CARE":{"Gender":"Women","Fabric":"Ripstop polyester, DWR coating","Fit":"Regular water-resistant","Care":"Wipe clean or cold gentle wash"}}'::jsonb
),
(
  'Pango Studio Co-ord Set — Women', 'pango-studio-co-ord-set-women', 'Co-ord Sets', 'Pango',
  1799, 2999,
  'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=900&auto=format&fit=crop&q=80', '["https://images.unsplash.com/photo-1509631179647-0177331693ae?w=900&auto=format&fit=crop&q=80","https://images.unsplash.com/photo-1445205170230-053b83016050?w=900&auto=format&fit=crop&q=80","https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=900&auto=format&fit=crop&q=80","https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=900&auto=format&fit=crop&q=80"]'::jsonb,
  'Studio Co-ord Set — Women — cut for Indian winters, stitched for daily wear. Honest pricing, 30-day size exchange.', 'Featured',
  4.7, 1320, 25,
  true, true, now() + interval '3 days',
  '[]'::jsonb,
  '{"1. FABRIC & CARE":{"Gender":"Women","Fabric":"Fleece top + knit bottom","Fit":"Relaxed co-ordinated","Care":"Cold wash, line dry"}}'::jsonb
),
(
  'Pango Knit Sweater — Women', 'pango-knit-sweater-women', 'Sweaters', 'Pango',
  1699, 2999,
  'https://images.unsplash.com/photo-1445205170230-053b83016050?w=900&auto=format&fit=crop&q=80', '["https://images.unsplash.com/photo-1445205170230-053b83016050?w=900&auto=format&fit=crop&q=80","https://images.unsplash.com/photo-1620012253295-c15cc3e65df4?w=900&auto=format&fit=crop&q=80","https://images.unsplash.com/photo-1509631179647-0177331693ae?w=900&auto=format&fit=crop&q=80","https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=900&auto=format&fit=crop&q=80"]'::jsonb,
  'Knit Sweater — Women — cut for Indian winters, stitched for daily wear. Honest pricing, 30-day size exchange.', '',
  4.6, 890, 25,
  false, false, null,
  '[]'::jsonb,
  '{"1. FABRIC & CARE":{"Gender":"Women","Fabric":"Acrylic knit","Fit":"Relaxed","Care":"Hand wash cold, dry flat"}}'::jsonb
),
(
  'Pango High-Rise Jeans — Women', 'pango-high-rise-jeans-women', 'Jeans', 'Pango',
  1899, 3299,
  'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=900&auto=format&fit=crop&q=80', '["https://images.unsplash.com/photo-1509631179647-0177331693ae?w=900&auto=format&fit=crop&q=80","https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=900&auto=format&fit=crop&q=80","https://images.unsplash.com/photo-1542272604-787c3835535d?w=900&auto=format&fit=crop&q=80","https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=900&auto=format&fit=crop&q=80"]'::jsonb,
  'High-Rise Jeans — Women — cut for Indian winters, stitched for daily wear. Honest pricing, 30-day size exchange.', '',
  4.5, 1740, 25,
  false, false, null,
  '[]'::jsonb,
  '{"1. FABRIC & CARE":{"Gender":"Women","Fabric":"11 oz stretch denim","Fit":"High-rise straight","Care":"Wash inside out, cold"}}'::jsonb
),
(
  'Pango Wide-Leg Trousers — Women', 'pango-wide-leg-trousers-women', 'Trousers & Pants', 'Pango',
  1699, 2799,
  'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=900&auto=format&fit=crop&q=80', '["https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=900&auto=format&fit=crop&q=80","https://images.unsplash.com/photo-1445205170230-053b83016050?w=900&auto=format&fit=crop&q=80","https://images.unsplash.com/photo-1509631179647-0177331693ae?w=900&auto=format&fit=crop&q=80","https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=900&auto=format&fit=crop&q=80"]'::jsonb,
  'Wide-Leg Trousers — Women — cut for Indian winters, stitched for daily wear. Honest pricing, 30-day size exchange.', 'New',
  4.4, 980, 25,
  false, false, null,
  '[]'::jsonb,
  '{"1. FABRIC & CARE":{"Gender":"Women","Fabric":"Cotton twill","Fit":"Wide-leg high-rise","Care":"Machine wash cold"}}'::jsonb
),
(
  'Pango Wide Cargo Pants — Women', 'pango-wide-cargo-pants-women', 'Joggers', 'Pango',
  1599, 2699,
  'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=900&auto=format&fit=crop&q=80', '["https://images.unsplash.com/photo-1509631179647-0177331693ae?w=900&auto=format&fit=crop&q=80","https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=900&auto=format&fit=crop&q=80","https://images.unsplash.com/photo-1445205170230-053b83016050?w=900&auto=format&fit=crop&q=80","https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=900&auto=format&fit=crop&q=80"]'::jsonb,
  'Wide Cargo Pants — Women — cut for Indian winters, stitched for daily wear. Honest pricing, 30-day size exchange.', '',
  4.5, 730, 25,
  false, false, null,
  '[]'::jsonb,
  '{"1. FABRIC & CARE":{"Gender":"Women","Fabric":"Cotton canvas","Fit":"Relaxed wide","Care":"Machine wash cold"}}'::jsonb
),
(
  'Pango Oversized Shirt — Women', 'pango-oversized-shirt-women', 'Shirts', 'Pango',
  1299, 2199,
  'https://images.unsplash.com/photo-1445205170230-053b83016050?w=900&auto=format&fit=crop&q=80', '["https://images.unsplash.com/photo-1445205170230-053b83016050?w=900&auto=format&fit=crop&q=80","https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=900&auto=format&fit=crop&q=80","https://images.unsplash.com/photo-1509631179647-0177331693ae?w=900&auto=format&fit=crop&q=80","https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=900&auto=format&fit=crop&q=80"]'::jsonb,
  'Oversized Shirt — Women — cut for Indian winters, stitched for daily wear. Honest pricing, 30-day size exchange.', 'Popular',
  4.6, 1150, 25,
  false, false, null,
  '[]'::jsonb,
  '{"1. FABRIC & CARE":{"Gender":"Women","Fabric":"100% cotton poplin","Fit":"Oversized boyfriend","Care":"Machine wash warm"}}'::jsonb
),
(
  'Pango Boyfriend Denim Jacket — Women', 'pango-boyfriend-denim-jacket-women', 'Jackets', 'Pango',
  2599, 4299,
  'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=900&auto=format&fit=crop&q=80', '["https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=900&auto=format&fit=crop&q=80","https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=900&auto=format&fit=crop&q=80","https://images.unsplash.com/photo-1509631179647-0177331693ae?w=900&auto=format&fit=crop&q=80","https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=900&auto=format&fit=crop&q=80"]'::jsonb,
  'Boyfriend Denim Jacket — Women — cut for Indian winters, stitched for daily wear. Honest pricing, 30-day size exchange.', '',
  4.6, 690, 25,
  false, false, null,
  '[]'::jsonb,
  '{"1. FABRIC & CARE":{"Gender":"Women","Fabric":"12 oz denim","Fit":"Relaxed boyfriend","Care":"Wash inside out, cold"}}'::jsonb
),
(
  'Pango Winter Co-ord Set — Women', 'pango-winter-co-ord-set-women', 'Co-ord Sets', 'Pango',
  2199, 3699,
  'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=900&auto=format&fit=crop&q=80', '["https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=900&auto=format&fit=crop&q=80","https://images.unsplash.com/photo-1509631179647-0177331693ae?w=900&auto=format&fit=crop&q=80","https://images.unsplash.com/photo-1445205170230-053b83016050?w=900&auto=format&fit=crop&q=80","https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=900&auto=format&fit=crop&q=80"]'::jsonb,
  'Winter Co-ord Set — Women — cut for Indian winters, stitched for daily wear. Honest pricing, 30-day size exchange.', 'New',
  4.7, 520, 25,
  false, false, null,
  '[]'::jsonb,
  '{"1. FABRIC & CARE":{"Gender":"Women","Fabric":"Sweatshirt + jogger twinset","Fit":"Relaxed co-ordinated","Care":"Cold wash, line dry"}}'::jsonb
);

commit;
