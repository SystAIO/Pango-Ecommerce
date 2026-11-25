/**
 * Per-product coupons are saved in a reserved section of the existing
 * specifications jsonb, read back into Product.coupon, and hidden from the
 * visible spec table. Verify that round trip without a database.
 */
import { toProductInput } from "../lib/products";
import { normaliseProductCoupon, PRODUCT_COUPON_KEY, toProduct } from "../lib/product-shape";

let failures = 0;
const check = (label: string, pass: boolean, detail = "") => {
  console.log(`  ${pass ? "OK  " : "FAIL"}  ${label}${detail ? ` — ${detail}` : ""}`);
  if (!pass) failures += 1;
};

console.log("\nproduct coupon round trip");

const input = toProductInput({
  name: "Women's Test Tee",
  slug: "Women's Test Tee",
  category: "T-Shirts",
  specifications: { "1. FIT & FABRIC": { Gender: "Women", Fabric: "Cotton" } },
  coupon: {
    code: "women200",
    label: "₹200 off",
    description: "Flat discount on this product",
    minOrder: 999,
    value: 200,
    kind: "flat",
    active: true,
  },
});
const stored = input.specifications as Record<string, Record<string, string>>;
check("stored in the reserved spec section", stored[PRODUCT_COUPON_KEY]?.code === "WOMEN200");
check("code is uppercased", stored[PRODUCT_COUPON_KEY]?.code === "WOMEN200");
check("numbers are stringified", stored[PRODUCT_COUPON_KEY]?.minOrder === "999");
check("other specs are preserved", stored["1. FIT & FABRIC"]?.Gender === "Women");

const product = toProduct({ ...input, id: 1, created_at: "2026-01-01" });
check("coupon is read back onto the product", product.coupon?.code === "WOMEN200");
check("coupon is active", product.coupon?.active === true);
check("coupon is a flat discount", product.coupon?.kind === "flat");
check(
  "reserved section is hidden from the spec table",
  !(PRODUCT_COUPON_KEY in product.specifications) &&
    product.specifications["1. FIT & FABRIC"]?.Gender === "Women"
);

const cleared = toProductInput({
  name: "No Coupon",
  slug: "no-coupon",
  specifications: stored,
  coupon: { code: "", value: 0, active: false },
});
check(
  "an empty coupon removes the reserved section",
  !(PRODUCT_COUPON_KEY in (cleared.specifications as Record<string, unknown>))
);

const percent = normaliseProductCoupon({ code: "new10", value: "10", kind: "percent", active: "true" });
check("percent coupons are normalised", percent?.kind === "percent" && percent?.value === 10 && percent?.active === true);

console.log(`\n${failures === 0 ? "PRODUCT COUPON OK" : `${failures} FAILED`}`);
process.exit(failures === 0 ? 0 : 1);
