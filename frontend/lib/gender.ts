/**
 * Gender inference for products.
 *
 * Pango Apparels carries two genders only: Men and Women. Everything in the
 * catalogue is gendered explicitly in product names ("…— Men" / "…— Women")
 * and in the seeded spec sheets, so this reads, in order:
 *
 *   1. `Gender` inside the product's specifications (exact key the admin
 *      product form pre-fills).
 *   2. A whole-word match in the product name (`women` is checked before
 *      `men`, because "women" contains "men").
 *   3. Anything unmarked is Men by default — there is no third gender in the
 *      catalogue, so there is no third state here either.
 */
export type ProductGender = "men" | "women";

type SpecMap = Record<string, Record<string, unknown>> | null | undefined;

function readGenderSpec(specs: SpecMap): string {
  if (!specs || typeof specs !== "object") return "";
  for (const value of Object.values(specs)) {
    if (value && typeof value === "object") {
      const direct = (value as Record<string, unknown>).Gender;
      if (typeof direct === "string") return direct;
    }
  }
  const top = (specs as Record<string, unknown>).Gender;
  return typeof top === "string" ? top : "";
}

export function productGender(product: {
  name?: string;
  specifications?: unknown;
}): ProductGender {
  let specs = product.specifications;
  if (typeof specs === "string") {
    try {
      specs = JSON.parse(specs);
    } catch {
      specs = null;
    }
  }

  const fromSpec = readGenderSpec(specs as SpecMap)
    .trim()
    .toLowerCase();
  if (fromSpec === "women" || fromSpec === "woman") return "women";
  if (fromSpec === "men" || fromSpec === "man") return "men";

  const name = (product.name ?? "").toLowerCase();
  if (/\b(women|woman|girls?|ladies|female)\b/.test(name)) return "women";

  // Name says nothing → Men. If in doubt the product belongs to the default
  // gender rather than to a catch-all category.
  return "men";
}
