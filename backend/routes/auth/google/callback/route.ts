import bcrypt from "bcryptjs";
import { db } from "../../../../lib/db";
import { generateToken, nameFromEmail } from "../../../../lib/auth";
import { num } from "../../../../lib/supabase";
import { exchangeGoogleCode } from "../../../../lib/google-auth";
import { findUserByGoogleSub, linkGoogleAccount } from "../../../../lib/auth-tokens";
import { Router, type Request, type Response } from "express";

const router = Router();

function clearOAuthCookies(res: Response) {
  res.clearCookie("google_oauth_state", { path: "/" });
  res.clearCookie("google_oauth_verifier", { path: "/" });
}

/** GET /api/auth/google/callback?code=…&state=… */
router.get("/", async (req: Request, res: Response) => {
  const site = String(process.env.FRONTEND_URL || "http://localhost:3000").replace(/\/$/, "");
  const code = String(req.query.code ?? "");
  const state = String(req.query.state ?? "");
  const savedState = String(req.cookies?.google_oauth_state ?? "");
  const verifier = String(req.cookies?.google_oauth_verifier ?? "");

  if (!code || !state || !savedState || state !== savedState || !verifier) {
    clearOAuthCookies(res);
    return res.redirect(`${site}/login?error=google_state`);
  }
  clearOAuthCookies(res);

  try {
    const profile = await exchangeGoogleCode(code, verifier);
    if (!profile || !profile.emailVerified) {
      return res.redirect(`${site}/login?error=google_email_not_verified`);
    }

    let userId = await findUserByGoogleSub(profile.sub);
    if (!userId) {
      const existing = await db()
        .from("users")
        .select("id")
        .eq("email", profile.email)
        .maybeSingle();
      if (existing.data) {
        userId = num((existing.data as unknown as { id: unknown }).id);
      } else {
        const randomPassword = await bcrypt.hash(bcrypt.genSaltSync(12) + profile.sub, 12);
        const created = await db()
          .from("users")
          .insert({
            name: nameFromEmail(profile.email),
            email: profile.email,
            password: randomPassword,
            role: "user",
          })
          .select("id")
          .single();
        if (created.error) throw created.error;
        userId = num((created.data as unknown as { id: unknown }).id);
      }
      await linkGoogleAccount(userId, profile.sub);
    }

    const token = generateToken(userId, "user");
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/",
    });
    return res.redirect(`${site}/`);
  } catch (error) {
    console.error("Google OAuth callback failed:", error);
    return res.redirect(`${site}/login?error=google_failed`);
  }
});

export default router;
