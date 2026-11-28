/** Shipping rules shared by checkout display and the server charge. */
import { computeTotals, FREE_SHIPPING_ABOVE, shippingFor } from "../lib/pricing";

let failures = 0;
const check = (label: string, pass: boolean, detail = "") => {
  console.log(`  ${pass ? "OK  " : "FAIL"}  ${label}${detail ? ` — ${detail}` : ""}`);
  if (!pass) failures += 1;
};

console.log("\nshipping rules");
check("empty cart is free", shippingFor(0, "110001") === 0);
check("Dhanbad 826001 is 50", shippingFor(500, "826001") === 50, String(shippingFor(500, "826001")));
check("Dhanbad 828111 is 50", shippingFor(500, "828111") === 50, String(shippingFor(500, "828111")));
check("within 300 km is 60", shippingFor(500, "827101") === 60, String(shippingFor(500, "827101")));
check("far pincode is 80", shippingFor(500, "110001") === 80, String(shippingFor(500, "110001")));
check("unknown pincode is 80", shippingFor(500, "") === 80);
check(`free at ${FREE_SHIPPING_ABOVE}`, shippingFor(999, "110001") === 0);
check("just below threshold still pays", shippingFor(998, "110001") === 80);
const totals = computeTotals([{ unit_price: 500, quantity: 1 }], "826001");
check(
  "computeTotals uses shipping and total",
  totals.subtotal === 500 && totals.shipping === 50 && totals.total === 550,
  JSON.stringify(totals)
);
const free = computeTotals([{ unit_price: 999, quantity: 1 }], "110001");
check("computeTotals free order", free.shipping === 0 && free.total === 999);

console.log(`\n${failures === 0 ? "PRICING OK" : `${failures} FAILED`}`);
process.exit(failures === 0 ? 0 : 1);
