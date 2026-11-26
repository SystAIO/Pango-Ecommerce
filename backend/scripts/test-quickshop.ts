/**
 * Quick Shop tiles are merchandising copy, not exact category names. Verify
 * that clicking a tile always produces a catalogue URL for a category that
 * actually exists in the navbar (live menu and the built-in fallback).
 *
 *   npx tsx scripts/test-quickshop.ts
 */
import {
  DEFAULT_MENU,
  menuCategories,
  menuItemHref,
  quickShopHref,
  resolveQuickShopCategory,
  type NavbarMenu,
} from "../../frontend/lib/navbar-menu";

const LIVE_MENU: NavbarMenu = {
  topwear: {
    label: "Topwear",
    columns: [
      {
        title: "T-Shirts",
        items: [
          "Plain T-Shirts",
          "Printed T-Shirts",
          "Sports T-Shirts",
          "Regular Fit T-Shirts",
          "Oversized T-Shirts",
          "Polo T-Shirts",
          "Full Sleeve T-Shirts",
          "View All",
        ],
      },
      {
        title: "Essentials",
        items: ["Hoodies", "Sweatshirts", "Jackets", "Co-ord Sets", "View All"],
      },
    ],
  },
  bottomwear: {
    label: "Bottomwear",
    columns: [
      { title: "Bottoms", items: ["Trousers", "Pants", "Joggers", "Trackpants", "Boxers", "View All"] },
    ],
  },
  links: [{ label: "Winterwear", href: "/winterwear" }],
};

let failures = 0;
const check = (label: string, pass: boolean, detail = "") => {
  console.log(`  ${pass ? "OK  " : "FAIL"}  ${label}${detail ? ` — ${detail}` : ""}`);
  if (!pass) failures += 1;
};

const expectCategory = (menu: NavbarMenu, tile: string, expected: string) => {
  const got = resolveQuickShopCategory(tile, menu);
  check(`"${tile}" → ${expected}`, got === expected, `got ${got ?? "nothing"}`);
  const href = quickShopHref(tile, "", menu);
  check(`  link is filtered by that category`, href.startsWith("/product-page?category="), href);
};

console.log("\nlive navbar menu");
expectCategory(LIVE_MENU, "Polo Tshirts", "Polo T-Shirts");
expectCategory(LIVE_MENU, "Lowers", "Trousers");
expectCategory(LIVE_MENU, "Jackets", "Jackets");
expectCategory(LIVE_MENU, "Round Neck", "Plain T-Shirts");

console.log("\nbuilt-in fallback menu");
expectCategory(DEFAULT_MENU, "Polo Tshirts", "Polo T-Shirts");
expectCategory(DEFAULT_MENU, "Lowers", "Trousers & Pants");
expectCategory(DEFAULT_MENU, "Jackets", "Jackets");
expectCategory(DEFAULT_MENU, "Round Neck", "Plain T-Shirts");
expectCategory(DEFAULT_MENU, "Full Sleeves", "Full Sleeve T-Shirts");

console.log("\nnon-category tiles keep their own link");
check(
  "New Arrivals → /new-arrivals",
  quickShopHref("New Arrivals", "/new-arrivals", LIVE_MENU) === "/new-arrivals"
);
check("blank label and link → catalogue", quickShopHref("", "", LIVE_MENU) === "/product-page");
check(
  "javascript: link is rejected",
  quickShopHref("Custom", "javascript:alert(1)", LIVE_MENU) === "/product-page"
);
check(
  "Co-Ord Set keeps the women gender from its configured link",
  quickShopHref(
    "Co-Ord Set",
    "https://www.pangoapparels.com/product-page?gender=women&category=Co-ord+Sets",
    LIVE_MENU
  ) === "/product-page?gender=women&category=Co-ord+Sets",
  quickShopHref("Co-Ord Set", "https://www.pangoapparels.com/product-page?gender=women&category=Co-ord+Sets", LIVE_MENU)
);
check(
  "a women-only category defaults to women without a gender in the link",
  quickShopHref("Co-Ord Set", "", LIVE_MENU) === "/product-page?gender=women&category=Co-ord+Sets"
);

console.log("\nShop For Women menu links");
check(
  "Shop For Women → women's catalogue",
  menuItemHref("Shop For Women", "women") === "/product-page?gender=women"
);
check(
  "Topwear under women → women's catalogue",
  menuItemHref("Topwear", "women") === "/product-page?gender=women"
);
check(
  "View All under women → women's catalogue",
  menuItemHref("View All", "women") === "/product-page?gender=women"
);
check(
  "ordinary category link is unchanged",
  menuItemHref("Plain T-Shirts") === "/product-page?category=Plain+T-Shirts"
);
check(
  "View All in a men's column → men's collection",
  menuItemHref("View All", "men") === "/product-page?gender=men"
);
check(
  "men's category link carries the gender filter",
  menuItemHref("Polo T-Shirts", "men") === "/product-page?gender=men&category=Polo+T-Shirts",
  menuItemHref("Polo T-Shirts", "men")
);

console.log("\ngender-aware category picker");
const womenCategories = menuCategories(LIVE_MENU, "women");
const menCategories = menuCategories(LIVE_MENU, "men");
check("women categories lead with women's departments", womenCategories[0] === "Co-ord Sets", womenCategories.slice(0, 3).join(", "));
check("women categories still include navbar categories", womenCategories.includes("Plain T-Shirts"));
check("men categories exclude women-only departments", !menCategories.includes("Co-ord Sets"));
check("men categories keep regular categories", menCategories.includes("Plain T-Shirts"));

console.log(`\n${failures === 0 ? "QUICK SHOP OK" : `${failures} FAILED`}`);
process.exit(failures === 0 ? 0 : 1);
