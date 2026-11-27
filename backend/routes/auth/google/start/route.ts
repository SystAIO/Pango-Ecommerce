import {
  googleAuthorizeUrl,
  googlePkce,
  isGoogleConfigured,
  newState,
} from "../../../../lib/google-auth";
import { Router, type Request, type Response } from "express";

const router = Router();

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: 10 * 60 * 1000,
  path: "/",
};

/** GET /api/auth/google/start */
router.get("/", (_req: Request, res: Response) => {
  const site = String(process.env.FRONTEND_URL || "http://localhost:3000").replace(/\/$/, "");
  if (!isGoogleConfigured()) {
    return res.redirect(`${site}/login?error=google_not_configured`);
  }
  const state = newState();
  const { verifier, challenge } = googlePkce();
  res.cookie("google_oauth_state", state, cookieOptions);
  res.cookie("google_oauth_verifier", verifier, cookieOptions);
  return res.redirect(googleAuthorizeUrl(state, challenge));
});

export default router;
