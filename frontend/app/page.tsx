import type { Metadata } from "next";
import { Fragment, type ReactNode } from "react";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Hero from "./components/home/Hero";
import UpiBanner from "./components/home/UpiBanner";
import ProductRail from "./components/home/ProductRail";
import ComboRail from "./components/home/ComboRail";
import CollectionRail from "./components/home/CollectionRail";
import WinterRollout from "./components/home/WinterRollout";
import TrustStrip from "./components/home/TrustStrip";
import QuickShop from "./components/home/QuickShop";
import Reviews from "./components/home/Reviews";
import InfiniteArrivals from "./components/home/InfiniteArrivals";
import HomeRefresh from "./components/home/HomeRefresh";
import { loadCollection, loadCombos, loadHomeData, loadHomeSections } from "@/lib/home-data";
import { csvList, type HomeSectionKey } from "@/lib/homepage-content";
import type { Product } from "@/lib/product-shape";
import { SITE } from "@/lib/site";
import { Info } from "lucide-react";

/**
 * The storefront homepage, following the Beyoung-style campaign layout:
 * editorial hero → UPI offer strip → COMBOS / NEW LAUNCH rails → winter
 * feature banner → trust strip → FEELS GOOD rail → category quick shop →
 * customer reviews → infinite NEW ARRIVALS grid.
 *
 * Every block is admin-editable from Admin → Customize Homepage, including its
 * on/off switch *and its position*: `sections.order` decides the render order.
 * The announcement strip lives in the navbar, which reads the same payload.
 */
export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: `${SITE.name} — ${SITE.tagline}`,
};

// Section content is fetched uncached so an admin enable/disable/reorder takes
// effect on the very next request. This page is therefore rendered per request.
export const dynamic = "force-dynamic";

/** Picks products by explicit slugs (admin override), falling back to the given list. */
function pickProducts(
  all: Product[],
  slugsCsv: string,
  fallback: Product[],
  count: number
): Product[] {
  const slugs = csvList(slugsCsv);
  if (slugs.length === 0) return fallback.slice(0, count);

  const bySlug = new Map(all.map((product) => [product.slug, product]));
  const picked = slugs
    .map((slug) => bySlug.get(slug))
    .filter((product): product is Product => Boolean(product));
  return picked.length > 0 ? picked : fallback.slice(0, count);
}

export default async function Home() {
  const [data, sections, comboData, newArrivalsData] = await Promise.all([
    loadHomeData(),
    loadHomeSections(),
    loadCombos(),
    loadCollection("new-arrivals"),
  ]);

  // The COMBOS rail is driven by Admin → Combo Products, matching the navbar
  // COMBOS link which opens the combo listing page. NEW LAUNCH comes from the
  // admin-managed New Arrivals collection and links to the same page.
  const combos = comboData.combos.filter((c) => c.active).slice(0, 12);
  const newLaunch = newArrivalsData.items.filter((i) => i.active).slice(0, 12);
  const feelsGood = pickProducts(
    data.products,
    "",
    data.byCategory.find(
      (group) => group.category.toLowerCase() === sections.feelsGood.category.toLowerCase()
    )?.products ?? data.bestSellers,
    8
  );

  const categoryNames = data.categories.map((c) => c.category);

  // One renderer per section key. The admin-controlled order then simply picks
  // from this map, so reordering never has to touch the JSX below.
  const sectionNodes: Record<HomeSectionKey, ReactNode> = {
    // Rendered inside the fixed navbar instead of the page body.
    announcement: null,
    hero: <Hero hero={sections.hero} />,
    upiBanner: <UpiBanner upiBanner={sections.upiBanner} />,
    combos: sections.combos.enabled && combos.length > 0 ? (
      <ComboRail
        title={sections.combos.title}
        subtitle={sections.combos.subtitle}
        badge={sections.combos.badge}
        combos={combos}
      />
    ) : null,
    newLaunch: sections.newLaunch.enabled && newLaunch.length > 0 ? (
      <CollectionRail
        title={sections.newLaunch.title}
        subtitle={sections.newLaunch.subtitle}
        items={newLaunch}
        collectionKey="new-arrivals"
        label="New Arrivals"
      />
    ) : null,
    winterRollout: <WinterRollout winterRollout={sections.winterRollout} />,
    trustStrip: <TrustStrip trustStrip={sections.trustStrip} />,
    feelsGood:
      sections.feelsGood.enabled && (feelsGood.length > 0 || sections.feelsGood.cards.length > 0) ? (
        <ProductRail
          title={sections.feelsGood.title}
          subtitle={sections.feelsGood.subtitle}
          href="/product-page"
          products={feelsGood}
          cards={sections.feelsGood.cards}
          overlay
        />
      ) : null,
    quickShop: <QuickShop quickShop={sections.quickShop} />,
    reviews: <Reviews reviews={sections.reviews} />,
    newArrivals: sections.newArrivals.enabled ? (
      <InfiniteArrivals categories={categoryNames} heading={sections.newArrivals} />
    ) : null,
  };

  return (
    <div className="min-h-screen bg-[#faf8f5] text-[#171512] antialiased">
      {/* ── NAVBAR (carries the admin-editable announcement strip) ── */}
      <Navbar />

      <main>
        {/* Refreshes this tab when another tab saves the homepage in Admin. */}
        <HomeRefresh />

        {/* ── DATA-SOURCE NOTICE (fallback mode only) ── */}
        {data.notice ? (
          <div className="border-b border-amber-200 bg-amber-50">
            <div className="mx-auto flex max-w-[1680px] items-start gap-2.5 px-4 py-2 text-xs text-amber-900 sm:px-6 lg:px-8">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
              <p>{data.notice}</p>
            </div>
          </div>
        ) : null}

        {sections.order.map((key) => (
          <Fragment key={key}>{sectionNodes[key]}</Fragment>
        ))}
      </main>

      {/* ── FOOTER ── */}
      <Footer />
    </div>
  );
}
