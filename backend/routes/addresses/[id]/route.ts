import { db } from "../../../lib/db";
import { getSessionUser } from "../../../lib/auth";
import { validateAddress, type AddressInput } from "../../../lib/validation";
import { describeError, num } from "../../../lib/supabase";
import { Router, type Request, type Response } from "express";

const router = Router();

/** PATCH /api/addresses/[id] â€” update or set as default. */
async function handlePATCH(req: Request, res: Response) {
  const session = await getSessionUser(req);
  if (!session) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const id = req.params.id;
  let body: Partial<AddressInput>;
  try {
    body = req.body;
  } catch {
    return res.status(400).json({ error: "Invalid request body" });
  }

  try {
    const existingResult = await db()
      .from("addresses")
      .select("*")
      .eq("id", id)
      .eq("user_id", session.id)
      .maybeSingle();

    if (existingResult.error) throw existingResult.error;
    const existing = existingResult.data;
    if (!existing) {
      return res.status(404).json({ error: "Address not found" });
    }

    // Merge onto the stored row so a partial update (e.g. just flipping the default flag)
    // still validates against the complete address.
    const merged = {
      label: body.label ?? existing.label,
      fullName: body.fullName ?? existing.full_name,
      phone: body.phone ?? existing.phone,
      line1: body.line1 ?? existing.line1,
      line2: body.line2 ?? existing.line2,
      city: body.city ?? existing.city,
      state: body.state ?? existing.state,
      pincode: body.pincode ?? existing.pincode,
      isDefault: body.isDefault,
    };

    // `?only=default` is a lightweight "make this my default" action from the address list.
    const onlyDefault = new URL(req.url, "http://localhost").searchParams.get("only") === "default";
    if (!onlyDefault) {
      const errors = validateAddress(merged);
      if (Object.keys(errors).length > 0) {
        return res.status(400).json({ error: "Please fix the highlighted fields", errors });
      }
    }

    const makeDefault =
      onlyDefault || body.isDefault === true
        ? true
        : body.isDefault === false
          ? false
          : Boolean(existing.is_default);

    const { error } = await db().rpc("upsert_address", {
      p_user_id: session.id,
      p_id: num(id),
      p_label: String(merged.label ?? "Home").trim().slice(0, 60),
      p_full_name: String(merged.fullName).trim(),
      p_phone: String(merged.phone).trim(),
      p_line1: String(merged.line1).trim(),
      p_line2: String(merged.line2 ?? "").trim(),
      p_city: String(merged.city).trim(),
      p_state: String(merged.state).trim(),
      p_pincode: String(merged.pincode).trim(),
      p_make_default: makeDefault,
    });

    if (error) throw error;

    const updated = await db()
      .from("addresses")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (updated.error) throw updated.error;

    return res.json({ success: true, address: updated.data });
  } catch (error) {
    console.error(`PATCH /api/addresses/${id} error:`, describeError(error));
    return res.status(500).json({ error: "Could not update address" });
  }
}

/** DELETE /api/addresses/[id] */
async function handleDELETE(req: Request, res: Response) {
  const session = await getSessionUser(req);
  if (!session) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const id = req.params.id;

  try {
    // `delete_address` also promotes a new default when the one removed was the last,
    // so a customer is never left with an address book that has nothing preselected.
    const { data: affected, error } = await db().rpc("delete_address", {
      p_user_id: session.id,
      p_id: num(id),
    });

    if (error) throw error;

    if (!affected) {
      return res.status(404).json({ error: "Address not found" });
    }

    return res.json({ success: true });
  } catch (error) {
    console.error(`DELETE /api/addresses/${id} error:`, describeError(error));
    return res.status(500).json({ error: "Could not delete address" });
  }
}

router.patch("/:id", handlePATCH);
router.delete("/:id", handleDELETE);

export default router;
