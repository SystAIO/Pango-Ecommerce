import { consumeAuthToken, consumeOtp, markEmailVerified } from "../../../lib/auth-tokens";
import { generateToken } from "../../../lib/auth";
import { db } from "../../../lib/db";
import { num } from "../../../lib/supabase";
import { Router, type Request, type Response } from "express";

const router = Router();

/** GET /api/auth/verify-email?token=… — link from the Brevo verification email. */
async function handleGET(req: Request, res: Response) {
  const token = String(req.query.token ?? "");
  const site = String(process.env.FRONTEND_URL || "http://localhost:3000").replace(/\/$/, "");
  if (!token) return res.redirect(`${site}/?verified=0`);

  try {
    const userId = await consumeAuthToken(token, "verify");
    if (!userId) return res.redirect(`${site}/?verified=0`);
    await markEmailVerified(userId);
    return res.redirect(`${site}/?verified=1`);
  } catch (error) {
    console.error("Email verification failed:", error);
    return res.redirect(`${site}/?verified=0`);
  }
}

/** POST /api/auth/verify-email — OTP entered on the website after signup. */
async function handlePOST(req: Request, res: Response) {
  const email = String(req.body?.email ?? "").trim().toLowerCase();
  const otp = String(req.body?.otp ?? "").trim();
  if (!email || !/^\d{6}$/.test(otp)) {
    return res.status(400).json({ error: "Enter the 6-digit code we emailed you" });
  }
  try {
    const { data } = await db().from("users").select("id, role").eq("email", email).maybeSingle();
    if (!data) return res.status(400).json({ error: "We could not find that account" });
    const userId = num((data as unknown as { id: unknown }).id);
    if (!(await consumeOtp(userId, otp))) {
      return res.status(400).json({ error: "That code is wrong or has expired" });
    }
    await markEmailVerified(userId);

    const token = generateToken(userId, String((data as unknown as { role?: string }).role || "user"));
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/",
    });
    return res.json({ success: true, token, message: "Email verified" });
  } catch (error) {
    console.error("OTP verification failed:", error);
    return res.status(500).json({ error: "Could not verify your email" });
  }
}

router.get("/", handleGET);
router.post("/", handlePOST);

export default router;
