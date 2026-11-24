/**
 * Homepage section content (admin-editable).
 *
 * The storefront renders the homepage from these sections. Every section can be
 * turned on/off and its copy edited from Admin → Customize Homepage. Admin edits
 * are stored one row per section in the `homepage_sections` table; this module
 * merges whatever is in the table over the built-in defaults below, so the
 * homepage always renders something sensible — an empty table (or a missing
 * one) is a first-run state, not an error.
 *
 * The layout follows the Beyoung-style campaign homepage: an editorial hero, a
 * UPI offer strip, combo / new-launch rails, a winter feature banner, a trust
 * strip, a category quick-shop, social proof and the infinite New Arrivals grid.
 *
 * Payload shapes are deliberately flat (strings, booleans, small fixed-size
 * lists) so the admin editor stays simple and the API validation stays cheap.
 *
 * NOTE: this file exists twice — `frontend/lib/homepage-content.ts` and
 * `backend/lib/homepage-content.ts`. Keep the two byte-identical apart from
 * `getHomepageSections()`, which only the backend copy defines: the backend
 * merges and stores, the frontend renders.
 */

export type HomeSectionKey =
  | "announcement"
  | "hero"
  | "upiBanner"
  | "combos"
  | "newLaunch"
  | "winterRollout"
  | "trustStrip"
  | "feelsGood"
  | "quickShop"
  | "reviews"
  | "newArrivals";

export type HeroSlide = {
  eyebrow: string;
  title: string;
  subtitle: string;
  hashtag: string;
  hashtagHref: string;
  image: string;
  /** e.g. "STARTING AT JUST ₹799" — the price hook on the right of the hero. */
  priceLabel: string;
  ctaLabel: string;
  ctaHref: string;
};

export type WinterCard = { image: string; label: string; slug: string };
/** A fully admin-authored card: image, copy, price and link, with no product needed. */
export type HomeCard = {
  image: string;
  title: string;
  description: string;
  priceLabel: string;
  href: string;
};
export type QuickShopItem = { label: string; image: string; href: string };
export type ReviewItem = {
  name: string;
  product: string;
  text: string;
  rating: number;
  image: string;
};

export type HomeSections = {
  /** The order sections appear on the storefront. Admin-reorderable. */
  order: HomeSectionKey[];
  announcement: { enabled: boolean; text: string };
  hero: { enabled: boolean; slides: HeroSlide[] };
  upiBanner: { enabled: boolean; title: string; subtitle: string };
  /** csv product slugs; "" = pick automatically from the catalogue. `cards` overrides products when present. */
  combos: { enabled: boolean; title: string; subtitle: string; badge: string; slugs: string; cards: HomeCard[] };
  newLaunch: { enabled: boolean; title: string; subtitle: string; slugs: string; cards: HomeCard[] };
  winterRollout: {
    enabled: boolean;
    eyebrow: string;
    title: string;
    subtitle: string;
    ctaLabel: string;
    ctaHref: string;
    background: string;
    cards: WinterCard[];
  };
  /** csv strings, exactly three shown */
  trustStrip: { enabled: boolean; items: string };
  feelsGood: { enabled: boolean; title: string; subtitle: string; category: string; cards: HomeCard[] };
  quickShop: { enabled: boolean; title: string; subtitle: string; items: QuickShopItem[] };
  reviews: { enabled: boolean; title: string; subtitle: string; items: ReviewItem[] };
  /** csv category chips; "" = derive the chips from the live catalogue */
  newArrivals: {
    enabled: boolean;
    title: string;
    subtitle: string;
    viewAllHref: string;
    categories: string;
    cards: HomeCard[];
  };
};

export const SECTION_KEYS: HomeSectionKey[] = [
  "announcement",
  "hero",
  "upiBanner",
  "combos",
  "newLaunch",
  "winterRollout",
  "trustStrip",
  "feelsGood",
  "quickShop",
  "reviews",
  "newArrivals",
];

