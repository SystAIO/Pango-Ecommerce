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
