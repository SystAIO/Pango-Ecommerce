/**
 * Error translation for the Postgres order functions.
 *
 * The order functions in `supabase/schema.sql` run in one transaction, which
 * PostgREST's REST layer cannot do. They therefore report failures by raising an
 * exception whose message begins with a machine-readable code, and this module
 * turns that message back into the HTTP response the browser expects.
 */

import type { Response } from "express";

export function orderFunctionError(res: Response, error: { message?: string }): void {
  const message = error?.message ?? "";

  if (message.startsWith("PRODUCT_UNAVAILABLE")) {
    res.status(409).json({ error: "One or more items are no longer available" });
    return;
  }

  if (message.startsWith("PRICED_ON_REQUEST")) {
    const name = message.slice("PRICED_ON_REQUEST:".length);
    res.status(409).json({
      error: `"${name}" is priced on request. Please contact us to order it.`,
      code: "on_request",
    });
    return;
  }

  if (message.startsWith("AMOUNT_MISMATCH")) {
    res.status(409).json({
      error:
        "The order total changed since checkout. Nothing has been recorded — please start the checkout again.",
      code: "amount_mismatch",
    });
    return;
  }

  if (message.startsWith("NO_VALID_ITEMS")) {
    res.status(400).json({ error: "No valid items in cart" });
    return;
  }

  console.error("Order function error:", message);
  res.status(500).json({ error: "Could not place order" });
}
