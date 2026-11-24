/**
 * Combo products: a separate merchandising catalogue with its own admin tab.
 *
 * Stored locally by default (no SQL setup needed), mirroring the homepage and
 * catalogue-config stores. Each combo carries the options for the two colour
 * and two size selectors shown on its detail page.
 */

export type ComboSpecSection = {
  title: string;
  items: { key: string; value: string }[];
};

export type ComboProduct = {
  /** Stable unique id, independent of the slug (which admins can rename). */
  id: number;
  slug: string;
  name: string;
  brand: string;
  category: string;
  badge: string;
  price: number;
  mrp: number;
  image: string;
  images: string[];
  description: string;
  colors: string[];
  sizes: string[];
  specs: Record<string, string>;
  specSections?: ComboSpecSection[];
  insights: { caption: string; title: string; image: string }[];
  active: boolean;
};

export type ComboCoupon = {
  code: string;
  label: string;
  description: string;
  minOrder: number;
  value: number;
  kind: "flat" | "percent";
  active: boolean;
};

export type ComboFaq = { q: string; a: string };

export type ComboData = {
  combos: ComboProduct[];
  coupon: ComboCoupon;
  /** Shared product-insight images used when a combo has no own insights. */
  insights: { caption: string; title: string; image: string }[];
  collection: {
    heading: string;
    description: string;
    faqHeading: string;
    faqs: ComboFaq[];
  };
};

const IMG = "https://images.unsplash.com/photo-";
const img = (id: string, w = 900) => `${IMG}${id}?w=${w}&auto=format&fit=crop&q=80`;

const COLORS = [
  "Black", "Cedar Green", "Chocolate Brown", "Dark Grey", "Navy Blue",
  "Soft Grey", "True Blue", "White",
];
const SIZES = ["S", "M", "L", "XL", "XXL"];

/** A stable hash-based id so seeded combos keep the same id across reloads. */
export function comboId(slug: string): number {
  let hash = 5381;
  for (let i = 0; i < slug.length; i++) hash = ((hash << 5) + hash + slug.charCodeAt(i)) | 0;
  return Math.abs(hash % 1000000) + 100000;
}

const SEED_COMBO_DATA: Omit<ComboData, "combos"> & { combos: Omit<ComboProduct, "id">[] } = {
  combos: [
  ],
  coupon: {
    code: "COMBO100",
    label: "Get flat ₹100 OFF",
    description: "Valid on combos above ₹899 · prepaid only",
    minOrder: 899,
    value: 100,
    kind: "flat",
    active: false,
  },
  insights: [],
  collection: {
    heading: "Combos for Men",
    description:
      "Why buy one when you can pick a pack? Mix and match colours and sizes across our best-selling combos and save more on every extra piece.",
    faqHeading: "FAQs on Combo Products",
    faqs: [
      { q: "Can I mix colours in a combo?", a: "Yes. Choose a different colour and size for every item in the pack." },
      { q: "Which combos are best for a basic wardrobe?", a: "The Pick Any 4 Plain T-shirts and Pick Any 2 Polo T-shirts combos cover everyday essentials." },
      { q: "Is extra discount available on combos?", a: "Apply the active combo coupon at checkout for an additional discount." },
    ],
  },
};

const sectionsFromSpecs = (specs: Record<string, string>): ComboSpecSection[] => [
  { title: "PRODUCT DETAILS", items: Object.entries(specs).map(([key, value]) => ({ key, value })) },
];

export const DEFAULT_COMBO_DATA: ComboData = {
  ...SEED_COMBO_DATA,
  combos: SEED_COMBO_DATA.combos.map((combo) => ({
    ...combo,
    id: comboId(combo.slug),
    specSections: combo.specSections ?? sectionsFromSpecs(combo.specs),
  })),
};

const str = (v: unknown, fallback: string, max = 500) => {
  const s = String(v ?? "").trim().slice(0, max);
  return s || fallback;
};
const num = (v: unknown) => Math.max(0, Number(v) || 0);
const list = (v: unknown) =>
  Array.isArray(v) ? v.map((s) => String(s ?? "").trim()).filter(Boolean).slice(0, 30) : [];

