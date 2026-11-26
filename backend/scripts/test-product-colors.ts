/**
 * Colourways are separate products linked by hex codes saved in Admin →
 * Product Management. Verify the hex round trip and the Myntra-style
 * "MORE COLORS" matching (including the reverse direction).
 */
import { toProductInput } from "../lib/products";
import {
  findMoreColorProducts,
  MORE_COLORS_KEY,
  normaliseHex,
  normaliseProductColor,
  PRODUCT_COLOR_KEY,
  toProduct,
  type ProductColor,
} from "../lib/product-shape";

let failures = 0;
const check = (label: string, pass: boolean, detail = "") => {
  console.log(`  ${pass ? "OK  " : "FAIL"}  ${label}${detail ? ` — ${detail}` : ""}`);
  if (!pass) failures += 1;
};

const make = (
  name: string,
  slug: string,
  category: string,
  color: ProductColor,
  moreColors: ProductColor[] = []
) =>
  toProduct({
    ...toProductInput({ name, slug, category, price: 999, color, moreColors }),
    id: 1,
    created_at: "2026-01-01",
  });

console.log("\nhex + colour round trip");
check("hex is upper-cased", normaliseHex("#c1121f") === "#C1121F");
check("short hex expands", normaliseHex("#0f8") === "#00FF88");
check("bare hex is accepted", normaliseHex("2a9d8f") === "#2A9D8F");
check("garbage is rejected", normaliseHex("red") === "");

const red = make(
  "Polo T-Shirt — Red",
  "polo-t-shirt-red",
  "Polo T-Shirts",
  { name: "Red", hex: "#c1121f" },
  [{ name: "Green", hex: "#2A9D8F" }]
);
const stored = toProductInput({
  name: "x",
  slug: "x",
  color: { name: "Red", hex: "#c1121f" },
  moreColors: [{ name: "Green", hex: "#2A9D8F" }],
}).specifications as Record<string, unknown>;
check("primary colour is stored", (stored[PRODUCT_COLOR_KEY] as ProductColor).hex === "#C1121F");
check("more colours are stored as a list", (stored[MORE_COLORS_KEY] as ProductColor[])[0].hex === "#2A9D8F");
check("product exposes primary colour", red.color?.hex === "#C1121F");
check("product exposes sibling colours", red.moreColors[0]?.hex === "#2A9D8F");
check(
  "colour sections are hidden from the spec table",
  !(PRODUCT_COLOR_KEY in red.specifications) && !(MORE_COLORS_KEY in red.specifications)
);

console.log("\nMORE COLORS matching");
const green = make(
  "Polo T-Shirt — Green",
  "polo-t-shirt-green",
  "Polo T-Shirts",
  { name: "Green", hex: "#2a9d8f" }
);
const blue = make(
  "Polo T-Shirt — Blue",
  "polo-t-shirt-blue",
  "Polo T-Shirts",
  { name: "Blue", hex: "#123456" }
);
const otherCategory = make(
  "Jeans — Red",
  "jeans-red",
  "Jeans",
  { name: "Red", hex: "#c1121f" }
);
const catalogue = [red, green, blue, otherCategory];

const redLinks = findMoreColorProducts(red, catalogue).map((p) => p.slug);
check("red links to green", redLinks.includes("polo-t-shirt-green"), redLinks.join(", "));
check("red does not link to a different colour", !redLinks.includes("polo-t-shirt-blue"));
check("red does not link to another category", !redLinks.includes("jeans-red"));
const greenLinks = findMoreColorProducts(green, catalogue).map((p) => p.slug);
check("match works in reverse (green → red)", greenLinks.includes("polo-t-shirt-red"), greenLinks.join(", "));
check("a product never links to itself", !redLinks.includes("polo-t-shirt-red"));

const twin = make(
  "Polo T-Shirt — Green 2",
  "polo-t-shirt-green-2",
  "Polo T-Shirts",
  { name: "Green", hex: "2A9D8F" }
);
check(
  "same primary hex also links products",
  findMoreColorProducts(green, [green, twin]).some((p) => p.slug === "polo-t-shirt-green-2")
);
check(
  "products without colour data are skipped",
  findMoreColorProducts({ ...green, color: null, moreColors: [] }, catalogue).length === 0
);
check("colour name falls back to the hex", normaliseProductColor({ hex: "#123456" })?.name === "#123456");

console.log(`\n${failures === 0 ? "PRODUCT COLORS OK" : `${failures} FAILED`}`);
process.exit(failures === 0 ? 0 : 1);
