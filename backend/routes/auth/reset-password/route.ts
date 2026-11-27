import bcrypt from "bcryptjs";
import { db } from "../../../lib/db";
import { consumeAuthToken } from "../../../lib/auth-tokens";
import { Router, type Request, type Response } from "express";

const router = Router();

async function handlePOST(req: Request, res: Response) {
  const token = String(req.body?.token ?? "");
  const password = String(req.body?.password ?? "");
  if (!token) return res.status(400).json({ error: "Reset link is invalid" });
  if (password.length < 8) {
    return res.status(400).json({ error: "Password must be at least 8 characters" });
  }

  try {
    const userId = await consumeAuthToken(token, "reset");
    if (!userId) return res.status(400).json({ error: "Reset link is invalid or has expired" });

    const hashed = await bcrypt.hash(password, 12);
    const updated = await db().from("users").update({ password: hashed }).eq("id", userId);
    const result = updated as unknown as { error?: unknown };
    if (result?.error) throw result.error;
    return res.json({ success: true, message: "Password updated. You can sign in now." });
  } catch (error) {
    console.error("Reset-password error:", error);
    return res.status(500).json({ error: "Could not reset password" });
  }
}

router.post("/", handlePOST);

export default router;