const UNSPLASH = "https://images.unsplash.com/photo-";
const img = (id: string, w = 1200) =>
  `${UNSPLASH}${id}?w=${w}&auto=format&fit=crop&q=80`;

const MAX_HERO_SLIDES = 4;
const MAX_WINTER_CARDS = 3;
const MAX_QUICK_SHOP = 12;
const MAX_REVIEWS = 8;
const MAX_CARDS = 12;

export const DEFAULT_SECTIONS: HomeSections = {
  order: [...SECTION_KEYS],
  announcement: {
    enabled: true,
    text: "Free Shipping Sitewide on Every Order, Don't Miss Out!!",
  },
  hero: {
    enabled: true,
    slides: [
      {
        eyebrow: "New Season",
        title: "The Shirt Playbook",
        subtitle: "More Ways to Make a Statement",
        hashtag: "#SEASONOFHERITAGE",
        hashtagHref: "/product-page?category=Shirts",
        image: img("1520975954732-35dd22299614", 1600),
        priceLabel: "Starting at just ₹799",
        ctaLabel: "Explore Shirts",
        ctaHref: "/product-page?category=Shirts",
      },
      {
        eyebrow: "Winter Collection 2026",
        title: "The Winter Playbook",
        subtitle: "Layer up without the markup",
        hashtag: "#SEASONOFHERITAGE",
        hashtagHref: "/product-page",
        image: img("1509631179647-0177331693ae", 1600),
        priceLabel: "Starting at just ₹999",
        ctaLabel: "Explore Winterwear",
        ctaHref: "/product-page",
      },
      {
        eyebrow: "The Everyday Edit",
        title: "Worn In, Not Out",
        subtitle: "Shirts that keep up with every plan",
        hashtag: "#EVERYDAYLAYERS",
        hashtagHref: "/product-page?category=Shirts",
        image: img("1529139574466-a303027c1d8b", 1600),
        priceLabel: "Starting at just ₹699",
        ctaLabel: "Shop Shirts",
        ctaHref: "/product-page?category=Shirts",
      },
      {
        eyebrow: "New Season Essentials",
        title: "Made For Mondays",
        subtitle: "Easy layers, effortless mornings",
        hashtag: "#NEWESSENTIALS",
        hashtagHref: "/product-page",
        image: img("1516257984-b1b4d707412e", 1600),
        priceLabel: "Starting at just ₹599",
        ctaLabel: "Shop Essentials",
        ctaHref: "/product-page",
      },
    ],
  },
  upiBanner: {
    enabled: true,
    title: "GET AN EXTRA ₹29 OFF",
    subtitle: "Instant on UPI & prepaid Orders",
  },
  combos: {
    enabled: true,
    title: "COMBOS",
    subtitle: "30 Lakh+ times Bharat said “yes” to value.",
    badge: "BUY 2 GET 15% OFF",
    slugs: "",
    cards: [],
  },
  newLaunch: {
    enabled: true,
    title: "NEW LAUNCH",
    subtitle: "Outfits for More Plans More Looks",
    slugs: "",
    cards: [],
  },
  winterRollout: {
    enabled: true,
    eyebrow: "Winter Rollout",
    title: "Your layering season starts here.",
    subtitle: "",
    ctaLabel: "Shop Winter Wear",
    ctaHref: "/winterwear",
    background: img("1509631179647-0177331693ae", 1800),
    cards: [],
  },
  trustStrip: {
    enabled: true,
    items: "COD AVAILABLE,7 DAYS RETURN,50L+ HAPPY CUSTOMERS",
  },
  feelsGood: {
    enabled: true,
    title: "FEELS GOOD. LITERALLY.",
    subtitle: "Let the softness do the talking.",
    category: "Trousers & Pants",
    cards: [],
  },
  quickShop: {
    enabled: true,
    title: "Quick shop by CATEGORIES",
    subtitle: "Find your fit in seconds",
    items: [
      { label: "Shirts", image: img("1596755094514-f87e34085b2c", 600), href: "/product-page?category=Shirts" },
      { label: "Trousers", image: img("1542272604-787c3835535d", 600), href: "/product-page?category=Trousers%20%26%20Pants" },
      { label: "Cargo", image: img("1594633312681-425c7b97ccd1", 600), href: "/product-page?category=Joggers" },
      { label: "Kurta", image: img("1617627143750-d86bc21e42bb", 600), href: "/product-page" },
      { label: "Winterwear", image: img("1523398002811-999ca8dec234", 600), href: "/product-page" },
      { label: "Jeans", image: img("1541099649105-f69ad21f3246", 600), href: "/product-page?category=Jeans" },
      { label: "Full Sleeves", image: img("1521572163474-6864f9cf17ab", 600), href: "/product-page?category=T-Shirts" },
    ],
  },
  reviews: {
    enabled: true,
    title: "PANGO APPROVED",
    subtitle: "Real reviews from real people",
    items: [
      {
        name: "Rohit M.",
        product: "Pango Essential Oversized Hoodie — Men",
        text: "400 gsm fabric is the real deal. Wore it through two Delhi winters and it still looks new.",
        rating: 5,
        image: img("1500648767791-00dcc994a43e", 400),
      },
      {
        name: "Sneha K.",
        product: "Pango Alpine Puffer Jacket — Women",
        text: "Warm, light and the fit is spot on. Beat my expectations for the price twice over.",
        rating: 5,
        image: img("1494790108377-be9c29b29330", 400),
      },
      {
        name: "Arjun D.",
        product: "Pango Selvedge Denim — Men",
        text: "Best denim I have tried under 2k. True to size and the wash is clean.",
        rating: 4,
        image: img("1507003211169-0a1dd7228f2d", 400),
      },
      {
        name: "Priya N.",
        product: "Pango Knit Sweater — Women",
        text: "Soft, not itchy, and layers perfectly under my puffer. Will buy again.",
        rating: 5,
        image: img("1438761681033-6461ffad8d80", 400),
      },
    ],
  },
  newArrivals: {
    enabled: true,
    title: "NEW ARRIVALS",
    subtitle: "Get them before everyone else does",
    viewAllHref: "/product-page",
    categories: "",
    cards: [],
  },
};

