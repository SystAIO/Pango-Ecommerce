import { consumeAuthToken, markEmailVerified } from "../../../lib/auth-tokens";
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

router.get("/", handleGET);

export default router;
