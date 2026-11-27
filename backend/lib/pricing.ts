/**
 * Order totals, shared by the server routes and the browser so the amount a
 * customer sees can never drift from the amount that gets charged.
 *
 * Shipping rules:
 *   • orders of ₹999 or more ship free
 *   • Dhanbad 826001 → ₹50
 *   • pincode within ~300 km of Dhanbad → ₹60
 *   • any other pincode → ₹80
 *
 * The near-zone prefixes are a configurable approximation (no paid distance
 * API). Backend can override them with NEAR_PINCODE_PREFIXES in .env.
 * MUST stay in sync with the frontend copy of this file.
 */

export const FREE_SHIPPING_ABOVE = 999;
export const LOCAL_PINCODE = "826001";
export const SHIPPING_LOCAL = 50;
export const SHIPPING_NEAR = 60;
export const SHIPPING_FAR = 80;

/** Pincode prefixes roughly within 300 km of Dhanbad (Jharkhand / Bihar / near WB). */
const DEFAULT_NEAR_PREFIXES = ["826", "827", "828", "831", "833", "834", "814", "815", "713", "712"];

function nearPrefixes(): string[] {
  const configured = String(
    (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env
      ?.NEAR_PINCODE_PREFIXES ?? ""
  )
    .split(",")
    .map((prefix) => prefix.trim())
    .filter(Boolean);
  return configured.length > 0 ? configured : DEFAULT_NEAR_PREFIXES;
}

export function shippingFor(subtotal: number, pincode?: string | null): number {
  const amount = Number(subtotal) || 0;
  if (amount <= 0 || amount >= FREE_SHIPPING_ABOVE) return 0;

  const pin = String(pincode ?? "").trim();
  if (pin === LOCAL_PINCODE) return SHIPPING_LOCAL;
  if (/^\d{6}$/.test(pin) && nearPrefixes().some((prefix) => pin.startsWith(prefix))) {
    return SHIPPING_NEAR;
  }
  return SHIPPING_FAR;
}

export type PricedLine = { unit_price: number; quantity: number };

export type OrderTotals = {
  subtotal: number;
  shipping: number;
  total: number;
  amountToFreeShipping: number;
  qualifiesForFreeShipping: boolean;
};

export function computeTotals(lines: PricedLine[], pincode?: string | null): OrderTotals {
  const subtotal = lines.reduce((sum, l) => sum + (Number(l.unit_price) || 0) * l.quantity, 0);
  const qualifiesForFreeShipping = subtotal >= FREE_SHIPPING_ABOVE;
  const shipping = shippingFor(subtotal, pincode);

  return {
    subtotal,
    shipping,
    total: subtotal + shipping,
    amountToFreeShipping: Math.max(0, FREE_SHIPPING_ABOVE - subtotal),
    qualifiesForFreeShipping,
  };
}
