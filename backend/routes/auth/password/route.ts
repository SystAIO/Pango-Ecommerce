import bcrypt from "bcryptjs";
import { db } from "../../../lib/db";
import { getSessionUser } from "../../../lib/auth";
import { describeError } from "../../../lib/supabase";
import { Router, type Request, type Response } from "express";

const router = Router();

/**
 * POST /api/auth/password — change the signed-in customer's password.
 *
 * Requires the current password so a stolen session cookie alone cannot lock the real owner
 * out of their account. Other sessions are not invalidated, because tokens are stateless —
 * a future improvement would be a token version column on `users`.
 */
async function handlePOST(req: Request, res: Response) {
  const session = await getSessionUser(req);
  if (!session) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  let body: { currentPassword?: string; newPassword?: string };
  try {
    body = req.body;
  } catch {
    return res.status(400).json({ error: "Invalid request body" });
  }

  const currentPassword = String(body.currentPassword ?? "");
  const newPassword = String(body.newPassword ?? "");

  const errors: Record<string, string> = {};
  if (!currentPassword) errors.currentPassword = "Enter your current password";
  if (!newPassword) {
    errors.newPassword = "Enter a new password";
  } else if (newPassword.length < 8) {
    errors.newPassword = "Password must be at least 8 characters";
  } else if (newPassword === currentPassword) {
    errors.newPassword = "New password must be different from the current one";
  }

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ error: "Please fix the highlighted fields", errors });
  }

  try {
    const existing = await db()
      .from("users")
      .select("password")
      .eq("id", session.id)
      .maybeSingle();

    if (existing.error) throw existing.error;
    if (!existing.data) {
      return res.status(404).json({ error: "User not found" });
    }

    const isValid = await bcrypt.compare(currentPassword, existing.data.password);
    if (!isValid) {
      return res.status(401).json({
          error: "Please fix the highlighted fields",
          errors: { currentPassword: "That is not your current password" },
        });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    const { error } = await db()
      .from("users")
      .update({ password: hashed })
      .eq("id", session.id);
    if (error) throw error;

    return res.json({ success: true });
  } catch (error) {
    console.error("POST /api/auth/password error:", describeError(error));
    return res.status(500).json({ error: "Could not change password" });
  }
}

router.post("/", handlePOST);

export default router;
