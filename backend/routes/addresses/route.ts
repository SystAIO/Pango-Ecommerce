import { db } from "../../lib/db";
import { getSessionUser } from "../../lib/auth";
import { validateAddress, type AddressInput } from "../../lib/validation";
import { describeError, num } from "../../lib/supabase";
import { Router, type Request, type Response } from "express";

const router = Router();

/** GET /api/addresses — the signed-in customer's saved addresses, default first. */
async function handleGET(req: Request, res: Response) {
  const session = await getSessionUser(req);
  if (!session) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  try {
    const result = await db()
      .from("addresses")
      .select("*")
      .eq("user_id", session.id)
      .order("is_default", { ascending: false })
      .order("id", { ascending: false });

    if (result.error) throw result.error;

    return res.json({ addresses: result.data ?? [] });
  } catch (error) {
    console.error("GET /api/addresses error:", describeError(error));
    return res.status(500).json({ error: "Could not load addresses" });
  }
}

/**
 * POST /api/addresses — save a new address.
 *
 * The first address a customer saves is always promoted to default, otherwise checkout would
 * have nothing to preselect. That promotion, and clearing the flag from any previous default,
 * happens together inside `upsert_address` so two concurrent saves cannot leave two defaults.
 */
async function handlePOST(req: Request, res: Response) {
  const session = await getSessionUser(req);
  if (!session) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  let body: Partial<AddressInput>;
  try {
    body = req.body;
  } catch {
    return res.status(400).json({ error: "Invalid request body" });
  }

  const errors = validateAddress(body);
  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ error: "Please fix the highlighted fields", errors });
  }

  try {
    const { data: addressId, error } = await db().rpc("upsert_address", {
      p_user_id: session.id,
      p_id: null,
      p_label: String(body.label ?? "Home").trim().slice(0, 60),
      p_full_name: String(body.fullName).trim(),
      p_phone: String(body.phone).trim(),
      p_line1: String(body.line1).trim(),
      p_line2: String(body.line2 ?? "").trim(),
      p_city: String(body.city).trim(),
      p_state: String(body.state).trim(),
      p_pincode: String(body.pincode).trim(),
      p_make_default: body.isDefault === true,
    });

    if (error) throw error;

    const created = await db()
      .from("addresses")
      .select("*")
      .eq("id", num(addressId))
      .maybeSingle();

    if (created.error) throw created.error;

    return res.status(201).json({ success: true, address: created.data });
  } catch (error) {
    console.error("POST /api/addresses error:", describeError(error));
    return res.status(500).json({ error: "Could not save address" });
  }
}

router.get("/", handleGET);
router.post("/", handlePOST);

export default router;
