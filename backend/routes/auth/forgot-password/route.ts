import { db } from "../../../lib/db";
import { num } from "../../../lib/supabase";
import { issueAuthToken } from "../../../lib/auth-tokens";
import { sendPasswordResetEmail } from "../../../lib/email";
import { Router, type Request, type Response } from "express";

const router = Router();

/** Always returns success so accounts cannot be enumerated. */
async function handlePOST(req: Request, res: Response) {
  const email = String(req.body?.email ?? "").trim().toLowerCase();
  const generic = {
    message: "If an account exists for that email, a reset link has been sent.",
  };
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return res.json(generic);
  }

  try {
    const { data } = await db()
      .from("users")
      .select("id, name")
      .eq("email", email)
      .maybeSingle();
    if (data) {
      const userId = num((data as unknown as { id: unknown }).id);
      const token = await issueAuthToken(userId, "reset", 1);
      await sendPasswordResetEmail(email, String((data as { name?: string }).name || "there"), token);
    }
  } catch (error) {
    console.error("Forgot-password error:", error);
  }
  return res.json(generic);
}

router.post("/", handlePOST);

export default router;