/** Splits a comma-separated admin field into trimmed, non-empty parts. */
export function csvList(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((v) => String(v).trim()).filter(Boolean);
  return String(value ?? "")
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

const str = (value: unknown, fallback: string): string => {
  const s = String(value ?? "").trim();
  return s.length > 0 ? s.slice(0, 500) : fallback;
};

const bool = (value: unknown, fallback: boolean): boolean =>
  typeof value === "boolean" ? value : String(value ?? "") === "true" ? true : String(value ?? "") === "false" ? false : fallback;

const clampStrings = (value: unknown, fallback: string): string => {
  // Long free text (descriptions) — trim to a sane ceiling but keep newlines.
  const s = String(value ?? "").slice(0, 2000);
  return s.trim().length > 0 ? s : fallback;
};

const href = (value: unknown, fallback: string): string => {
  const s = str(value, fallback);
  // Reject javascript: URLs — the field is rendered as a link.
  if (/^\s*javascript:/i.test(s)) return fallback;
  return s;
};

function mergeAnnouncement(
  defaults: HomeSections["announcement"],
  v: Record<string, unknown>
): HomeSections["announcement"] {
  return {
    enabled: bool(v.enabled, defaults.enabled),
    text: clampStrings(v.text, defaults.text),
  };
}

/**
 * Merges hero slides positionally over the defaults.
 *
 * A slide the admin only retitles keeps the default image and CTA, so editing
 * one field never blanks the rest of the slide. Slides without a title and an
 * image are dropped.
 */
function cleanSlides(value: unknown, fallback: HeroSlide[]): HeroSlide[] {
  if (!Array.isArray(value)) return fallback;
  const slides = value.slice(0, MAX_HERO_SLIDES).map((raw, index) => {
    const o = (raw ?? {}) as Record<string, unknown>;
    const base = fallback[index] ?? fallback[fallback.length - 1];
    return {
      eyebrow: str(o.eyebrow, base.eyebrow),
      title: str(o.title, base.title),
      subtitle: clampStrings(o.subtitle, base.subtitle),
      hashtag: str(o.hashtag, base.hashtag),
      hashtagHref: href(o.hashtagHref, base.hashtagHref),
      image: str(o.image, base.image),
      priceLabel: str(o.priceLabel, base.priceLabel),
      ctaLabel: str(o.ctaLabel, base.ctaLabel),
      ctaHref: href(o.ctaHref, base.ctaHref),
    };
  });
  const usable = slides.filter((slide) => slide.title || slide.image);
  return usable.length > 0 ? usable : fallback;
}

function mergeHero(defaults: HomeSections["hero"], v: Record<string, unknown>): HomeSections["hero"] {
  return {
    enabled: bool(v.enabled, defaults.enabled),
    slides: cleanSlides(v.slides, defaults.slides),
  };
}

function mergeUpiBanner(defaults: HomeSections["upiBanner"], v: Record<string, unknown>): HomeSections["upiBanner"] {
  return {
    enabled: bool(v.enabled, defaults.enabled),
    title: str(v.title, defaults.title),
    subtitle: clampStrings(v.subtitle, defaults.subtitle),
  };
}

/** Admin-authored cards. A card needs at least a title or an image to survive. */
const cleanCards = (value: unknown, fallback: HomeCard[]): HomeCard[] => {
  if (!Array.isArray(value)) return fallback;
  const cards = value
    .map((raw) => {
      const o = (raw ?? {}) as Record<string, unknown>;
      return {
        image: String(o.image ?? "").trim().slice(0, 500),
        title: String(o.title ?? "").trim().slice(0, 120),
        description: String(o.description ?? "").trim().slice(0, 500),
        priceLabel: String(o.priceLabel ?? "").trim().slice(0, 120),
        href: href(o.href, ""),
      };
    })
    .filter((card) => card.title || card.image);
  return cards.length > 0 ? cards.slice(0, MAX_CARDS) : fallback;
};

function mergeCombos(defaults: HomeSections["combos"], v: Record<string, unknown>): HomeSections["combos"] {
  return {
    enabled: bool(v.enabled, defaults.enabled),
    title: str(v.title, defaults.title),
    subtitle: clampStrings(v.subtitle, defaults.subtitle),
    badge: str(v.badge, defaults.badge),
    slugs: str(v.slugs, defaults.slugs),
    cards: cleanCards(v.cards, defaults.cards),
  };
}

function mergeNewLaunch(defaults: HomeSections["newLaunch"], v: Record<string, unknown>): HomeSections["newLaunch"] {
  return {
    enabled: bool(v.enabled, defaults.enabled),
    title: str(v.title, defaults.title),
    subtitle: clampStrings(v.subtitle, defaults.subtitle),
    slugs: str(v.slugs, defaults.slugs),
    cards: cleanCards(v.cards, defaults.cards),
  };
}

const cleanWinterCards = (value: unknown, fallback: WinterCard[]): WinterCard[] => {
  if (!Array.isArray(value)) return fallback;
  const cards = value
    .map((raw) => {
      const o = (raw ?? {}) as Record<string, unknown>;
      return {
        image: str(o.image, ""),
        label: str(o.label, "").slice(0, 60),
        slug: str(o.slug, "").slice(0, 200),
      };
    })
    .filter((card) => card.image);
  return cards.length > 0 ? cards.slice(0, MAX_WINTER_CARDS) : fallback;
};

function mergeWinterRollout(
  defaults: HomeSections["winterRollout"],
  v: Record<string, unknown>
): HomeSections["winterRollout"] {
  return {
    enabled: bool(v.enabled, defaults.enabled),
    eyebrow: str(v.eyebrow, defaults.eyebrow),
    title: str(v.title, defaults.title),
    subtitle: clampStrings(v.subtitle, defaults.subtitle),
    ctaLabel: str(v.ctaLabel, defaults.ctaLabel),
    ctaHref: href(v.ctaHref, defaults.ctaHref),
    background: str(v.background, defaults.background),
    cards: cleanWinterCards(v.cards, defaults.cards),
  };
}

function mergeTrustStrip(defaults: HomeSections["trustStrip"], v: Record<string, unknown>): HomeSections["trustStrip"] {
  return { enabled: bool(v.enabled, defaults.enabled), items: str(v.items, defaults.items) };
}

function mergeFeelsGood(defaults: HomeSections["feelsGood"], v: Record<string, unknown>): HomeSections["feelsGood"] {
  return {
    enabled: bool(v.enabled, defaults.enabled),
    title: str(v.title, defaults.title),
    subtitle: clampStrings(v.subtitle, defaults.subtitle),
    category: str(v.category, defaults.category),
    cards: cleanCards(v.cards, defaults.cards),
  };
}

const cleanQuickShop = (value: unknown, fallback: QuickShopItem[]): QuickShopItem[] => {
  if (!Array.isArray(value)) return fallback;
  const items = value
    .map((raw) => {
      const o = (raw ?? {}) as Record<string, unknown>;
      return {
        label: String(o.label ?? "").trim().slice(0, 60),
        image: String(o.image ?? "").trim().slice(0, 500),
        href: String(o.href ?? "").trim().slice(0, 300),
      };
    })
    .filter((item) => item.label && item.image && item.href);
  return items.length > 0 ? items.slice(0, MAX_QUICK_SHOP) : fallback;
};

const cleanReviews = (value: unknown, fallback: ReviewItem[]): ReviewItem[] => {
  if (!Array.isArray(value)) return fallback;
  const items = value
    .map((raw) => {
      const o = (raw ?? {}) as Record<string, unknown>;
      const rating = Math.min(5, Math.max(1, Math.round(Number(o.rating) || 5)));
      return {
        name: String(o.name ?? "").trim().slice(0, 80),
        product: String(o.product ?? "").trim().slice(0, 120),
        text: String(o.text ?? "").trim().slice(0, 600),
        rating,
        image: String(o.image ?? "").trim().slice(0, 500),
      };
    })
    .filter((item) => item.name && item.text);
  return items.length > 0 ? items.slice(0, MAX_REVIEWS) : fallback;
};

function mergeQuickShop(defaults: HomeSections["quickShop"], v: Record<string, unknown>): HomeSections["quickShop"] {
  return {
    enabled: bool(v.enabled, defaults.enabled),
    title: str(v.title, defaults.title),
    subtitle: clampStrings(v.subtitle, defaults.subtitle),
    items: cleanQuickShop(v.items, defaults.items),
  };
}

function mergeReviews(defaults: HomeSections["reviews"], v: Record<string, unknown>): HomeSections["reviews"] {
  return {
    enabled: bool(v.enabled, defaults.enabled),
    title: str(v.title, defaults.title),
    subtitle: clampStrings(v.subtitle, defaults.subtitle),
    items: cleanReviews(v.items, defaults.items),
  };
}

function mergeNewArrivals(
  defaults: HomeSections["newArrivals"],
  v: Record<string, unknown>
): HomeSections["newArrivals"] {
  return {
    enabled: bool(v.enabled, defaults.enabled),
    title: str(v.title, defaults.title),
    subtitle: clampStrings(v.subtitle, defaults.subtitle),
    viewAllHref: href(v.viewAllHref, defaults.viewAllHref),
    categories: str(v.categories, defaults.categories),
    cards: cleanCards(v.cards, defaults.cards),
  };
}

/** Merges one section payload over its defaults. Unknown fields are dropped. */
export function mergeSection<K extends HomeSectionKey>(
  key: K,
  value: unknown,
  defaults: HomeSections = DEFAULT_SECTIONS
): HomeSections[K] {
  const v = (value ?? {}) as Record<string, unknown>;
  switch (key) {
    case "announcement":
      return mergeAnnouncement(defaults.announcement, v) as HomeSections[K];
    case "hero":
      return mergeHero(defaults.hero, v) as HomeSections[K];
    case "upiBanner":
      return mergeUpiBanner(defaults.upiBanner, v) as HomeSections[K];
    case "combos":
      return mergeCombos(defaults.combos, v) as HomeSections[K];
    case "newLaunch":
      return mergeNewLaunch(defaults.newLaunch, v) as HomeSections[K];
    case "winterRollout":
      return mergeWinterRollout(defaults.winterRollout, v) as HomeSections[K];
    case "trustStrip":
      return mergeTrustStrip(defaults.trustStrip, v) as HomeSections[K];
    case "feelsGood":
      return mergeFeelsGood(defaults.feelsGood, v) as HomeSections[K];
    case "quickShop":
      return mergeQuickShop(defaults.quickShop, v) as HomeSections[K];
    case "reviews":
      return mergeReviews(defaults.reviews, v) as HomeSections[K];
    case "newArrivals":
      return mergeNewArrivals(defaults.newArrivals, v) as HomeSections[K];
  }
}

/** Keeps only known keys, removes duplicates, appends any missing ones. */
export function cleanOrder(value: unknown, fallback: HomeSectionKey[]): HomeSectionKey[] {
  if (!Array.isArray(value)) return [...fallback];
  const seen = new Set<HomeSectionKey>();
  const ordered: HomeSectionKey[] = [];
  for (const raw of value) {
    const key = String(raw ?? "") as HomeSectionKey;
    if ((SECTION_KEYS as string[]).includes(key) && !seen.has(key)) {
      seen.add(key);
      ordered.push(key);
    }
  }
  // A section omitted from the saved order is appended in its canonical spot,
  // so an older payload can never silently hide a newly added section.
  for (const key of SECTION_KEYS) if (!seen.has(key)) ordered.push(key);
  return ordered;
}

/** Merges a full stored map over the defaults. */
export function mergeSections(stored: Record<string, unknown>): HomeSections {
  const out = {} as HomeSections;
  out.order = cleanOrder(stored.order, DEFAULT_SECTIONS.order);
  for (const key of SECTION_KEYS) {
    out[key] = mergeSection(key, stored[key]) as never;
  }
  return out;
}

/**
 * Reads the homepage sections for the storefront. Never throws: on any
 * problem (table missing, DB down) it returns the defaults so the homepage
 * still renders an honest, complete page.
 */
export async function getHomepageSections(): Promise<HomeSections> {
  const { readLocalSections } = await import("./homepage-store");
  const fallback = () => mergeSections(readLocalSections() ?? {});

  const { db, isSupabaseConfigured } = await import("./db");
  if (!isSupabaseConfigured()) return fallback();

  try {
    const { data, error } = await db().from("homepage_sections").select("key, data");
    if (error) {
      // Table not created yet — use the local fallback so admin edits still work.
      console.warn("getHomepageSections using local fallback:", error.message);
      return fallback();
    }
    const stored: Record<string, unknown> = {};
    for (const row of data ?? []) {
      if (row && typeof row.key === "string") stored[row.key] = row.data;
    }
    return mergeSections(stored);
  } catch (error) {
    console.error("getHomepageSections failed:", error);
    return fallback();
  }
}

export type { HeroSlide as SectionHeroSlide, WinterCard as SectionWinterCard };
