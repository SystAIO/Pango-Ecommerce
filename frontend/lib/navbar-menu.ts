/**
 * Beyoung-style mega-menu for the storefront navbar.
 *
 * Structure: two dropdown triggers (Topwear / Bottomwear), each opening a
 * full-width panel of column groups, plus a row of direct links
 * (Combos / New Arrivals / Winterwear). Everything — labels, columns, items
 * and the direct links — is merchandising content and editable from
 * Admin → Customize Navbar. The `navbar_menu` table persists one row per
 * section ('topwear', 'bottomwear', 'links').
 *
 * DEFAULT_MENU below is the seed and the fallback: if the table is missing or
 * unreadable, the navbar renders this so the site never shows an empty menu.
 * The admin PUT handler rejects anything that does not match this shape.
 */

export interface NavbarMenuColumn {
  title: string;
  items: string[];
}

export interface NavbarMenuSection {
  /** Trigger label, e.g. "Topwear". */
  label: string;
  columns: NavbarMenuColumn[];
}

export interface NavbarMenuLink {
  label: string;
  href: string;
}

export interface NavbarMenu {
  topwear: NavbarMenuSection;
  bottomwear: NavbarMenuSection;
  links: NavbarMenuLink[];
}

export const DEFAULT_MENU: NavbarMenu = {
  topwear: {
    label: "Topwear",
    columns: [
      {
        title: "T-Shirts",
        items: [
          "Plain T-Shirts",
          "Printed T-Shirts",
          "Active T-Shirts",
          "Regular Fit T-Shirts",
          "Oversized T-Shirts",
          "Polo T-Shirts",
          "Full Sleeve T-Shirts",
          "View All",
        ],
      },
      {
        title: "Shirts",
        items: [
          "Plain Shirts",
          "Oxford Shirts",
          "Flannel Shirts",
          "Corduroy Shirts",
          "Linen Shirts",
          "View All",
        ],
      },
      {
        title: "Essentials",
        items: [
          "Hoodies",
          "Sweatshirts",
          "Sweaters",
          "Jackets",
          "Co-ord Sets",
          "View All",
        ],
      },
      {
        title: "Shop For Women",
        items: ["Topwear", "Bottomwear", "View All"],
      },
    ],
  },
  bottomwear: {
    label: "Bottomwear",
    columns: [
      {
        title: "Bottoms",
        items: [
          "Trousers & Pants",
          "Cotton Pants",
          "Korean Pants",
          "Chinos",
          "Jeans",
          "Cargo Pants",
          "Joggers",
          "Trackpants",
          "Boxers",
          "View All",
        ],
      },
      {
        title: "Shop For Women",
        items: ["Bottomwear", "Topwear", "View All"],
      },
    ],
  },
  links: [
    { label: "Combos", href: "/combo-page" },
    { label: "New Arrivals", href: "/new-arrivals" },
    { label: "Winterwear", href: "/winterwear" },
  ],
};

const MAX_LABEL = 40;
const MAX_TITLE = 40;
const MAX_ITEM = 60;
const MAX_COLUMNS = 6;
const MAX_ITEMS = 30;
const MAX_LINKS = 8;
const MAX_HREF = 300;

