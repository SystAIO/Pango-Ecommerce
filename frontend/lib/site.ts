/**
 * Shared storefront identity + contact details.
 *
 * These were previously hardcoded in a dozen places (Navbar, Footer, home page CTAs).
 * Anything customer-facing that needs to reach the business — the WhatsApp order
 * handoff and support links — should read from here so a detail is changed in one place.
 */

export const SITE = {
  name: "Pango Apparels",
  /** Used in prose and sentence case: "Pango Apparels". */
  shortName: "Pango Apparels",
  /** The wordmark, rendered as-is in the Navbar. */
  wordmarkLead: "PANGO",
  wordmarkAccent: "APPARELS",

  /**
   * One line, used in the top bar and as the page-title suffix. Kept short enough
   * to survive being rendered at 12px next to a phone number.
   */
  tagline: "Winterwear, delivered across India",

  /**
   * The longer promise, used for meta description and the footer's opening line.
   */
  pitch:
    "Pango Apparels is a winter clothing brand — hoodies, jackets, tees, joggers, knitwear and co-ord sets, built for Indian winters — with honest pricing, 30-day easy exchanges and fast pan-India delivery with cash on delivery available.",

  /** What the business does — drives the footer's opening paragraph. */
  about:
    "Pango Apparels is a winterwear brand for everyday Indian winters. Fleece-lined hoodies, puffer jackets, heavyweight tees, denim and knitwear — cut and stitched for real life, priced honestly, with free delivery on orders over ₹1,999, 30-day size exchanges and a support team that actually answers. Gift wrapping and bulk orders with GST billing available.",

  phoneDisplay: "+91 7992430183",
  /** Digits only, E.164 without the +, for wa.me links. */
  whatsappNumber: "917992430183",
  email: "chandansaricreative@gmail.com",
  address: "Shyamdih, Katras Baazar, Dhanbad, Jharkhand 828114",

  /** City and state on their own, for places that have room for less than the full address. */
  city: "Dhanbad",
  state: "Jharkhand",
  pincode: "828114",

  /** Four promises shown in the trust strip under the hero. */
  highlights: [
    { title: "Free delivery", detail: "On orders over ₹2,000" },
    { title: "Cash on delivery", detail: "Available on eligible orders" },
    { title: "30-day size exchange", detail: "On unwashed, unworn pieces" },
    { title: "24/7 support", detail: "Real people, not a bot" },
  ],
} as const;

/** Builds a wa.me deep link with a pre-filled message. */
export function whatsappLink(message: string): string {
  return `https://wa.me/${SITE.whatsappNumber}?text=${encodeURIComponent(message)}`;
}

/** Formats a number as Indian Rupees, matching the rest of the storefront. */
export function inr(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

/** The percentage saved against an MRP, or null when there is no meaningful discount. */
export function discountPercent(price: number, mrp: number): number | null {
  if (!mrp || mrp <= price) return null;
  return Math.round(((mrp - price) / mrp) * 100);
}
