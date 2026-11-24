import { db } from "../../../lib/db";
import { verifyToken } from "../../../lib/auth";
import { describeError, num } from "../../../lib/supabase";
import { Router, type Request, type Response } from "express";

const router = Router();

const PUBLIC_COLUMNS = "id, name, email, role";

async function handleGET(req: Request, res: Response) {
  const token =
    req.cookies?.token ||
    req.headers.authorization?.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ error: "Invalid token" });
  }

  try {
    const result = await db()
      .from("users")
      .select(PUBLIC_COLUMNS)
      .eq("id", decoded.userId)
      .maybeSingle();

    if (result.error) throw result.error;
    if (!result.data) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.json({
      user: { ...result.data, id: num(result.data.id) },
    });
  } catch (error) {
    console.error("GET /api/auth/me error:", describeError(error));
    return res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * PATCH /api/auth/me — update the signed-in customer's own details.
 *
 * The `users` table has no `phone` column of its own, so a phone number is stored on the
 * address book instead; this route only writes `name` and `email`. Email is re-validated
 * for uniqueness because it is the login identifier.
 *
 * The JWT embeds only `userId`, so changing these details does not require a re-login.
 */
async function handlePATCH(req: Request, res: Response) {
  const token =
    req.cookies?.token ||
    req.headers.authorization?.replace("Bearer ", "");
  const decoded = token ? verifyToken(token) : null;
  if (!decoded) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  let body: { name?: string; email?: string };
  try {
    body = req.body;
  } catch {
    return res.status(400).json({ error: "Invalid request body" });
  }

  const updates: Record<string, string> = {};

  if (body.name !== undefined) {
    const name = String(body.name).trim();
    if (name.length < 2) {
      return res.status(400).json({ error: "Please fix the highlighted fields", errors: { name: "Name must be at least 2 characters" } });
    }
    updates.name = name;
  }

  if (body.email !== undefined) {
    const email = String(body.email).trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      return res.status(400).json({ error: "Please fix the highlighted fields", errors: { email: "Enter a valid email address" } });
    }

    // Postgres raises a unique violation rather than returning no rows when two
    // requests race past this check, so 409 is also the fallback error below.
    const taken = await db()
      .from("users")
      .select("id")
      .eq("email", email)
      .neq("id", decoded.userId)
      .maybeSingle();

    if (taken.error) throw taken.error;
    if (taken.data) {
      return res.status(409).json({ error: "Please fix the highlighted fields", errors: { email: "That email is already registered" } });
    }
    updates.email = email;
  }

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: "Nothing to update" });
  }

  try {
    const result = await db()
      .from("users")
      .update(updates)
      .eq("id", decoded.userId)
      .select(PUBLIC_COLUMNS)
      .single();

    if (result.error) throw result.error;
    return res.json({ success: true, user: result.data });
  } catch (error) {
    const message = describeError(error);
    console.error("PATCH /api/auth/me error:", message);
    if (message.includes("23505")) {
      return res.status(409).json({ error: "Please fix the highlighted fields", errors: { email: "That email is already registered" } });
    }
    return res.status(500).json({ error: "Could not update profile" });
  }
}

router.get("/", handleGET);
router.patch("/", handlePATCH);

export default router;