export function mergeComboData(value: unknown): ComboData {
  const raw = (value && typeof value === "object" ? value : {}) as Record<string, unknown>;

  const combos = Array.isArray(raw.combos)
    ? raw.combos
        .map((item) => {
          const c = (item ?? {}) as Record<string, unknown>;
          const slug = str(c.slug, "", 200);
          if (!slug) return null;
          const specSections: ComboSpecSection[] = Array.isArray(c.specSections)
            ? c.specSections
                .map((s) => {
                  const section = (s ?? {}) as Record<string, unknown>;
                  return {
                    title: str(section.title, "", 80),
                    items: Array.isArray(section.items)
                      ? section.items
                          .map((i) => {
                            const item = (i ?? {}) as Record<string, unknown>;
                            return { key: str(item.key, "", 80), value: str(item.value, "", 300) };
                          })
                          .filter((i) => i.key)
                          .slice(0, 40)
                      : [],
                  } as ComboSpecSection;
                })
                .filter((s) => s.title || s.items.length)
                .slice(0, 20)
            : [];
          const specs: Record<string, string> = {};
          if (specSections.length > 0) {
            for (const section of specSections) {
              for (const item of section.items) specs[item.key] = item.value;
            }
          } else if (c.specs && typeof c.specs === "object") {
            for (const [k, v] of Object.entries(c.specs as Record<string, unknown>)) specs[k] = String(v ?? "");
          }
          const insights = Array.isArray(c.insights)
            ? c.insights
                .map((i) => {
                  const o = (i ?? {}) as Record<string, unknown>;
                  return { caption: str(o.caption, "", 80), title: str(o.title, "", 80), image: str(o.image, "", 500) };
                })
                .filter((i) => i.image)
                .slice(0, 6)
            : [];
          return {
            id: Math.max(1, Number(c.id) || comboId(slug)),
            slug,
            name: str(c.name, slug, 200),
            brand: str(c.brand, "Pango", 100),
            category: str(c.category, "General", 100),
            badge: str(c.badge, "COMBO", 60),
            price: num(c.price),
            mrp: num(c.mrp),
            image: str(c.image, "", 500),
            images: list(c.images).slice(0, 12),
            description: str(c.description, "", 3000),
            colors: list(c.colors),
            sizes: list(c.sizes),
            specs,
            specSections: specSections.length > 0 ? specSections : sectionsFromSpecs(specs),
            insights,
            active: c.active !== false,
          } as ComboProduct;
        })
        .filter((c): c is ComboProduct => Boolean(c))
        .slice(0, 60)
    : [];

  const couponRaw = (raw.coupon ?? {}) as Record<string, unknown>;
  const coupon: ComboCoupon = {
    code: str(couponRaw.code, DEFAULT_COMBO_DATA.coupon.code, 40).toUpperCase(),
    label: str(couponRaw.label, DEFAULT_COMBO_DATA.coupon.label, 120),
    description: str(couponRaw.description, DEFAULT_COMBO_DATA.coupon.description, 250),
    minOrder: num(couponRaw.minOrder ?? DEFAULT_COMBO_DATA.coupon.minOrder),
    value: num(couponRaw.value ?? DEFAULT_COMBO_DATA.coupon.value),
    kind: couponRaw.kind === "percent" ? "percent" : "flat",
    active: couponRaw.active === undefined ? DEFAULT_COMBO_DATA.coupon.active : couponRaw.active === true,
  };

  const globalInsights = Array.isArray(raw.insights)
    ? raw.insights
        .map((i) => {
          const o = (i ?? {}) as Record<string, unknown>;
          return { caption: str(o.caption, "", 80), title: str(o.title, "", 80), image: str(o.image, "", 500) };
        })
        .filter((i) => i.image)
        .slice(0, 6)
    : [];

  const c = (raw.collection ?? {}) as Record<string, unknown>;
  const faqs = Array.isArray(c.faqs)
    ? c.faqs
        .map((f) => {
          const o = (f ?? {}) as Record<string, unknown>;
          return { q: str(o.q, "", 200), a: str(o.a, "", 1200) };
        })
        .filter((f) => f.q)
        .slice(0, 30)
    : DEFAULT_COMBO_DATA.collection.faqs;

  return {
    combos: combos.length > 0 ? combos : structuredClone(DEFAULT_COMBO_DATA.combos),
    coupon,
    insights: globalInsights.length > 0 ? globalInsights : structuredClone(DEFAULT_COMBO_DATA.insights),
    collection: {
      heading: str(c.heading, DEFAULT_COMBO_DATA.collection.heading, 200),
      description: str(c.description, DEFAULT_COMBO_DATA.collection.description, 4000),
      faqHeading: str(c.faqHeading, DEFAULT_COMBO_DATA.collection.faqHeading, 200),
      faqs,
    },
  };
}