function cleanString(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

/**
 * Coerces untrusted input (admin form PUT) into a valid menu section, or
 * returns null when the shape is unusable. Column count and item count are
 * capped so a careless save cannot build a dropdown that breaks the layout.
 */
export function validateMenuSection(input: unknown): NavbarMenuSection | null {
  if (!input || typeof input !== "object") return null;
  const raw = input as { label?: unknown; columns?: unknown };

  const label = cleanString(raw.label, MAX_LABEL);
  if (!label) return null;

  if (!Array.isArray(raw.columns) || raw.columns.length === 0) return null;
  const columns: NavbarMenuColumn[] = [];
  for (const col of raw.columns.slice(0, MAX_COLUMNS)) {
    if (!col || typeof col !== "object") continue;
    const c = col as { title?: unknown; items?: unknown };
    const title = cleanString(c.title, MAX_TITLE);
    if (!title) continue;
    const items = Array.isArray(c.items)
      ? c.items.map((item) => cleanString(item, MAX_ITEM)).filter(Boolean).slice(0, MAX_ITEMS)
      : [];
    columns.push({ title, items });
  }
  if (columns.length === 0) return null;

  return { label, columns };
}

/** Validates the row of direct links next to the two dropdowns. */
export function validateMenuLinks(input: unknown): NavbarMenuLink[] | null {
  if (!Array.isArray(input)) return null;

  const links: NavbarMenuLink[] = [];
  for (const raw of input.slice(0, MAX_LINKS)) {
    if (!raw || typeof raw !== "object") continue;
    const o = raw as { label?: unknown; href?: unknown };
    const label = cleanString(o.label, MAX_LABEL);
    const href = cleanString(o.href, MAX_HREF);
    // Only site-relative or absolute http(s) links — javascript: URLs are
    // rejected outright.
    if (!label || !(href.startsWith("/") || /^https?:\/\//i.test(href))) continue;
    links.push({ label, href });
  }

  return links;
}

/** Pure-navigation rows that are not sellable product categories. */
const NAVIGATION_LABELS = new Set([
  "view all",
  "topwear",
  "bottomwear",
  "winterwear",
  "shop for women",
]);

export function isNavigationLabel(item: string): boolean {
  const lower = item.trim().toLowerCase();
  return lower.startsWith("all ") || NAVIGATION_LABELS.has(lower);
}

/**
 * Product-listing URL for a menu item.
 *
 * Umbrella/navigation entries link to the plain catalogue; real category names
 * link to the exact category filter on the catalogue page.
 */
export function menuItemHref(item: string): string {
  const trimmed = item.trim();
  if (!trimmed || isNavigationLabel(trimmed)) return "/product-page";

  const qs = new URLSearchParams();
  qs.set("category", trimmed);
  return `/product-page?${qs.toString()}`;
}

/**
 * Sellable product categories, derived from the (admin-editable) menu.
 *
 * Navigation rows ("View All", "Shop For Women", …) are not categories and are
 * filtered out. A category the admin adds in Customize Navbar shows up in the
 * product form immediately; deleting one removes it from new-product selection
 * while leaving existing products untouched.
 */
export function menuCategories(
  menu: NavbarMenu,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _gender: "men" | "women" | "all" = "all"
): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const section of [menu.topwear, menu.bottomwear]) {
    for (const column of section.columns) {
      for (const raw of column.items) {
        const item = raw.trim();
        const lower = item.toLowerCase();
        if (!item || isNavigationLabel(item) || seen.has(lower)) continue;
        seen.add(lower);
        out.push(item);
      }
    }
  }
  return out;
}

/* ── Quick shop tiles ───────────────────────────────────────────────────── */

function compactLabel(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/** "Trousers" and "trousers" → "trouser", so singular/plural labels still match. */
function stemLabel(value: string): string {
  const compact = compactLabel(value);
  return compact.length > 3 && compact.endsWith("s") ? compact.slice(0, -1) : compact;
}

function labelWords(value: string): string[] {
  return value
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length >= 3)
    .map(stemLabel);
}

function findCategory(label: string, categories: string[]): string | null {
  const key = compactLabel(label);
  if (!key) return null;
  const exact = categories.find((category) => compactLabel(category) === key);
  if (exact) return exact;
  const stem = stemLabel(label);
  return categories.find((category) => stemLabel(category) === stem) ?? null;
}

/**
 * Retail shorthand that does not literally appear in the navbar. Keys and
 * values are compared in compact form, so "Polo Tshirts" matches a navbar
 * category named "Polo T-Shirts".
 */
const QUICK_SHOP_ALIASES: Record<string, string[]> = {
  lower: ["Trousers", "Pants", "Trackpants", "Joggers", "Bottomwear"],
  lowers: ["Trousers", "Pants", "Trackpants", "Joggers", "Bottomwear"],
  bottom: ["Trousers", "Pants", "Bottomwear"],
  bottoms: ["Trousers", "Pants", "Bottomwear"],
  roundneck: ["Plain T-Shirts", "Regular Fit T-Shirts", "T-Shirts"],
  crewneck: ["Plain T-Shirts", "Regular Fit T-Shirts", "T-Shirts"],
  polo: ["Polo T-Shirts"],
  polotshirts: ["Polo T-Shirts"],
  cargo: ["Cargo Pants", "Joggers"],
  cargopants: ["Cargo Pants", "Joggers"],
  jeans: ["Jeans"],
  jacket: ["Jackets"],
  hoodie: ["Hoodies"],
  sweatshirt: ["Sweatshirts"],
  shirt: ["Shirts", "Plain Shirts", "Plain T-Shirts"],
  shirts: ["Shirts", "Plain Shirts", "Plain T-Shirts"],
  tshirt: ["T-Shirts", "Plain T-Shirts"],
  tshirts: ["T-Shirts", "Plain T-Shirts"],
  fullsleeves: ["Full Sleeve T-Shirts"],
  trackpants: ["Trackpants", "Joggers"],
  tracks: ["Trackpants", "Joggers"],
};

/**
 * Matches a Quick Shop tile label to a category that actually exists in the
 * (admin-editable) navbar. Merchandising copy drifts — "Polo Tshirts" vs
 * "Polo T-Shirts", "Lowers" vs "Trousers" — so an exact string match is not
 * enough. Falls back to shared words ("Full Sleeves" → "Full Sleeve T-Shirts").
 */
export function resolveQuickShopCategory(label: string, menu: NavbarMenu): string | null {
  const categories = menuCategories(menu);
  if (categories.length === 0) return null;

  const direct = findCategory(label, categories);
  if (direct) return direct;

  for (const alias of QUICK_SHOP_ALIASES[compactLabel(label)] ?? []) {
    const hit =
      findCategory(alias, categories) ??
      categories.find((category) => compactLabel(category).startsWith(compactLabel(alias)));
    if (hit) return hit;
  }

  const words = labelWords(label);
  if (words.length > 0) {
    let best: { category: string; score: number } | null = null;
    for (const category of categories) {
      const categoryWords = labelWords(category);
      const score = words.reduce((n, word) => n + (categoryWords.includes(word) ? 1 : 0), 0);
      if (score > 0 && (!best || score > best.score)) best = { category, score };
    }
    if (best) return best.category;
  }
  return null;
}

/**
 * Where a Quick Shop tile should go. The label is resolved against the live
 * navbar first, so a stale/empty `href` saved in Admin can never send a shopper
 * to the wrong (or an empty) category. The configured link is kept only for
 * tiles that are not a navbar category at all (e.g. "New Arrivals").
 */
export function quickShopHref(label: string, href: string, menu: NavbarMenu): string {
  const category = resolveQuickShopCategory(label, menu);
  if (category) return menuItemHref(category);
  const link = String(href ?? "").trim();
  return link.startsWith("/") && !link.startsWith("//") ? link : "/product-page";
}
